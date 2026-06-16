"""Hybrid retrieval — reciprocal rank fusion of vector + keyword search."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Chunk, Link
from app.services.keyword_search import search_chunks_by_keyword
from app.services.vector_search import search_chunks_by_vector

RRF_K = 60


@dataclass(frozen=True)
class RetrievedPassage:
    chunk: Chunk
    rrf_score: float
    passage_id: int
    label: str
    citation_type: str
    locator: dict | None
    snippet: str


def _reciprocal_rank_fusion(
  rankings: list[list[uuid.UUID]],
  *,
  k: int = RRF_K,
) -> dict[uuid.UUID, float]:
    scores: dict[uuid.UUID, float] = {}
    for ranking in rankings:
        for rank, chunk_id in enumerate(ranking):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    return scores


def _chunk_label(chunk: Chunk) -> tuple[str, str, dict | None]:
    """Return (label, citation_type, locator) for a chunk."""
    if chunk.code_entity_id and chunk.code_entity:
        ce = chunk.code_entity
        line = ""
        if chunk.line_start:
            line = f":{chunk.line_start}"
            if chunk.line_end and chunk.line_end != chunk.line_start:
                line += f"-{chunk.line_end}"
        label = f"{ce.path}{line}"
        locator = {
            "path": ce.path,
            "line_start": chunk.line_start or ce.line_start,
            "line_end": chunk.line_end or ce.line_end,
            "commit_sha": ce.commit_sha,
            "code_entity_id": str(ce.id),
        }
        return label, "code", locator

    if chunk.artifact_id and chunk.artifact:
        art = chunk.artifact
        if art.artifact_type == "ticket":
            meta = art.metadata_ or {}
            number = meta.get("number")
            label = f"#{number} {art.title or ''}".strip() if number else (art.title or art.external_id)
            locator = {
                "artifact_id": str(art.id),
                "external_id": art.external_id,
                "number": number,
                "url": meta.get("html_url"),
            }
            return label, "ticket", locator

        if art.artifact_type == "doc":
            meta = art.metadata_ or {}
            filename = meta.get("filename") or art.title or "document"
            locator = {"artifact_id": str(art.id), "filename": filename}
            return filename, "doc", locator

        if art.artifact_type == "commit":
            meta = art.metadata_ or {}
            sha = (meta.get("sha") or art.external_id or "")[:8]
            label = f"commit {sha}"
            locator = {"artifact_id": str(art.id), "sha": meta.get("sha")}
            return label, "commit", locator

    source_name = chunk.source.name if chunk.source else "source"
    return source_name, "text", {"chunk_id": str(chunk.id)}


def _load_chunks(db: Session, chunk_ids: list[uuid.UUID]) -> dict[uuid.UUID, Chunk]:
    if not chunk_ids:
        return {}
    rows = db.execute(
        select(Chunk)
        .options(
            joinedload(Chunk.code_entity),
            joinedload(Chunk.artifact),
            joinedload(Chunk.source),
        )
        .where(Chunk.id.in_(chunk_ids))
    ).scalars()
    return {c.id: c for c in rows}


def _expand_neighbors(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    seed_chunk_ids: list[uuid.UUID],
    limit: int,
) -> list[uuid.UUID]:
    """Pull linked code chunks for artifact hits via the link table."""
    if not seed_chunk_ids:
        return []

    seeds = _load_chunks(db, seed_chunk_ids)
    artifact_ids = {c.artifact_id for c in seeds.values() if c.artifact_id}
    if not artifact_ids:
        return []

    links = db.execute(
        select(Link).where(
            Link.engagement_id == engagement_id,
            Link.artifact_id.in_(artifact_ids),
        )
    ).scalars().all()

    code_entity_ids = {link.code_entity_id for link in links}
    if not code_entity_ids:
        return []

    neighbor_chunks = db.execute(
        select(Chunk.id)
        .where(
            Chunk.engagement_id == engagement_id,
            Chunk.code_entity_id.in_(code_entity_ids),
        )
        .limit(limit)
    ).scalars().all()

    return [cid for cid in neighbor_chunks if cid not in seed_chunk_ids]


def hybrid_retrieve(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    query: str,
    limit: int = 12,
    neighbor_limit: int = 4,
) -> list[RetrievedPassage]:
    """Fuse vector + keyword rankings, expand graph neighbors, return passages."""
    cleaned = query.strip()
    if not cleaned:
        return []

    vector_hits = search_chunks_by_vector(db, engagement_id=engagement_id, query=cleaned, limit=limit)
    keyword_hits = search_chunks_by_keyword(db, engagement_id=engagement_id, query=cleaned, limit=limit)

    vector_ranking = [hit.chunk.id for hit in vector_hits]
    keyword_ranking = [hit.chunk.id for hit in keyword_hits]
    fused = _reciprocal_rank_fusion([vector_ranking, keyword_ranking])

    if not fused:
        return []

    neighbor_ids = _expand_neighbors(
        db,
        engagement_id=engagement_id,
        seed_chunk_ids=list(fused.keys())[:limit],
        limit=neighbor_limit,
    )
    for nid in neighbor_ids:
        fused[nid] = fused.get(nid, 0.0) + 0.5 / (RRF_K + 1)

    ranked_ids = sorted(fused.keys(), key=lambda cid: fused[cid], reverse=True)[: limit + neighbor_limit]
    chunks = _load_chunks(db, ranked_ids)

    passages: list[RetrievedPassage] = []
    for idx, chunk_id in enumerate(ranked_ids, start=1):
        chunk = chunks.get(chunk_id)
        if chunk is None:
            continue
        label, citation_type, locator = _chunk_label(chunk)
        snippet = chunk.content[:500] + ("…" if len(chunk.content) > 500 else "")
        passages.append(
            RetrievedPassage(
                chunk=chunk,
                rrf_score=fused[chunk_id],
                passage_id=idx,
                label=label,
                citation_type=citation_type,
                locator=locator,
                snippet=snippet,
            )
        )
    return passages

"""Library — indexed artifact listing per engagement."""

from __future__ import annotations

import uuid
from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Artifact, Chunk, CodeEntity, Interview, Link


@dataclass(frozen=True)
class LibraryLink:
    label: str
    variant: str  # code | ticket | interview | doc


@dataclass(frozen=True)
class LibraryArtifact:
    id: str
    name: str
    kind: str  # code | ticket | interview | doc
    meta: str
    chunk_count: int
    link_count: int
    last_modified: str | None
    authors: str | None
    lines: str | None
    links: list[LibraryLink]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "meta": self.meta,
            "chunk_count": self.chunk_count,
            "link_count": self.link_count,
            "last_modified": self.last_modified,
            "authors": self.authors,
            "lines": self.lines,
            "links": [{"label": link.label, "variant": link.variant} for link in self.links],
        }


@dataclass(frozen=True)
class LibrarySummary:
    total: int
    code: int
    ticket: int
    interview: int
    doc: int

    def to_dict(self) -> dict:
        return {
            "total": self.total,
            "code": self.code,
            "ticket": self.ticket,
            "interview": self.interview,
            "doc": self.doc,
        }


def _chunk_counts(
    db: Session, engagement_id: uuid.UUID
) -> tuple[dict[uuid.UUID, int], dict[uuid.UUID, int]]:
    rows = db.execute(
        select(Chunk.code_entity_id, Chunk.artifact_id, func.count())
        .where(Chunk.engagement_id == engagement_id)
        .group_by(Chunk.code_entity_id, Chunk.artifact_id)
    ).all()
    entity_counts: dict[uuid.UUID, int] = defaultdict(int)
    artifact_counts: dict[uuid.UUID, int] = defaultdict(int)
    for entity_id, artifact_id, count in rows:
        if entity_id:
            entity_counts[entity_id] += count
        if artifact_id:
            artifact_counts[artifact_id] += count
    return entity_counts, artifact_counts


def _link_counts_by_entity(db: Session, engagement_id: uuid.UUID) -> dict[uuid.UUID, int]:
    rows = db.execute(
        select(Link.code_entity_id, func.count())
        .where(Link.engagement_id == engagement_id, Link.code_entity_id.is_not(None))
        .group_by(Link.code_entity_id)
    ).all()
    return {entity_id: count for entity_id, count in rows}


def list_library_artifacts(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    kind: str | None = None,
    query: str | None = None,
    limit: int = 100,
) -> tuple[list[LibraryArtifact], LibrarySummary]:
    entity_chunk_counts, artifact_chunk_counts = _chunk_counts(db, engagement_id)
    entity_links = _link_counts_by_entity(db, engagement_id)
    artifacts: list[LibraryArtifact] = []

    entities = db.execute(
        select(CodeEntity).where(CodeEntity.engagement_id == engagement_id).limit(500)
    ).scalars().all()

    for entity in entities:
        chunk_count = entity_chunk_counts.get(entity.id, 0)
        link_count = entity_links.get(entity.id, 0)
        meta = entity.metadata_ or {}
        bytes_size = meta.get("bytes")
        meta_label = f"Code · {chunk_count} chunks"
        if bytes_size:
            meta_label += f" · {bytes_size:,} bytes"
        if link_count:
            meta_label += f" · {link_count} links"

        links: list[LibraryLink] = []
        if link_count:
            links.append(LibraryLink(label=f"{link_count} ticket links", variant="ticket"))

        artifacts.append(
            LibraryArtifact(
                id=str(entity.id),
                name=entity.path,
                kind="code",
                meta=meta_label,
                chunk_count=chunk_count,
                link_count=link_count,
                last_modified=None,
                authors=None,
                lines=None,
                links=links,
            )
        )

    ticket_rows = db.execute(
        select(Artifact).where(
            Artifact.engagement_id == engagement_id,
            Artifact.artifact_type == "ticket",
        )
    ).scalars().all()

    for art in ticket_rows:
        meta = art.metadata_ or {}
        number = meta.get("number")
        name = f"#{number}" if number else (art.title or art.external_id)
        chunk_count = artifact_chunk_counts.get(art.id, 0)
        artifacts.append(
            LibraryArtifact(
                id=str(art.id),
                name=name,
                kind="ticket",
                meta=f"Ticket · {chunk_count} chunks",
                chunk_count=chunk_count,
                link_count=0,
                last_modified=str(meta.get("updated_at") or meta.get("closed_at") or "") or None,
                authors=meta.get("author"),
                lines=None,
                links=[],
            )
        )

    doc_rows = db.execute(
        select(Artifact).where(
            Artifact.engagement_id == engagement_id,
            Artifact.artifact_type == "doc",
        )
    ).scalars().all()

    for art in doc_rows:
        meta = art.metadata_ or {}
        filename = meta.get("filename") or art.title or "document"
        chunk_count = artifact_chunk_counts.get(art.id, 0)
        artifacts.append(
            LibraryArtifact(
                id=str(art.id),
                name=filename,
                kind="doc",
                meta=f"Document · {chunk_count} chunks",
                chunk_count=chunk_count,
                link_count=0,
                last_modified=None,
                authors=None,
                lines=None,
                links=[],
            )
        )

    interviews = db.execute(
        select(Interview)
        .options(joinedload(Interview.segments))
        .where(Interview.engagement_id == engagement_id)
    ).scalars().unique().all()

    for interview in interviews:
        segment_count = len(interview.segments) if interview.segments else 0
        duration = interview.duration_seconds
        duration_label = f"{int(duration // 60)} min" if duration else "—"
        artifacts.append(
            LibraryArtifact(
                id=str(interview.id),
                name=interview.title,
                kind="interview",
                meta=f"Interview · {duration_label} · {segment_count} segments",
                chunk_count=segment_count,
                link_count=0,
                last_modified=interview.created_at.date().isoformat() if interview.created_at else None,
                authors=interview.expert_name,
                lines=None,
                links=[],
            )
        )

    if kind and kind != "all":
        filtered = [a for a in artifacts if a.kind == kind]
    else:
        filtered = list(artifacts)

    if query:
        q = query.lower().strip()
        filtered = [a for a in filtered if q in a.name.lower() or q in a.meta.lower()]

    filtered.sort(key=lambda a: (a.kind, a.name))
    filtered = filtered[:limit]

    summary = LibrarySummary(
        total=len(artifacts),
        code=sum(1 for a in artifacts if a.kind == "code"),
        ticket=sum(1 for a in artifacts if a.kind == "ticket"),
        interview=sum(1 for a in artifacts if a.kind == "interview"),
        doc=sum(1 for a in artifacts if a.kind == "doc"),
    )
    return filtered, summary

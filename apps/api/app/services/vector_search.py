"""pgvector cosine similarity search over chunks (tenant-scoped)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Chunk
from app.services.embeddings import embed_texts


@dataclass(frozen=True)
class VectorHit:
    chunk: Chunk
    distance: float

    @property
    def score(self) -> float:
        """Convert cosine distance to similarity (0–1, higher is better)."""
        return max(0.0, 1.0 - self.distance)


def search_chunks_by_vector(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    query: str,
    limit: int = 20,
) -> list[VectorHit]:
    """Return chunks ranked by cosine distance within one engagement."""
    cleaned = query.strip()
    if not cleaned:
        return []

    vectors = embed_texts([cleaned])
    if not vectors:
        return []

    query_vector = vectors[0]
    distance = Chunk.embedding.cosine_distance(query_vector).label("distance")

    rows = db.execute(
        select(Chunk, distance)
        .options(
            joinedload(Chunk.code_entity),
            joinedload(Chunk.artifact),
            joinedload(Chunk.source),
        )
        .where(
            Chunk.engagement_id == engagement_id,
            Chunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(limit)
    ).all()

    return [VectorHit(chunk=chunk, distance=float(dist)) for chunk, dist in rows]

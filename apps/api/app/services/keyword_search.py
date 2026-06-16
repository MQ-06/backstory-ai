"""Postgres full-text keyword search over chunks (tenant-scoped)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models import Chunk


@dataclass(frozen=True)
class KeywordHit:
    chunk: Chunk
    rank: float


def search_chunks_by_keyword(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    query: str,
    limit: int = 20,
) -> list[KeywordHit]:
    """Return chunks ranked by ts_rank within one engagement."""
    cleaned = query.strip()
    if not cleaned:
        return []

    ts_query = func.plainto_tsquery("english", cleaned)
    rank = func.ts_rank(Chunk.search_vector, ts_query).label("rank")

    rows = db.execute(
        select(Chunk, rank)
        .where(
            Chunk.engagement_id == engagement_id,
            Chunk.search_vector.op("@@")(ts_query),
        )
        .order_by(desc(rank))
        .limit(limit)
    ).all()

    return [KeywordHit(chunk=chunk, rank=float(score)) for chunk, score in rows]

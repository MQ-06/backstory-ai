"""Embed all chunks for a source after ingestion."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Chunk, Source
from app.services.embeddings import embed_texts


@dataclass
class EmbedResult:
    embedded: int
    skipped: bool = False
    reason: str | None = None

    def suffix(self) -> str:
        if self.embedded > 0:
            return f"; {self.embedded} vectors embedded"
        if self.skipped and self.reason == "no_api_key":
            return " (vectors skipped — set OPENAI_API_KEY or EMBEDDING_PROVIDER=local)"
        return ""


def embed_source_chunks(db: Session, source: Source) -> EmbedResult:
    settings = get_settings()
    if settings.embedding_provider == "openai" and not settings.openai_api_key:
        config = dict(source.config or {})
        config["embeddings_ready"] = False
        source.config = config
        return EmbedResult(embedded=0, skipped=True, reason="no_api_key")

    chunks = list(
        db.execute(
            select(Chunk)
            .where(Chunk.source_id == source.id, Chunk.embedding.is_(None))
            .order_by(Chunk.chunk_index)
        ).scalars()
    )
    if not chunks:
        config = dict(source.config or {})
        config["embeddings_ready"] = True
        config["embedded_count"] = 0
        source.config = config
        return EmbedResult(embedded=0)

    source.status_detail = f"Embedding {len(chunks)} chunks…"
    db.flush()

    embedded = 0
    batch_size = settings.embedding_batch_size

    for start in range(0, len(chunks), batch_size):
        batch = chunks[start : start + batch_size]
        vectors = embed_texts([c.content for c in batch])
        for chunk, vector in zip(batch, vectors, strict=True):
            chunk.embedding = vector
            embedded += 1
        db.flush()

    config = dict(source.config or {})
    config["embeddings_ready"] = True
    config["embedded_count"] = embedded
    source.config = config

    return EmbedResult(embedded=embedded)

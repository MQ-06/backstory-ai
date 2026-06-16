"""Shared ingestion helpers."""

import uuid

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import Artifact, Chunk, CodeEntity

CHUNK_MAX_CHARS = 2_000
CHUNK_OVERLAP_CHARS = 200


def clear_source_content(db: Session, source_id: uuid.UUID) -> None:
    db.execute(delete(Chunk).where(Chunk.source_id == source_id))
    db.execute(delete(Artifact).where(Artifact.source_id == source_id))
    db.execute(delete(CodeEntity).where(CodeEntity.source_id == source_id))
    db.flush()


def chunk_text(text: str, max_chars: int = CHUNK_MAX_CHARS, overlap: int = CHUNK_OVERLAP_CHARS):
    """Split text into overlapping chunks for retrieval."""
    normalized = text.replace("\r\n", "\n").strip()
    if not normalized:
        return

    # Prefer paragraph boundaries, then fall back to char windows.
    paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]
    buffer = ""
    index = 0

    def emit(chunk_text_value: str):
        nonlocal index
        if chunk_text_value.strip():
            yield index, chunk_text_value.strip()
            index += 1

    for para in paragraphs:
        if len(para) > max_chars:
            if buffer:
                yield from emit(buffer)
                buffer = ""
            start = 0
            while start < len(para):
                end = min(start + max_chars, len(para))
                yield from emit(para[start:end])
                if end >= len(para):
                    break
                start = max(end - overlap, start + 1)
            continue

        candidate = f"{buffer}\n\n{para}".strip() if buffer else para
        if len(candidate) <= max_chars:
            buffer = candidate
        else:
            if buffer:
                yield from emit(buffer)
            buffer = para

    if buffer:
        yield from emit(buffer)

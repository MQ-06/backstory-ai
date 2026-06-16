"""Free local embeddings via fastembed (no API key, runs on CPU)."""

from __future__ import annotations

from functools import lru_cache

from app.config import get_settings
from app.services.embeddings import truncate_for_embedding

# bge-small-en-v1.5 outputs 384-dimensional vectors.
LOCAL_MAX_INPUT_CHARS = 2_000


@lru_cache
def _get_embedder():
    from fastembed import TextEmbedding

    settings = get_settings()
    return TextEmbedding(model_name=settings.local_embedding_model)


def embed_texts_local(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    settings = get_settings()
    inputs = [truncate_for_embedding(t, max_chars=LOCAL_MAX_INPUT_CHARS) for t in texts]
    embedder = _get_embedder()
    vectors = [list(vec) for vec in embedder.embed(inputs)]
    expected = settings.embedding_dimensions
    for vector in vectors:
        if len(vector) != expected:
            raise RuntimeError(f"Expected {expected}-dim vectors, got {len(vector)}")
    return vectors

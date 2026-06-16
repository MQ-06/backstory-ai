"""Embedding clients — local (free) or OpenAI (paid API)."""

from __future__ import annotations

import httpx

from app.config import get_settings

OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings"
MAX_INPUT_CHARS = 8_000


def truncate_for_embedding(text: str, max_chars: int = MAX_INPUT_CHARS) -> str:
    cleaned = text.strip()
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[:max_chars]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return embedding vectors for a batch of texts."""
    settings = get_settings()
    if settings.embedding_provider == "openai":
        return _embed_openai(texts)
    return _embed_local(texts)


def _embed_local(texts: list[str]) -> list[list[float]]:
    from app.services.local_embeddings import embed_texts_local

    return embed_texts_local(texts)


def _embed_openai(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    if not texts:
        return []

    inputs = [truncate_for_embedding(t) for t in texts]
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.embedding_model,
        "input": inputs,
        "dimensions": settings.embedding_dimensions,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(OPENAI_EMBEDDINGS_URL, headers=headers, json=payload)
        if response.status_code == 401:
            raise RuntimeError("Invalid OPENAI_API_KEY")
        if response.status_code == 429:
            raise RuntimeError("OpenAI rate limit exceeded — retry later")
        response.raise_for_status()
        data = response.json()

    items = sorted(data["data"], key=lambda row: row["index"])
    vectors = [item["embedding"] for item in items]
    expected = settings.embedding_dimensions
    for vector in vectors:
        if len(vector) != expected:
            raise RuntimeError(f"Expected {expected}-dim vectors, got {len(vector)}")
    return vectors

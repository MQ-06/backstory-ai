"""Observability hooks — Langfuse tracing when LANGFUSE_* keys are set."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

from app.config import get_settings


@contextmanager
def trace_generation(
    name: str,
    *,
    metadata: dict[str, Any] | None = None,
) -> Iterator[None]:
    """Open a Langfuse trace span when configured; otherwise no-op."""
    settings = get_settings()
    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        yield
        return

    client = None
    trace = None
    try:
        from langfuse import Langfuse

        client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
        trace = client.trace(name=name, metadata=metadata or {})
        yield
    except Exception:
        yield
    finally:
        if trace is not None and client is not None:
            try:
                client.flush()
            except Exception:
                pass

"""Observability hooks — Langfuse tracing stub for Sprint 4."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator


@contextmanager
def trace_generation(
    name: str,
    *,
    metadata: dict[str, Any] | None = None,
) -> Iterator[None]:
    """No-op trace span; wire Langfuse when LANGFUSE_* keys are set."""
    _ = (name, metadata)
    yield

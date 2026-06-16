"""Deterministic code linking — file paths and ticket refs in artifact text."""

from __future__ import annotations

import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Artifact, Chunk, CodeEntity, Link

_PATH_RE = re.compile(
    r"(?:^|[\s\"'(\[{])([\w./-]+\.(?:py|js|ts|tsx|jsx|java|go|rb|sql|md|txt|json|yaml|yml|sh))\b",
    re.MULTILINE,
)
_TICKET_RE = re.compile(r"(?:#|issue\s+#?)(\d{1,6})\b", re.IGNORECASE)
_COMMIT_RE = re.compile(r"\b([0-9a-f]{7,40})\b")


def _normalize_path(path: str) -> str:
    return path.strip().lstrip("./")


def _find_code_entity(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    path: str,
) -> CodeEntity | None:
    normalized = _normalize_path(path)
    if not normalized:
        return None

    # Exact path match first.
    entity = db.execute(
        select(CodeEntity)
        .where(
            CodeEntity.engagement_id == engagement_id,
            CodeEntity.path == normalized,
        )
        .limit(1)
    ).scalar_one_or_none()
    if entity:
        return entity

    # Suffix match (e.g. src/foo.py when repo stores foo.py).
    return db.execute(
        select(CodeEntity)
        .where(
            CodeEntity.engagement_id == engagement_id,
            CodeEntity.path.endswith(normalized),
        )
        .limit(1)
    ).scalar_one_or_none()


def _link_exists(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    artifact_id: uuid.UUID,
    code_entity_id: uuid.UUID,
) -> bool:
    existing = db.execute(
        select(Link.id).where(
            Link.engagement_id == engagement_id,
            Link.artifact_id == artifact_id,
            Link.code_entity_id == code_entity_id,
        )
    ).scalar_one_or_none()
    return existing is not None


def _create_link(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    artifact_id: uuid.UUID,
    from_chunk_id: uuid.UUID | None,
    code_entity: CodeEntity,
    method: str,
    evidence: str,
) -> Link | None:
    if _link_exists(db, engagement_id=engagement_id, artifact_id=artifact_id, code_entity_id=code_entity.id):
        return None

    link = Link(
        engagement_id=engagement_id,
        artifact_id=artifact_id,
        from_chunk_id=from_chunk_id,
        code_entity_id=code_entity.id,
        confidence=1.0,
        method=method,
        evidence=evidence[:500],
    )
    db.add(link)
    return link


def link_artifact_chunk(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    artifact: Artifact,
    chunk: Chunk,
) -> int:
    """Scan one artifact chunk for deterministic references; return links created."""
    if artifact.artifact_type not in ("ticket", "doc", "commit", "interview"):
        return 0

    text = chunk.content or ""
    created = 0

    for match in _PATH_RE.finditer(text):
        path = _normalize_path(match.group(1))
        entity = _find_code_entity(db, engagement_id=engagement_id, path=path)
        if entity and _create_link(
            db,
            engagement_id=engagement_id,
            artifact_id=artifact.id,
            from_chunk_id=chunk.id,
            code_entity=entity,
            method="path_ref",
            evidence=path,
        ):
            created += 1

    for match in _TICKET_RE.finditer(text):
        # Ticket refs in code/docs may point to other tickets — skip for MVP unless we index by number.
        _ = match

    for match in _COMMIT_RE.finditer(text):
        sha = match.group(1)
        entity = db.execute(
            select(CodeEntity)
            .where(
                CodeEntity.engagement_id == engagement_id,
                CodeEntity.commit_sha.startswith(sha[:7]),
            )
            .limit(1)
        ).scalar_one_or_none()
        if entity and _create_link(
            db,
            engagement_id=engagement_id,
            artifact_id=artifact.id,
            from_chunk_id=chunk.id,
            code_entity=entity,
            method="commit_ref",
            evidence=sha,
        ):
            created += 1

    return created


def ensure_engagement_links(db: Session, engagement_id: uuid.UUID) -> int:
    """Build deterministic links for all artifact chunks in an engagement (idempotent)."""
    rows = db.execute(
        select(Chunk, Artifact)
        .join(Artifact, Chunk.artifact_id == Artifact.id)
        .where(
            Chunk.engagement_id == engagement_id,
            Chunk.artifact_id.is_not(None),
        )
    ).all()

    total = 0
    for chunk, artifact in rows:
        total += link_artifact_chunk(
            db,
            engagement_id=engagement_id,
            artifact=artifact,
            chunk=chunk,
        )
    db.flush()
    return total

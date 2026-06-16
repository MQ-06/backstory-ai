import re
import uuid
from datetime import datetime
from typing import Any, Literal

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext
from app.models import AuditEvent, Engagement, Source

SourceType = Literal["git", "tickets", "docs"]
SourceStatus = Literal["queued", "processing", "indexed", "error"]

_GITHUB_REPO_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/([\w.-]+)/([\w.-]+?)(?:\.git)?/?$",
    re.IGNORECASE,
)


class GitSourceCreate(BaseModel):
    type: Literal["git"] = "git"
    repo_url: str = Field(min_length=1, max_length=512)

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, value: str) -> str:
        if not _GITHUB_REPO_RE.match(value.strip()):
            raise ValueError("Enter a valid GitHub URL (https://github.com/owner/repo)")
        return value.strip().rstrip("/")


class SourceCreate(BaseModel):
    type: SourceType
    name: str | None = Field(default=None, max_length=255)
    repo_url: str | None = None
    project_key: str | None = None
    filename: str | None = None


class SourceOut(BaseModel):
    id: uuid.UUID
    engagement_id: uuid.UUID
    type: str
    name: str
    status: str
    external_id: str | None
    config: dict[str, Any] | None
    error_message: str | None
    status_detail: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


def _git_external_id(repo_url: str) -> tuple[str, str]:
    match = _GITHUB_REPO_RE.match(repo_url.strip())
    if not match:
        raise ValueError("Invalid GitHub URL")
    owner, repo = match.group(1), match.group(2)
    return f"github:{owner}/{repo}", f"{owner}/{repo}"


async def get_engagement_for_org(
    db: AsyncSession, engagement_id: uuid.UUID, org_id: uuid.UUID
) -> Engagement:
    result = await db.execute(
        select(Engagement).where(Engagement.id == engagement_id, Engagement.org_id == org_id)
    )
    engagement = result.scalar_one_or_none()
    if engagement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found")
    return engagement


async def list_sources(db: AsyncSession, engagement_id: uuid.UUID) -> list[Source]:
    result = await db.execute(
        select(Source)
        .where(Source.engagement_id == engagement_id)
        .order_by(Source.created_at.desc())
    )
    return list(result.scalars().all())


async def create_source(
    db: AsyncSession,
    auth: AuthContext,
    engagement: Engagement,
    payload: SourceCreate,
) -> Source:
    external_id: str | None = None
    config: dict[str, Any] = {}
    name = payload.name

    if payload.type == "git":
        if not payload.repo_url:
            raise HTTPException(status_code=400, detail="repo_url is required for git sources")
        try:
            external_id, default_name = _git_external_id(payload.repo_url)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        config = {"repo_url": payload.repo_url}
        name = name or default_name
    elif payload.type == "tickets":
        if not payload.project_key:
            raise HTTPException(status_code=400, detail="project_key is required for ticket sources")
        from app.services.ticket_ingest import parse_project_key

        try:
            owner, repo = parse_project_key(payload.project_key)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        repo_key = f"{owner}/{repo}"
        external_id = f"github_issues:{repo_key}"
        config = {"project_key": repo_key}
        name = name or f"Issues · {repo_key}"
    elif payload.type == "docs":
        raise HTTPException(
            status_code=400,
            detail="Use POST /sources/docs/upload with multipart file for documents",
        )

    assert name is not None

    if external_id:
        existing = await db.execute(
            select(Source).where(
                Source.engagement_id == engagement.id,
                Source.type == payload.type,
                Source.external_id == external_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This source is already connected for this engagement",
            )

    source = Source(
        engagement_id=engagement.id,
        type=payload.type,
        name=name,
        status="queued",
        external_id=external_id,
        config=config,
        status_detail="Queued for ingestion",
    )
    db.add(source)
    await db.flush()

    db.add(
        AuditEvent(
            engagement_id=engagement.id,
            clerk_user_id=auth.clerk_user_id,
            action="source.create",
            detail=f'type={payload.type} name="{name}"',
        )
    )
    await db.commit()
    await db.refresh(source)
    return source


def enqueue_source_ingest(source_id: uuid.UUID) -> None:
    from app.tasks.ingest import run_source_ingest

    try:
        run_source_ingest.delay(str(source_id))
    except Exception as exc:
        # Keep source queued if broker is down — worker can pick up after resync.
        raise RuntimeError(
            "Source saved but ingest queue is unavailable. "
            "Start Redis (make up) and the worker (make dev-worker), then re-sync."
        ) from exc


async def create_doc_source_from_bytes(
    db: AsyncSession,
    auth: AuthContext,
    engagement: Engagement,
    filename: str,
    data: bytes,
) -> Source:
    from pathlib import Path

    from app.config import get_settings
    from app.services.storage import save_upload_bytes

    settings = get_settings()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    suffix = Path(filename).suffix.lower()
    from app.services.doc_ingest import SUPPORTED_EXTENSIONS

    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported type. Allowed: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    import hashlib

    file_hash = hashlib.sha256(data).hexdigest()[:16]
    external_id = f"doc:{file_hash}:{Path(filename).name}"

    existing = await db.execute(
        select(Source).where(
            Source.engagement_id == engagement.id,
            Source.type == "docs",
            Source.external_id == external_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This document was already uploaded for this engagement",
        )

    source = Source(
        engagement_id=engagement.id,
        type="docs",
        name=Path(filename).name,
        status="queued",
        external_id=external_id,
        config={"filename": Path(filename).name},
        status_detail="Queued for ingestion",
    )
    db.add(source)
    await db.flush()

    storage_path = save_upload_bytes(str(engagement.id), str(source.id), filename, data)
    source.config = {**(source.config or {}), "storage_path": storage_path, "filename": Path(filename).name}

    db.add(
        AuditEvent(
            engagement_id=engagement.id,
            clerk_user_id=auth.clerk_user_id,
            action="source.create",
            detail=f'type=docs name="{filename}"',
        )
    )
    await db.commit()
    await db.refresh(source)
    return source

"""Library API — indexed artifacts per engagement."""

from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth import AuthContext, require_org
from app.db import get_db
from app.db_sync import get_sync_db
from app.services.library import list_library_artifacts
from app.services.sources import get_engagement_for_org
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["library"])


class LibraryLinkOut(BaseModel):
    label: str
    variant: str


class LibraryArtifactOut(BaseModel):
    id: str
    name: str
    kind: str
    meta: str
    chunk_count: int
    link_count: int
    last_modified: str | None
    authors: str | None
    lines: str | None
    links: list[LibraryLinkOut]


class LibrarySummaryOut(BaseModel):
    total: int
    code: int
    ticket: int
    interview: int
    doc: int


class LibraryResponse(BaseModel):
    artifacts: list[LibraryArtifactOut]
    summary: LibrarySummaryOut


@router.get("/engagements/{engagement_id}/library", response_model=LibraryResponse)
async def get_library(
    engagement_id: uuid.UUID,
    kind: str | None = Query(default=None, pattern="^(all|code|ticket|interview|doc)$"),
    q: str | None = Query(default=None, max_length=255),
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> LibraryResponse:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _list():
        with get_sync_db() as sync_db:
            return list_library_artifacts(
                sync_db,
                engagement_id=engagement_id,
                kind=kind,
                query=q,
            )

    rows, summary = await asyncio.to_thread(_list)
    return LibraryResponse(
        artifacts=[LibraryArtifactOut.model_validate(a.to_dict()) for a in rows],
        summary=LibrarySummaryOut.model_validate(summary.to_dict()),
    )

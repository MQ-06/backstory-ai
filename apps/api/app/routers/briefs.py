"""Archaeology Brief API — Feature 10."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, require_org
from app.db import get_db
from app.db_sync import get_sync_db
from app.services.archaeology_brief import generate_brief, get_brief, list_briefs
from app.services.sources import get_engagement_for_org

router = APIRouter(tags=["briefs"])


class BriefCreate(BaseModel):
    expert_name: str | None = Field(default=None, max_length=255)
    module_path: str | None = Field(default=None, max_length=1024)


class BriefQuestionOut(BaseModel):
    id: uuid.UUID
    rank: int
    question_text: str
    evidence: dict | None

    model_config = {"from_attributes": True}


class BriefOut(BaseModel):
    id: uuid.UUID
    engagement_id: uuid.UUID
    expert_name: str | None
    module_path: str | None
    status: str
    signals: list | None
    error_message: str | None
    created_at: datetime
    questions: list[BriefQuestionOut] = []

    model_config = {"from_attributes": True}


def _to_out(brief) -> BriefOut:
    questions = sorted(brief.questions, key=lambda q: q.rank) if brief.questions else []
    return BriefOut(
        id=brief.id,
        engagement_id=brief.engagement_id,
        expert_name=brief.expert_name,
        module_path=brief.module_path,
        status=brief.status,
        signals=brief.signals,
        error_message=brief.error_message,
        created_at=brief.created_at,
        questions=[BriefQuestionOut.model_validate(q) for q in questions],
    )


@router.get("/engagements/{engagement_id}/briefs", response_model=list[BriefOut])
async def get_briefs(
    engagement_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> list[BriefOut]:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _list():
        with get_sync_db() as sync_db:
            return list_briefs(sync_db, engagement_id)

    briefs = await asyncio.to_thread(_list)
    return [_to_out(b) for b in briefs]


@router.post("/engagements/{engagement_id}/briefs", response_model=BriefOut, status_code=201)
async def post_brief(
    engagement_id: uuid.UUID,
    payload: BriefCreate,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> BriefOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    try:
        def _generate():
            with get_sync_db() as sync_db:
                return generate_brief(
                    sync_db,
                    auth,
                    engagement_id=engagement_id,
                    expert_name=payload.expert_name,
                    module_path=payload.module_path,
                )

        brief = await asyncio.to_thread(_generate)
        brief_id = brief.id
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    def _load():
        with get_sync_db() as sync_db:
            return get_brief(sync_db, brief_id, engagement_id)

    loaded = await asyncio.to_thread(_load)
    if loaded is None:
        raise HTTPException(status_code=500, detail="Brief not found after generation")
    return _to_out(loaded)


@router.get("/engagements/{engagement_id}/briefs/{brief_id}", response_model=BriefOut)
async def get_brief_detail(
    engagement_id: uuid.UUID,
    brief_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> BriefOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _get():
        with get_sync_db() as sync_db:
            return get_brief(sync_db, brief_id, engagement_id)

    brief = await asyncio.to_thread(_get)
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not found")
    return _to_out(brief)

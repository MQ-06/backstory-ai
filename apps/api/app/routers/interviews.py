"""Interview capture API — Feature 5."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, require_org
from app.config import get_settings
from app.db import get_db
from app.db_sync import get_sync_db
from app.services.interview_storage import resolve_media_path, save_interview_media
from app.services.interviews import (
    attach_media,
    create_interview,
    get_interview,
    list_interviews,
    record_consent,
)
from app.services.sources import get_engagement_for_org
from app.tasks.transcribe import run_interview_transcribe

router = APIRouter(tags=["interviews"])


class InterviewCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    expert_name: str | None = Field(default=None, max_length=255)
    brief_id: uuid.UUID | None = None


class TranscriptSegmentOut(BaseModel):
    id: uuid.UUID
    segment_index: int
    start_seconds: float
    end_seconds: float
    text: str

    model_config = {"from_attributes": True}


class InterviewOut(BaseModel):
    id: uuid.UUID
    engagement_id: uuid.UUID
    brief_id: uuid.UUID | None
    title: str
    expert_name: str | None
    status: str
    status_detail: str | None
    error_message: str | None
    media_mime: str | None
    duration_seconds: float | None
    consent_at: datetime | None
    created_at: datetime
    segments: list[TranscriptSegmentOut] = []

    model_config = {"from_attributes": True}


def _to_out(interview) -> InterviewOut:
    segments = sorted(interview.segments, key=lambda s: s.segment_index) if interview.segments else []
    return InterviewOut(
        id=interview.id,
        engagement_id=interview.engagement_id,
        brief_id=interview.brief_id,
        title=interview.title,
        expert_name=interview.expert_name,
        status=interview.status,
        status_detail=interview.status_detail,
        error_message=interview.error_message,
        media_mime=interview.media_mime,
        duration_seconds=interview.duration_seconds,
        consent_at=interview.consent_at,
        created_at=interview.created_at,
        segments=[TranscriptSegmentOut.model_validate(s) for s in segments],
    )


@router.get("/engagements/{engagement_id}/interviews", response_model=list[InterviewOut])
async def get_interviews(
    engagement_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> list[InterviewOut]:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _list():
        with get_sync_db() as sync_db:
            return list_interviews(sync_db, engagement_id)

    rows = await asyncio.to_thread(_list)
    return [_to_out(i) for i in rows]


@router.post("/engagements/{engagement_id}/interviews", response_model=InterviewOut, status_code=201)
async def post_interview(
    engagement_id: uuid.UUID,
    payload: InterviewCreate,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> InterviewOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _create():
        with get_sync_db() as sync_db:
            return create_interview(
                sync_db,
                auth,
                engagement_id=engagement_id,
                title=payload.title,
                expert_name=payload.expert_name,
                brief_id=payload.brief_id,
            )

    interview = await asyncio.to_thread(_create)
    return _to_out(interview)


@router.get("/engagements/{engagement_id}/interviews/{interview_id}", response_model=InterviewOut)
async def get_interview_detail(
    engagement_id: uuid.UUID,
    interview_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> InterviewOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _get():
        with get_sync_db() as sync_db:
            return get_interview(sync_db, interview_id, engagement_id)

    interview = await asyncio.to_thread(_get)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return _to_out(interview)


@router.post("/engagements/{engagement_id}/interviews/{interview_id}/consent", response_model=InterviewOut)
async def post_consent(
    engagement_id: uuid.UUID,
    interview_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> InterviewOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _consent():
        with get_sync_db() as sync_db:
            interview = get_interview(sync_db, interview_id, engagement_id)
            if interview is None:
                return None
            return record_consent(sync_db, interview)

    interview = await asyncio.to_thread(_consent)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return _to_out(interview)


@router.post("/engagements/{engagement_id}/interviews/{interview_id}/upload", response_model=InterviewOut)
async def upload_interview_media(
    engagement_id: uuid.UUID,
    interview_id: uuid.UUID,
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> InterviewOut:
    assert auth.org is not None
    settings = get_settings()
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    if not file.filename:
        raise HTTPException(status_code=400, detail="filename is required")

    data = await file.read()
    if len(data) > settings.interview_max_upload_bytes:
        raise HTTPException(status_code=413, detail="Recording too large")

    def _save():
        with get_sync_db() as sync_db:
            interview = get_interview(sync_db, interview_id, engagement_id)
            if interview is None:
                return None
            if interview.consent_at is None:
                raise ValueError("Consent required before upload")
            path, mime = save_interview_media(
                str(engagement_id),
                str(interview_id),
                file.filename or "recording.webm",
                data,
            )
            return attach_media(sync_db, interview, path, mime)

    try:
        interview = await asyncio.to_thread(_save)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return _to_out(interview)


@router.post("/engagements/{engagement_id}/interviews/{interview_id}/transcribe", response_model=InterviewOut)
async def post_transcribe(
    engagement_id: uuid.UUID,
    interview_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> InterviewOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _enqueue():
        with get_sync_db() as sync_db:
            interview = get_interview(sync_db, interview_id, engagement_id)
            if interview is None:
                return None
            if not interview.media_path:
                raise ValueError("Upload a recording first")
            interview.status = "queued"
            interview.status_detail = "Queued for transcription"
            sync_db.flush()
            return interview.id

    try:
        iid = await asyncio.to_thread(_enqueue)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if iid is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    try:
        run_interview_transcribe.delay(str(iid))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    def _get():
        with get_sync_db() as sync_db:
            return get_interview(sync_db, interview_id, engagement_id)

    interview = await asyncio.to_thread(_get)
    assert interview is not None
    return _to_out(interview)


@router.get("/engagements/{engagement_id}/interviews/{interview_id}/media")
async def stream_interview_media(
    engagement_id: uuid.UUID,
    interview_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
):
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)

    def _path():
        with get_sync_db() as sync_db:
            interview = get_interview(sync_db, interview_id, engagement_id)
            if interview is None or not interview.media_path:
                return None, None
            return resolve_media_path(interview.media_path), interview.media_mime

    path, mime = await asyncio.to_thread(_path)
    if path is None or not path.is_file():
        raise HTTPException(status_code=404, detail="Media not found")
    return FileResponse(path, media_type=mime or "application/octet-stream")

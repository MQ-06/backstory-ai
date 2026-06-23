import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, require_org
from app.config import get_settings
from app.db import get_db
from app.models import Source
from app.services.sources import (
    SourceCreate,
    SourceOut,
    create_doc_source_from_bytes,
    create_source,
    schedule_source_ingest,
    get_engagement_for_org,
    list_sources,
)

router = APIRouter(tags=["sources"])


@router.get("/engagements/{engagement_id}/sources", response_model=list[SourceOut])
async def get_sources(
    engagement_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> list[SourceOut]:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)
    sources = await list_sources(db, engagement_id)
    return [SourceOut.model_validate(s) for s in sources]


@router.post(
    "/engagements/{engagement_id}/sources",
    response_model=SourceOut,
    status_code=201,
)
async def post_source(
    engagement_id: uuid.UUID,
    payload: SourceCreate,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> SourceOut:
    assert auth.org is not None
    engagement = await get_engagement_for_org(db, engagement_id, auth.org.id)
    source = await create_source(db, auth, engagement, payload)
    try:
        schedule_source_ingest(source.id, background_tasks)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return SourceOut.model_validate(source)


@router.post(
    "/engagements/{engagement_id}/sources/docs/upload",
    response_model=SourceOut,
    status_code=201,
)
async def upload_doc_source(
    engagement_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> SourceOut:
    assert auth.org is not None
    settings = get_settings()
    engagement = await get_engagement_for_org(db, engagement_id, auth.org.id)

    if not file.filename:
        raise HTTPException(status_code=400, detail="filename is required")

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    source = await create_doc_source_from_bytes(db, auth, engagement, file.filename, data)
    try:
        schedule_source_ingest(source.id, background_tasks)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return SourceOut.model_validate(source)


@router.post("/engagements/{engagement_id}/sources/{source_id}/sync", response_model=SourceOut)
async def resync_source(
    engagement_id: uuid.UUID,
    source_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> SourceOut:
    assert auth.org is not None
    await get_engagement_for_org(db, engagement_id, auth.org.id)
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.engagement_id == engagement_id)
    )
    source = result.scalar_one_or_none()
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    source.status = "queued"
    source.error_message = None
    source.status_detail = "Queued for re-sync"
    await db.commit()
    await db.refresh(source)
    try:
        schedule_source_ingest(source.id, background_tasks)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return SourceOut.model_validate(source)

import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, require_org
from app.db import get_db
from app.services.engagements import (
    EngagementCreate,
    EngagementOut,
    create_engagement,
    delete_engagement,
    list_engagements,
)

router = APIRouter(prefix="/engagements", tags=["engagements"])


@router.get("", response_model=list[EngagementOut])
async def get_engagements(
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> list[EngagementOut]:
    assert auth.org is not None
    engagements = await list_engagements(db, auth.org.id)
    return [EngagementOut.model_validate(e) for e in engagements]


@router.post("", response_model=EngagementOut, status_code=201)
async def post_engagement(
    payload: EngagementCreate,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> EngagementOut:
    engagement = await create_engagement(db, auth, payload)
    return EngagementOut.model_validate(engagement)


@router.delete("/{engagement_id}", status_code=204)
async def remove_engagement(
    engagement_id: uuid.UUID,
    auth: AuthContext = Depends(require_org),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await delete_engagement(db, auth, engagement_id)
    return Response(status_code=204)

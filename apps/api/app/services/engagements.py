import uuid
from datetime import datetime

from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext
from app.models import AuditEvent, Engagement


class EngagementCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class EngagementOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


async def list_engagements(db: AsyncSession, org_id: uuid.UUID) -> list[Engagement]:
    result = await db.execute(
        select(Engagement).where(Engagement.org_id == org_id).order_by(Engagement.created_at.desc())
    )
    return list(result.scalars().all())


async def create_engagement(
    db: AsyncSession,
    auth: AuthContext,
    payload: EngagementCreate,
) -> Engagement:
    assert auth.org is not None
    engagement = Engagement(org_id=auth.org.id, name=payload.name)
    db.add(engagement)
    await db.flush()

    db.add(
        AuditEvent(
            engagement_id=engagement.id,
            clerk_user_id=auth.clerk_user_id,
            action="engagement.create",
            detail=f'name="{payload.name}"',
        )
    )
    await db.commit()
    await db.refresh(engagement)
    return engagement


async def delete_engagement(
    db: AsyncSession,
    auth: AuthContext,
    engagement_id: uuid.UUID,
) -> None:
    assert auth.org is not None
    result = await db.execute(
        select(Engagement).where(
            Engagement.id == engagement_id,
            Engagement.org_id == auth.org.id,
        )
    )
    engagement = result.scalar_one_or_none()
    if engagement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found")

    db.add(
        AuditEvent(
            engagement_id=None,
            clerk_user_id=auth.clerk_user_id,
            action="engagement.delete",
            detail=f'id="{engagement_id}" name="{engagement.name}"',
        )
    )
    await db.execute(
        update(AuditEvent)
        .where(AuditEvent.engagement_id == engagement_id)
        .values(engagement_id=None)
    )
    await db.delete(engagement)
    await db.commit()

import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import select
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

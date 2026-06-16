"""Interview session lifecycle."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.auth import AuthContext
from app.models import AuditEvent, Interview, Source, TranscriptSegment


def create_interview(
    db: Session,
    auth: AuthContext,
    *,
    engagement_id: uuid.UUID,
    title: str,
    expert_name: str | None = None,
    brief_id: uuid.UUID | None = None,
) -> Interview:
    source = Source(
        engagement_id=engagement_id,
        type="interview",
        name=title,
        status="draft",
        external_id=f"interview_source:{uuid.uuid4()}",
        config={"interview": True},
    )
    db.add(source)
    db.flush()

    interview = Interview(
        engagement_id=engagement_id,
        brief_id=brief_id,
        source_id=source.id,
        clerk_user_id=auth.clerk_user_id,
        title=title,
        expert_name=expert_name,
        status="draft",
        status_detail="Awaiting recording upload",
    )
    db.add(interview)
    db.add(
        AuditEvent(
            engagement_id=engagement_id,
            clerk_user_id=auth.clerk_user_id,
            action="interview.create",
            detail=f'title="{title}"',
        )
    )
    db.flush()
    return interview


def record_consent(db: Session, interview: Interview) -> Interview:
    interview.consent_at = datetime.now(UTC)
    interview.status_detail = "Consent recorded"
    db.flush()
    return interview


def attach_media(db: Session, interview: Interview, media_path: str, media_mime: str) -> Interview:
    interview.media_path = media_path
    interview.media_mime = media_mime
    interview.status = "uploaded"
    interview.status_detail = "Media uploaded — ready to transcribe"
    db.flush()
    return interview


def get_interview(db: Session, interview_id: uuid.UUID, engagement_id: uuid.UUID) -> Interview | None:
    return db.execute(
        select(Interview)
        .options(joinedload(Interview.segments))
        .where(Interview.id == interview_id, Interview.engagement_id == engagement_id)
    ).unique().scalar_one_or_none()


def list_interviews(db: Session, engagement_id: uuid.UUID) -> list[Interview]:
    return list(
        db.execute(
            select(Interview)
            .options(joinedload(Interview.segments))
            .where(Interview.engagement_id == engagement_id)
            .order_by(Interview.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )


def delete_interview_segments(db: Session, interview_id: uuid.UUID) -> None:
    rows = db.execute(
        select(TranscriptSegment).where(TranscriptSegment.interview_id == interview_id)
    ).scalars().all()
    for row in rows:
        db.delete(row)
    db.flush()

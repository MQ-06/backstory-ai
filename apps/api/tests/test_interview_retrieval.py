"""Transcript ingest → hybrid retrieval interview citation locator."""

from __future__ import annotations

import uuid

import pytest

from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import Artifact, Chunk, Engagement, Interview, Org, Source
from app.services.hybrid_retrieval import hybrid_retrieve
from app.services.transcribe import TranscriptSegmentData
from app.services.transcript_ingest import ingest_transcript_segments


@pytest.fixture
def indexed_interview(requires_postgres) -> tuple[Interview, Engagement]:
    with get_sync_db() as db:
        org = Org(clerk_org_id=f"org_ret_{uuid.uuid4().hex[:8]}", name="Retrieval Org")
        db.add(org)
        db.flush()
        engagement = Engagement(org_id=org.id, name="Retrieval Engagement")
        db.add(engagement)
        db.flush()

        source = Source(
            engagement_id=engagement.id,
            type="interview",
            name="Session",
            status="draft",
            external_id=f"interview_source:{uuid.uuid4()}",
            config={"interview": True},
        )
        db.add(source)
        db.flush()

        interview = Interview(
            engagement_id=engagement.id,
            source_id=source.id,
            clerk_user_id="user_ret",
            title="Month-end batch",
            expert_name="Sara",
            status="uploaded",
        )
        db.add(interview)
        db.flush()
        iid = interview.id
        eid = engagement.id

    with get_sync_db() as db:
        interview = db.get(Interview, iid)
        segments = [
            TranscriptSegmentData(
                start_seconds=87.0,
                end_seconds=102.5,
                text="The payroll job fails when February has 29 days due to the banking API workaround.",
            ),
            TranscriptSegmentData(
                start_seconds=102.5,
                end_seconds=118.0,
                text="We never remove the date check — Ahmed set it after the 1996 incident.",
            ),
        ]
        ingest_transcript_segments(db, interview, segments)

    with get_sync_db() as db:
        interview = db.get(Interview, iid)
        engagement = db.get(Engagement, eid)
        return interview, engagement


def test_ingest_creates_interview_artifacts(indexed_interview):
    interview, engagement = indexed_interview
    with get_sync_db() as db:
        artifacts = list(
            db.execute(select(Artifact).where(Artifact.engagement_id == engagement.id)).scalars().all()
        )
        chunks = list(
            db.execute(select(Chunk).where(Chunk.engagement_id == engagement.id)).scalars().all()
        )
    assert len(artifacts) == 2
    assert all(a.artifact_type == "interview" for a in artifacts)
    meta = artifacts[0].metadata_ or {}
    assert meta["interview_id"] == str(interview.id)
    assert meta["start_seconds"] == 87.0
    assert len(chunks) == 2


def test_hybrid_retrieval_interview_citation_locator(indexed_interview):
    interview, engagement = indexed_interview
    with get_sync_db() as db:
        passages = hybrid_retrieve(
            db,
            engagement_id=engagement.id,
            query="payroll job fails February banking API workaround",
            limit=5,
        )
    interview_passages = [p for p in passages if p.citation_type == "interview"]
    assert interview_passages, "Expected interview chunk in retrieval results"
    top = interview_passages[0]
    assert top.locator is not None
    assert top.locator["interview_id"] == str(interview.id)
    assert float(top.locator["start_seconds"]) == 87.0
    assert "▶" in top.label
    assert "Sara" in top.label or "1:" in top.label

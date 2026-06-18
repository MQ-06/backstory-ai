"""Eval gate — CI release thresholds (see knowledge/eval-thresholds.md)."""

import uuid

from sqlalchemy import select

from app.db_sync import get_sync_db
from app.eval.runner import (
    RECALL_AT_K_MIN,
    RECALL_K,
    eval_gate_passed,
    run_eval_gate,
)
from app.models import Chunk, Engagement, Interview, Org, Source
from app.services.hybrid_retrieval import hybrid_retrieve
from app.services.transcribe import TranscriptSegmentData
from app.services.transcript_ingest import ingest_transcript_segments


def test_eval_gate_metrics_pass_thresholds():
    metrics = run_eval_gate()
    assert eval_gate_passed(metrics), metrics
    assert metrics["unsupported_claim_rate"] == 0.0
    assert metrics["refusal_accuracy"] >= 0.95
    assert metrics["citation_correctness"] >= 0.90


def test_recall_at_k_on_seeded_interview(requires_postgres):
    """Recall@5 for a curated question over seeded interview content."""
    with get_sync_db() as db:
        org = Org(clerk_org_id=f"org_eval_{uuid.uuid4().hex[:8]}", name="Eval Org")
        db.add(org)
        db.flush()
        engagement = Engagement(org_id=org.id, name="Eval Engagement")
        db.add(engagement)
        db.flush()

        source = Source(
            engagement_id=engagement.id,
            type="interview",
            name="Eval session",
            status="draft",
            external_id=f"interview_source:{uuid.uuid4()}",
            config={"interview": True},
        )
        db.add(source)
        db.flush()

        interview = Interview(
            engagement_id=engagement.id,
            source_id=source.id,
            clerk_user_id="eval_user",
            title="Eval interview",
            expert_name="Ahmed",
            status="uploaded",
        )
        db.add(interview)
        db.flush()

        segments = [
            TranscriptSegmentData(
                0.0,
                10.0,
                "The month-end payroll batch fails when February has 29 days due to legacy banking API.",
            )
        ]
        ingest_transcript_segments(db, interview, segments)
        eid = engagement.id

    with get_sync_db() as db:
        chunk = db.execute(
            select(Chunk).where(Chunk.engagement_id == eid).limit(1)
        ).scalar_one()
        expected_id = chunk.id
        passages = hybrid_retrieve(
            db,
            engagement_id=eid,
            query="payroll batch fails February 29 days banking API",
            limit=RECALL_K,
        )
        retrieved_ids = [p.chunk.id for p in passages]

    recall = 1.0 if expected_id in retrieved_ids[:RECALL_K] else 0.0
    assert recall >= RECALL_AT_K_MIN

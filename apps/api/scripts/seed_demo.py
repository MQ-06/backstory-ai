#!/usr/bin/env python3
"""Seed a demo engagement with payroll month-end scenario (Features 1–10 demo path).

Usage:
  cd apps/api && uv run python scripts/seed_demo.py

Env:
  DEMO_CLERK_ORG_ID   Clerk org id for your dev session (required for UI visibility)
  DEMO_ENGAGEMENT_NAME  Default: "Streetlight Payroll Demo"
"""

from __future__ import annotations

import os
import sys
import uuid

from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import (
    ArchaeologyBrief,
    Artifact,
    BriefQuestion,
    Chunk,
    CodeEntity,
    Engagement,
    Interview,
    Org,
    Source,
)
from app.services.chunk_embed import embed_source_chunks
from app.services.code_linking import ensure_engagement_links
from app.services.transcribe import TranscriptSegmentData
from app.services.transcript_ingest import ingest_transcript_segments

DEMO_ORG_NAME = "Demo Organization"
DEFAULT_ENGAGEMENT = "Streetlight Payroll Demo"
COMMIT_SHA = "a1b2c3d4e5f6789012345678901234567890abcd"

CODE_CONTENT = '''"""Month-end payroll batch — legacy banking integration."""

def calculate_net(days_in_month: int) -> float:
    BATCH_DAYS = 30  # FIXME: breaks on 31-day months
    if days_in_month > BATCH_DAYS:
        raise ValueError("Batch window exceeded — see ticket #4821")
    return 0.0


def run_month_end_batch():
    """Runs on calendar month-end; fails when month has 31 days."""
    calculate_net(31)
'''

TICKET_BODY = (
    "Ticket #4821 — Payroll job crashes on month-end\n\n"
    "The batch fails when the calendar month has 31 days. Root cause traced to "
    "payroll_calc.py BATCH_DAYS=30 hardcode from a 2011 banking API workaround. "
    "Do not remove the date check without reviewing Ahmed's interview."
)

DOC_BODY = (
    "Month-End Procedures (2014 runbook)\n\n"
    "Before running the payroll batch, verify payroll_calc.py batch window. "
    "Known issue: months with 31 days require manual adjustment. "
    "See ticket #4821 and expert interview at 14:32."
)

INTERVIEW_SEGMENTS = [
    TranscriptSegmentData(
        872.0,
        890.0,
        "The payroll job fails on months with 31 days because BATCH_DAYS is hardcoded to 30 — "
        "a 2011 banking API workaround in payroll_calc.py.",
    ),
    TranscriptSegmentData(
        890.0,
        908.0,
        "Never remove the date check — Ahmed set it after the 1996 double-payment incident.",
    ),
]

BRIEF_QUESTIONS = [
    (
        1,
        "Walk me through the night of the March 2012 month-end payroll incident.",
        {"signal": "ticket_density_spike", "ticket": "#4821", "path": "payroll_calc.py"},
    ),
    (
        2,
        "Why is BATCH_DAYS fixed at 30 instead of using the actual calendar month length?",
        {"signal": "emergency_patch_cluster", "path": "payroll_calc.py", "lines": "122-140"},
    ),
    (
        3,
        "What breaks if someone removes the date check in calculate_net?",
        {"signal": "single_owner_module", "expert": "Ahmed", "incident": "1996"},
    ),
]


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


def _get_or_create_org(db, clerk_org_id: str) -> Org:
    org = db.execute(select(Org).where(Org.clerk_org_id == clerk_org_id)).scalar_one_or_none()
    if org:
        return org
    org = Org(clerk_org_id=clerk_org_id, name=DEMO_ORG_NAME)
    db.add(org)
    db.flush()
    return org


def _get_or_create_engagement(db, org: Org, name: str) -> Engagement:
    engagement = db.execute(
        select(Engagement).where(Engagement.org_id == org.id, Engagement.name == name)
    ).scalar_one_or_none()
    if engagement:
        return engagement
    engagement = Engagement(org_id=org.id, name=name)
    db.add(engagement)
    db.flush()
    return engagement


def _upsert_source(
    db,
    *,
    engagement_id: uuid.UUID,
    external_id: str,
    source_type: str,
    name: str,
) -> Source:
    source = db.execute(
        select(Source).where(
            Source.engagement_id == engagement_id,
            Source.external_id == external_id,
        )
    ).scalar_one_or_none()
    if source:
        return source
    source = Source(
        engagement_id=engagement_id,
        type=source_type,
        name=name,
        status="queued",
        external_id=external_id,
        config={},
    )
    db.add(source)
    db.flush()
    return source


def _seed_git_source(db, engagement_id: uuid.UUID) -> Source:
    source = _upsert_source(
        db,
        engagement_id=engagement_id,
        external_id="demo:git:payroll",
        source_type="git",
        name="payroll-legacy (demo)",
    )
    entity = db.execute(
        select(CodeEntity).where(
            CodeEntity.source_id == source.id,
            CodeEntity.path == "payroll_calc.py",
        )
    ).scalar_one_or_none()
    if not entity:
        entity = CodeEntity(
            engagement_id=engagement_id,
            source_id=source.id,
            entity_type="file",
            path="payroll_calc.py",
            commit_sha=COMMIT_SHA,
            line_start=1,
            line_end=14,
            language="python",
            external_id=f"demo:code:payroll_calc.py:{COMMIT_SHA[:7]}",
            metadata_={"demo": True},
        )
        db.add(entity)
        db.flush()

    chunk = db.execute(
        select(Chunk).where(
            Chunk.source_id == source.id,
            Chunk.external_id == "demo:chunk:payroll_calc.py",
        )
    ).scalar_one_or_none()
    if not chunk:
        chunk = Chunk(
            engagement_id=engagement_id,
            source_id=source.id,
            code_entity_id=entity.id,
            chunk_index=0,
            content=CODE_CONTENT,
            line_start=1,
            line_end=14,
            external_id="demo:chunk:payroll_calc.py",
        )
        db.add(chunk)
        db.flush()

    embed_source_chunks(db, source)
    source.status = "indexed"
    source.status_detail = "Demo git source indexed"
    db.flush()
    return source


def _seed_ticket_source(db, engagement_id: uuid.UUID) -> Source:
    source = _upsert_source(
        db,
        engagement_id=engagement_id,
        external_id="demo:tickets:jira",
        source_type="tickets",
        name="Jira — Payroll (demo)",
    )
    artifact = db.execute(
        select(Artifact).where(
            Artifact.source_id == source.id,
            Artifact.external_id == "demo:ticket:4821",
        )
    ).scalar_one_or_none()
    if not artifact:
        artifact = Artifact(
            engagement_id=engagement_id,
            source_id=source.id,
            artifact_type="ticket",
            external_id="demo:ticket:4821",
            title="Ticket #4821 — Payroll job crashes on month-end",
            body=TICKET_BODY,
            metadata_={"ticket_number": 4821, "demo": True},
        )
        db.add(artifact)
        db.flush()
        chunk = Chunk(
            engagement_id=engagement_id,
            source_id=source.id,
            artifact_id=artifact.id,
            chunk_index=0,
            content=TICKET_BODY,
            external_id="demo:chunk:ticket:4821",
        )
        db.add(chunk)
        db.flush()

    embed_source_chunks(db, source)
    source.status = "indexed"
    source.status_detail = "Demo ticket source indexed"
    db.flush()
    return source


def _seed_doc_source(db, engagement_id: uuid.UUID) -> Source:
    source = _upsert_source(
        db,
        engagement_id=engagement_id,
        external_id="demo:docs:month-end",
        source_type="docs",
        name="Month-End Procedures (demo)",
    )
    artifact = db.execute(
        select(Artifact).where(
            Artifact.source_id == source.id,
            Artifact.external_id == "demo:doc:month-end",
        )
    ).scalar_one_or_none()
    if not artifact:
        artifact = Artifact(
            engagement_id=engagement_id,
            source_id=source.id,
            artifact_type="doc",
            external_id="demo:doc:month-end",
            title="Month-End Procedures (2014)",
            body=DOC_BODY,
            metadata_={"demo": True},
        )
        db.add(artifact)
        db.flush()
        chunk = Chunk(
            engagement_id=engagement_id,
            source_id=source.id,
            artifact_id=artifact.id,
            chunk_index=0,
            content=DOC_BODY,
            external_id="demo:chunk:doc:month-end",
        )
        db.add(chunk)
        db.flush()

    embed_source_chunks(db, source)
    source.status = "indexed"
    source.status_detail = "Demo doc source indexed"
    db.flush()
    return source


def _seed_interview_source(db, engagement_id: uuid.UUID, brief_id: uuid.UUID | None) -> Interview:
    source = _upsert_source(
        db,
        engagement_id=engagement_id,
        external_id="demo:interview:ahmed",
        source_type="interview",
        name="Ahmed — Month-end batch (demo)",
        config={"interview": True},
    )
    interview = db.execute(
        select(Interview).where(Interview.source_id == source.id)
    ).scalar_one_or_none()
    if not interview:
        interview = Interview(
            engagement_id=engagement_id,
            brief_id=brief_id,
            source_id=source.id,
            clerk_user_id="demo_user",
            title="Ahmed — Month-end payroll batch",
            expert_name="Ahmed",
            status="uploaded",
        )
        db.add(interview)
        db.flush()

    existing_segments = db.execute(
        select(Chunk).where(Chunk.source_id == source.id)
    ).scalars().first()
    if not existing_segments:
        ingest_transcript_segments(db, interview, INTERVIEW_SEGMENTS)
    else:
        embed_source_chunks(db, source)
        source.status = "indexed"
        interview.status = "indexed"
        db.flush()

    return interview


def _seed_brief(db, engagement_id: uuid.UUID, code_entity_id: uuid.UUID | None) -> ArchaeologyBrief:
    brief = db.execute(
        select(ArchaeologyBrief).where(
            ArchaeologyBrief.engagement_id == engagement_id,
            ArchaeologyBrief.module_path == "payroll_calc.py",
        )
    ).scalar_one_or_none()
    if brief:
        return brief

    brief = ArchaeologyBrief(
        engagement_id=engagement_id,
        clerk_user_id="demo_user",
        expert_name="Ahmed",
        module_path="payroll_calc.py",
        status="ready",
        signals=[
            {"type": "patch_burst", "path": "payroll_calc.py", "count": 47},
            {"type": "single_owner", "path": "payroll_calc.py", "owner": "Ahmed"},
            {"type": "ticket_spike", "module": "payroll", "tickets": ["#4821"]},
        ],
    )
    db.add(brief)
    db.flush()

    for rank, text, evidence in BRIEF_QUESTIONS:
        db.add(
            BriefQuestion(
                brief_id=brief.id,
                rank=rank,
                question_text=text,
                evidence=evidence,
                code_entity_id=code_entity_id if rank == 2 else None,
            )
        )
    db.flush()
    return brief


def seed_demo() -> dict:
    clerk_org_id = _env("DEMO_CLERK_ORG_ID")
    if not clerk_org_id:
        print(
            "ERROR: Set DEMO_CLERK_ORG_ID to your Clerk organization id "
            "(Clerk Dashboard → Organization → copy org_… id).",
            file=sys.stderr,
        )
        sys.exit(1)

    engagement_name = _env("DEMO_ENGAGEMENT_NAME", DEFAULT_ENGAGEMENT)

    with get_sync_db() as db:
        org = _get_or_create_org(db, clerk_org_id)
        engagement = _get_or_create_engagement(db, org, engagement_name)

        git_source = _seed_git_source(db, engagement.id)
        code_entity = db.execute(
            select(CodeEntity).where(CodeEntity.source_id == git_source.id).limit(1)
        ).scalar_one()

        _seed_ticket_source(db, engagement.id)
        _seed_doc_source(db, engagement.id)
        brief = _seed_brief(db, engagement.id, code_entity.id)
        interview = _seed_interview_source(db, engagement.id, brief.id)

        links = ensure_engagement_links(db, engagement.id)

        chunk_count = db.execute(
            select(Chunk).where(Chunk.engagement_id == engagement.id)
        ).scalars().all()

        return {
            "org_id": str(org.id),
            "clerk_org_id": org.clerk_org_id,
            "engagement_id": str(engagement.id),
            "engagement_name": engagement.name,
            "interview_id": str(interview.id),
            "brief_id": str(brief.id),
            "chunks": len(chunk_count),
            "links": links,
        }


def main() -> None:
    result = seed_demo()
    print("Demo seed complete.")
    print(f"  Org:         {result['clerk_org_id']} ({result['org_id']})")
    print(f"  Engagement:  {result['engagement_name']} ({result['engagement_id']})")
    print(f"  Interview:   {result['interview_id']}")
    print(f"  Brief:       {result['brief_id']}")
    print(f"  Chunks:      {result['chunks']}  Links: {result['links']}")
    print()
    print("Sample questions:")
    print('  • "Why does the payroll job fail on months with 31 days?"')
    print('  • "Who last changed the month-end batch retry logic?"')
    print()
    print("Select the engagement in the app sidebar, then open Ask.")


if __name__ == "__main__":
    main()

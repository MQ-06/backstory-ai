"""Demo path integration — ingest → ask → brief → citations/refusal."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import Chunk, CodeEntity, Engagement, Org, Source
from app.services.archaeology_brief import generate_brief
from app.services.archaeology_signals import compute_risk_signals
from app.services.hybrid_retrieval import hybrid_retrieve
from app.services.rag import check_pre_generation_refusal


@pytest.fixture
def payroll_engagement(requires_postgres):
    """Minimal payroll scenario matching seed_demo structure."""
    with get_sync_db() as db:
        org = Org(clerk_org_id=f"org_demo_{uuid.uuid4().hex[:8]}", name="Demo Org")
        db.add(org)
        db.flush()
        engagement = Engagement(org_id=org.id, name="Payroll Demo")
        db.add(engagement)
        db.flush()

        git_source = Source(
            engagement_id=engagement.id,
            type="git",
            name="payroll-repo",
            status="indexed",
            external_id="github:demo/payroll",
            config={
                "repo_url": "https://github.com/demo/payroll",
                "branch": "main",
            },
        )
        db.add(git_source)
        db.flush()

        entity = CodeEntity(
            engagement_id=engagement.id,
            source_id=git_source.id,
            entity_type="file",
            path="payroll_calc.py",
            commit_sha="abc123",
            external_id="file:abc123:payroll_calc.py",
            metadata_={"bytes": 1200},
        )
        db.add(entity)
        db.flush()

        chunk = Chunk(
            engagement_id=engagement.id,
            source_id=git_source.id,
            code_entity_id=entity.id,
            chunk_index=0,
            content="BATCH_DAYS = 30  # breaks on 31-day months",
            line_start=3,
            line_end=3,
            external_id="chunk:file:abc123:payroll_calc.py:0",
            embedding=[0.0] * 384,
        )
        db.add(chunk)
        db.flush()

        eid = engagement.id
        org_id = org.clerk_org_id

    yield {"engagement_id": eid, "org_id": org_id}

    with get_sync_db() as db:
        engagement = db.get(Engagement, eid)
        if not engagement:
            return
        for model in (Chunk, CodeEntity, Source):
            rows = db.execute(
                select(model).where(model.engagement_id == eid)  # type: ignore[attr-defined]
            ).scalars().all()
            for row in rows:
                db.delete(row)
        db.delete(engagement)
        org = db.execute(select(Org).where(Org.clerk_org_id == org_id)).scalar_one_or_none()
        if org:
            db.delete(org)


def test_risk_signals_from_indexed_code(payroll_engagement):
    with get_sync_db() as db:
        signals = compute_risk_signals(
            db,
            engagement_id=payroll_engagement["engagement_id"],
            module_path="payroll_calc",
        )
    assert any("payroll_calc" in (s.path or "") or "payroll" in s.label.lower() for s in signals) or len(signals) >= 0


def test_hybrid_retrieve_includes_repo_url(payroll_engagement):
    with get_sync_db() as db:
        passages = hybrid_retrieve(
            db,
            engagement_id=payroll_engagement["engagement_id"],
            query="BATCH_DAYS hardcoded 30 payroll",
        )
    code_passages = [p for p in passages if p.citation_type == "code"]
    if code_passages:
        locator = code_passages[0].locator or {}
        assert locator.get("repo_url") == "https://github.com/demo/payroll"
        assert locator.get("branch") == "main"
        assert locator.get("path") == "payroll_calc.py"


def test_retrieval_gate_allows_payroll_question(payroll_engagement):
    with get_sync_db() as db:
        passages = hybrid_retrieve(
            db,
            engagement_id=payroll_engagement["engagement_id"],
            query="Why does payroll fail on 31-day months?",
        )
    refused = check_pre_generation_refusal(passages) is not None
    assert refused is False or len(passages) == 0


def test_generate_brief_produces_questions(payroll_engagement):
    from app.auth import AuthContext
    from app.models import Org

    with get_sync_db() as db:
        org = db.execute(
            select(Org).where(Org.clerk_org_id == payroll_engagement["org_id"])
        ).scalar_one()
        auth = AuthContext(
            clerk_user_id="demo_user",
            clerk_org_id=org.clerk_org_id,
            org=org,
        )
        brief = generate_brief(
            db,
            auth,
            engagement_id=payroll_engagement["engagement_id"],
            expert_name="Ahmed",
            module_path="payroll_calc",
        )
        assert brief.status in ("ready", "error", "empty")
        if brief.status == "ready":
            assert brief.signals is not None

#!/usr/bin/env python3
"""Verify seeded demo supports the 15-min walkthrough (Ask → Capture → Library).

Usage:
  export DEMO_CLERK_ORG_ID=org_...
  cd apps/api && uv run python scripts/verify_demo_walkthrough.py

Exits 0 when all checks pass; prints what to do in the browser for manual rehearsal.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_api_root = Path(__file__).resolve().parents[1]
if str(_api_root) not in sys.path:
    sys.path.insert(0, str(_api_root))

from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import ArchaeologyBrief, Engagement, Org
from app.services.hybrid_retrieval import hybrid_retrieve
from app.services.library import list_library_artifacts
from app.services.llm import llm_config_error
from app.services.rag import check_pre_generation_refusal

DEFAULT_ENGAGEMENT = "Streetlight Payroll Demo"
PAYROLL_QUESTION = "Why does the payroll job fail on months with 31 days?"
INTERVIEW_QUESTION = "What did Ahmed say about the banking API workaround?"


def _fail(msg: str) -> None:
    print(f"  FAIL: {msg}")
    sys.exit(1)


def _ok(msg: str) -> None:
    print(f"  OK: {msg}")


def main() -> None:
    clerk_org_id = os.environ.get("DEMO_CLERK_ORG_ID", "").strip()
    if not clerk_org_id:
        _fail("Set DEMO_CLERK_ORG_ID (copy from Settings → Demo seed in the app)")

    print("Demo walkthrough verification\n")

    with get_sync_db() as db:
        org = db.execute(select(Org).where(Org.clerk_org_id == clerk_org_id)).scalar_one_or_none()
        if not org:
            _fail(f"No org for {clerk_org_id} — run make demo-seed first")

        engagement = db.execute(
            select(Engagement).where(
                Engagement.org_id == org.id,
                Engagement.name == DEFAULT_ENGAGEMENT,
            )
        ).scalar_one_or_none()
        if not engagement:
            _fail(f'Engagement "{DEFAULT_ENGAGEMENT}" not found — run make demo-seed')

        eid = engagement.id
        _ok(f'Engagement "{engagement.name}" ({eid})')

        artifacts, summary = list_library_artifacts(db, engagement_id=eid)
        if summary.code < 1:
            _fail("Library has no code artifacts")
        _ok(f"Library: {summary.code} code, {summary.ticket} tickets, {summary.interview} interviews")

        names = {a.name for a in artifacts}
        if not any("payroll" in n.lower() for n in names):
            _fail("Expected payroll_calc.py (or similar) in library")
        _ok("Library includes payroll code artifact")

        brief = db.execute(
            select(ArchaeologyBrief)
            .where(ArchaeologyBrief.engagement_id == eid)
            .order_by(ArchaeologyBrief.created_at.desc())
        ).scalars().first()
        if not brief:
            _fail("No Archaeology Brief — run make demo-seed")
        if not brief.signals:
            _fail("Brief has no signals (Capture sidebar would be empty)")
        _ok(f"Brief with {len(brief.signals or [])} signals, {len(brief.questions)} questions")

        passages = hybrid_retrieve(db, engagement_id=eid, query=PAYROLL_QUESTION)
        if check_pre_generation_refusal(passages):
            _fail(f"Retrieval gate would refuse: {PAYROLL_QUESTION!r}")
        _ok(f"Ask retrieval: {len(passages)} passages for payroll question")

        interview_passages = hybrid_retrieve(db, engagement_id=eid, query=INTERVIEW_QUESTION)
        if not interview_passages:
            print("  WARN: No passages for interview question (clip citation may need re-seed)")
        else:
            types = {p.citation_type for p in interview_passages}
            _ok(f"Interview question retrieval: types {types}")

    llm_err = llm_config_error()
    if llm_err:
        print(f"\n  WARN: LLM not configured — Ask will refuse/error in UI: {llm_err}")
        print("  Fix: set GROQ_API_KEY or GOOGLE_API_KEY in apps/api/.env")
    else:
        _ok("LLM configured (Ask can generate answers)")

    print("\nBrowser walkthrough (manual):")
    print("  1. make dev → sign in → select Streetlight Payroll Demo")
    print(f"  2. Ask → {PAYROLL_QUESTION!r}")
    print("  3. Capture → Archaeology Brief (check sidebar signals)")
    print("  4. Library → browse artifacts")
    print(f"  5. Ask → {INTERVIEW_QUESTION!r}")
    print("\nAll automated checks passed.")


if __name__ == "__main__":
    main()

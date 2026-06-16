"""Archaeology Brief generation — signals + LLM question cards."""

from __future__ import annotations

import asyncio
import json
import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.auth import AuthContext
from app.models import ArchaeologyBrief, AuditEvent, BriefQuestion, CodeEntity
from app.services.archaeology_signals import RiskSignal, compute_risk_signals
from app.services.llm import llm_config_error, stream_llm_text

_QUESTION_LINE_RE = re.compile(r"^\s*(?:\d+[.)]\s*)?(.+)$")


def _signals_block(signals: list[RiskSignal]) -> str:
    lines: list[str] = []
    for idx, signal in enumerate(signals, start=1):
        lines.append(
            f"[S{idx}] ({signal.signal_type}) {signal.label}\n"
            f"Path: {signal.path or 'n/a'}\n"
            f"Evidence: {json.dumps(signal.evidence)[:400]}"
        )
    return "\n\n".join(lines)


def _system_prompt() -> str:
    return """You are Backstory generating an Archaeology Brief.

Rules:
1. Use ONLY the risk signals provided — never invent history.
2. Output 5-8 questions an expert can answer that others cannot infer from code alone.
3. Each question MUST reference signal IDs like [S1] in parentheses.
4. Format each question on its own line starting with "Q: "
5. Questions should be specific, respectful, and worth the expert's time.
6. No bullet lists, no duplicate summary section."""


def _user_prompt(signals: list[RiskSignal], expert_name: str | None, module_path: str | None) -> str:
    scope = []
    if expert_name:
        scope.append(f"Expert: {expert_name}")
    if module_path:
        scope.append(f"Module focus: {module_path}")
    scope_text = "\n".join(scope) if scope else "Scope: entire engagement"
    return f"""{scope_text}

Risk signals:
{_signals_block(signals)}

Generate questions as "Q: ..." lines with [Sn] citations."""


def _parse_questions(raw: str) -> list[str]:
    questions: list[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith("Q:"):
            questions.append(line[2:].strip())
            continue
        match = _QUESTION_LINE_RE.match(line)
        if match and "?" in line:
            questions.append(match.group(1).strip())
    return questions[:8]


def _resolve_code_entity(
    db: Session, engagement_id: uuid.UUID, path: str | None
) -> uuid.UUID | None:
    if not path:
        return None
    entity = db.execute(
        select(CodeEntity.id).where(
            CodeEntity.engagement_id == engagement_id,
            CodeEntity.path == path,
        )
    ).scalar_one_or_none()
    return entity


async def _generate_questions_async(
    signals: list[RiskSignal],
    expert_name: str | None,
    module_path: str | None,
) -> str:
    tokens: list[str] = []
    async for token in stream_llm_text(
        system_instruction=_system_prompt(),
        user_prompt=_user_prompt(signals, expert_name, module_path),
    ):
        tokens.append(token)
    return "".join(tokens)


def generate_brief(
    db: Session,
    auth: AuthContext,
    *,
    engagement_id: uuid.UUID,
    expert_name: str | None = None,
    module_path: str | None = None,
) -> ArchaeologyBrief:
    if llm_config_error():
        raise RuntimeError(llm_config_error())

    signals = compute_risk_signals(
        db,
        engagement_id=engagement_id,
        module_path=module_path,
        expert_name=expert_name,
    )
    if not signals:
        brief = ArchaeologyBrief(
            engagement_id=engagement_id,
            clerk_user_id=auth.clerk_user_id,
            expert_name=expert_name,
            module_path=module_path,
            status="empty",
            signals=[],
            error_message="Not enough indexed history to generate a brief. Connect Git and tickets first.",
        )
        db.add(brief)
        db.flush()
        return brief

    brief = ArchaeologyBrief(
        engagement_id=engagement_id,
        clerk_user_id=auth.clerk_user_id,
        expert_name=expert_name,
        module_path=module_path,
        status="generating",
        signals=[s.to_dict() for s in signals],
    )
    db.add(brief)
    db.flush()

    try:
        raw = asyncio.run(_generate_questions_async(signals, expert_name, module_path))
        parsed = _parse_questions(raw)
        if not parsed:
            raise RuntimeError("LLM returned no questions — try again")

        for rank, question_text in enumerate(parsed, start=1):
            cited_signal = None
            for idx, signal in enumerate(signals, start=1):
                if f"[S{idx}]" in question_text or f"[s{idx}]" in question_text.lower():
                    cited_signal = signal
                    break
            evidence = cited_signal.to_dict() if cited_signal else {"signals": [s.to_dict() for s in signals[:3]]}
            path = cited_signal.path if cited_signal else None
            db.add(
                BriefQuestion(
                    brief_id=brief.id,
                    rank=rank,
                    question_text=question_text,
                    evidence=evidence,
                    code_entity_id=_resolve_code_entity(db, engagement_id, path),
                )
            )

        brief.status = "ready"
        brief.error_message = None
        db.add(
            AuditEvent(
                engagement_id=engagement_id,
                clerk_user_id=auth.clerk_user_id,
                action="brief.generate",
                detail=f"questions={len(parsed)}",
            )
        )
        db.flush()
        return brief
    except Exception as exc:
        brief.status = "error"
        brief.error_message = str(exc)[:500]
        db.flush()
        raise


def get_brief(db: Session, brief_id: uuid.UUID, engagement_id: uuid.UUID) -> ArchaeologyBrief | None:
    return db.execute(
        select(ArchaeologyBrief)
        .options(joinedload(ArchaeologyBrief.questions))
        .where(ArchaeologyBrief.id == brief_id, ArchaeologyBrief.engagement_id == engagement_id)
    ).unique().scalar_one_or_none()


def list_briefs(db: Session, engagement_id: uuid.UUID) -> list[ArchaeologyBrief]:
    return list(
        db.execute(
            select(ArchaeologyBrief)
            .options(joinedload(ArchaeologyBrief.questions))
            .where(ArchaeologyBrief.engagement_id == engagement_id)
            .order_by(ArchaeologyBrief.created_at.desc())
        ).unique().scalars().all()
    )

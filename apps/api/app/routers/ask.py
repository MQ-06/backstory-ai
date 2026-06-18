"""Ask endpoint — SSE streaming for grounded answers or honest refusal."""

from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.auth import AuthContext, require_org
from app.db_sync import get_sync_db
from app.services import rag
from app.services.observability import trace_generation
from app.services.sources import get_engagement_for_org_sync
from app.services.llm import llm_config_error, stream_llm_text

router = APIRouter(tags=["ask"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=4000)


def _sse(event: str, data: str | dict) -> dict:
    payload = data if isinstance(data, str) else json.dumps(data)
    return {"event": event, "data": payload}


async def _ask_stream(
    *,
    engagement_id: uuid.UUID,
    auth: AuthContext,
    question: str,
) -> AsyncIterator[dict]:
    config_error = llm_config_error()
    if config_error:
        yield _sse("error", config_error)
        yield _sse("done", {"refused": True, "answer_id": "", "error": config_error})
        return

    yield _sse("status", "Searching indexed sources…")

    def _retrieve():
        with get_sync_db() as db:
            assert auth.org is not None
            get_engagement_for_org_sync(db, engagement_id, auth.org.id)
            return rag.prepare_retrieval(db, engagement_id=engagement_id, question=question)

    try:
        passages = await asyncio.to_thread(_retrieve)
    except ValueError as exc:
        yield _sse("error", str(exc))
        yield _sse("done", {"refused": True, "answer_id": "", "error": str(exc)})
        return
    except Exception as exc:
        yield _sse("error", str(exc))
        yield _sse("done", {"refused": True, "answer_id": "", "error": str(exc)})
        return

    refusal_reason = rag.check_pre_generation_refusal(passages)
    if refusal_reason:

        def _persist_refusal():
            with get_sync_db() as db:
                return rag.refuse_early(
                    db,
                    engagement_id=engagement_id,
                    clerk_user_id=auth.clerk_user_id,
                    question=question,
                    reason=refusal_reason,
                )

        result = await asyncio.to_thread(_persist_refusal)
        yield _sse(
            "refusal",
            {
                "answer_id": str(result.answer_id),
                "reason": result.refusal_reason,
                "message": rag.REFUSAL_PHRASE,
            },
        )
        yield _sse("done", {"answer_id": str(result.answer_id), "refused": True})
        return

    yield _sse("status", f"Found {len(passages)} evidence passages — generating answer…")

    for p in passages[:8]:
        yield _sse(
            "citation",
            {
                "passage_id": p.passage_id,
                "citation_type": p.citation_type,
                "label": p.label,
                "snippet": p.snippet,
                "locator": p.locator,
            },
        )

    system_prompt, user_prompt, llm_passages = rag.build_prompts(question, passages)
    collected: list[str] = []

    try:
        with trace_generation("ask", metadata={"engagement_id": str(engagement_id)}):
            async for token in stream_llm_text(
                system_instruction=system_prompt,
                user_prompt=user_prompt,
            ):
                collected.append(token)
    except Exception as exc:
        yield _sse("error", str(exc))
        yield _sse("done", {"refused": True, "answer_id": "", "error": str(exc)})
        return

    raw_answer = "".join(collected)

    def _finalize():
        with get_sync_db() as db:
            return rag.finalize_answer(
                db,
                engagement_id=engagement_id,
                clerk_user_id=auth.clerk_user_id,
                question=question,
                raw_answer=raw_answer,
                passages=llm_passages,
            )

    result = await asyncio.to_thread(_finalize)

    if result.refused:
        yield _sse(
            "refusal",
            {
                "answer_id": str(result.answer_id),
                "reason": result.refusal_reason,
                "message": rag.REFUSAL_PHRASE,
            },
        )
    else:
        # Stream only the verified, citation-backed answer.
        if result.answer_text:
            yield _sse("token", result.answer_text)
        for c in result.citations:
            yield _sse("citation", {**c, "final": True})

    yield _sse(
        "done",
        {
            "answer_id": str(result.answer_id),
            "refused": result.refused,
            "answer_text": result.answer_text,
            "citations": result.citations,
        },
    )


@router.post("/engagements/{engagement_id}/ask")
async def post_ask(
    engagement_id: uuid.UUID,
    payload: AskRequest,
    auth: AuthContext = Depends(require_org),
) -> EventSourceResponse:
    question = payload.question.strip()
    if len(question) < 3:
        raise HTTPException(status_code=400, detail="Question must be at least 3 characters")

    return EventSourceResponse(
        _ask_stream(engagement_id=engagement_id, auth=auth, question=question),
        media_type="text/event-stream",
    )

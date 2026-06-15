import asyncio

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/sse", tags=["sse"])


async def _stub_stream():
    """Sprint 0 stub — real answer streaming comes in Sprint 2."""
    yield {"event": "status", "data": "gathering evidence (stub)"}
    await asyncio.sleep(0.5)
    yield {"event": "token", "data": ""}
    yield {"event": "done", "data": "stub"}


@router.get("/ask")
async def ask_sse_stub() -> EventSourceResponse:
    return EventSourceResponse(_stub_stream())

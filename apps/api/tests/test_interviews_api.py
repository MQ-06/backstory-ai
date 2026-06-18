"""Integration tests for interview API — list, media auth, tenant isolation."""

from __future__ import annotations

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth import AuthContext, require_org
from app.main import app
from app.models import Engagement, Interview
from app.services.interviews import list_interviews
from app.db_sync import get_sync_db
from app.routers.interviews import _to_out


@pytest.mark.asyncio
async def test_list_interviews_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/api/v1/engagements/{uuid.uuid4()}/interviews")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_interviews_returns_segments(
    client,
    auth_context,
    test_engagement: Engagement,
    interview_with_segments: tuple[Interview, Engagement],
):
    interview, engagement = interview_with_segments
    response = await client.get(
        f"/api/v1/engagements/{engagement.id}/interviews",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    row = payload[0]
    assert row["id"] == str(interview.id)
    assert row["status"] == "indexed"
    assert len(row["segments"]) == 1
    assert row["segments"][0]["start_seconds"] == 14.5
    assert "Click supports" in row["segments"][0]["text"]


def test_list_interviews_to_out_after_session_closed(interview_with_segments):
    """Regression: segments must load before sync session closes."""
    _, engagement = interview_with_segments
    with get_sync_db() as db:
        rows = list_interviews(db, engagement.id)
    assert len(rows) == 1
    out = _to_out(rows[0])
    assert len(out.segments) == 1


@pytest.mark.asyncio
async def test_interview_media_requires_auth(interview_with_segments):
    _, engagement = interview_with_segments
    interview_id = interview_with_segments[0].id
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/engagements/{engagement.id}/interviews/{interview_id}/media",
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_interview_media_streams_file(
    client,
    auth_context,
    interview_with_segments: tuple[Interview, Engagement],
):
    interview, engagement = interview_with_segments
    response = await client.get(
        f"/api/v1/engagements/{engagement.id}/interviews/{interview.id}/media",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert response.content == b"fake-webm-content-for-tests"
    assert "video" in (response.headers.get("content-type") or "")


@pytest.mark.asyncio
async def test_interview_tenant_isolation(
    requires_postgres,
    interview_with_segments: tuple[Interview, Engagement],
    other_org,
):
    interview, engagement = interview_with_segments

    async def _other_org_auth() -> AuthContext:
        return AuthContext(
            clerk_user_id="user_other",
            clerk_org_id=other_org.clerk_org_id,
            org=other_org,
        )

    app.dependency_overrides[require_org] = _other_org_auth
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/engagements/{engagement.id}/interviews",
                headers={"Authorization": "Bearer test-token"},
            )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()

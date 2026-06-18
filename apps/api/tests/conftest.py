"""Shared pytest fixtures for API integration tests."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, text

from app.auth import AuthContext, require_org
from app.db import engine
from app.db_sync import get_sync_db
from app.main import app
from app.models import (
    Artifact,
    Chunk,
    Engagement,
    Interview,
    Org,
    Source,
    TranscriptSegment,
)


@dataclass
class AuthHolder:
    context: AuthContext | None = None


auth_holder = AuthHolder()


def _db_ping() -> bool:
    try:
        with get_sync_db() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@pytest.fixture(scope="session")
def postgres_available() -> bool:
    return _db_ping()


@pytest.fixture
def requires_postgres(postgres_available: bool):
    if not postgres_available:
        pytest.skip("Postgres not available — start with: make up")


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()
    auth_holder.context = None


@pytest.fixture(autouse=True)
async def _dispose_async_engine():
    yield
    await engine.dispose()


@pytest.fixture
def override_auth(requires_postgres, _clear_dependency_overrides):
    async def _require_org() -> AuthContext:
        assert auth_holder.context is not None
        return auth_holder.context

    app.dependency_overrides[require_org] = _require_org
    yield auth_holder
    app.dependency_overrides.clear()
    auth_holder.context = None


@pytest.fixture
async def client(override_auth):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_org(requires_postgres) -> Org:
    org_id = f"org_test_{uuid.uuid4().hex[:8]}"
    with get_sync_db() as db:
        org = Org(clerk_org_id=org_id, name="Test Org")
        db.add(org)
        db.flush()
        db.refresh(org)
        org_id_copy = org.id
    with get_sync_db() as db:
        return db.get(Org, org_id_copy)


@pytest.fixture
def other_org(requires_postgres) -> Org:
    org_id = f"org_other_{uuid.uuid4().hex[:8]}"
    with get_sync_db() as db:
        org = Org(clerk_org_id=org_id, name="Other Org")
        db.add(org)
        db.flush()
        db.refresh(org)
        org_id_copy = org.id
    with get_sync_db() as db:
        return db.get(Org, org_id_copy)


@pytest.fixture
def test_engagement(test_org: Org) -> Engagement:
    with get_sync_db() as db:
        engagement = Engagement(org_id=test_org.id, name="Test Engagement")
        db.add(engagement)
        db.flush()
        db.refresh(engagement)
        eid = engagement.id
    with get_sync_db() as db:
        return db.get(Engagement, eid)


@pytest.fixture
def auth_context(test_org: Org, override_auth) -> AuthContext:
    ctx = AuthContext(
        clerk_user_id="user_test",
        clerk_org_id=test_org.clerk_org_id,
        org=test_org,
    )
    auth_holder.context = ctx
    return ctx


@pytest.fixture
def interview_with_segments(
    test_engagement: Engagement,
    tmp_path,
) -> tuple[Interview, Engagement]:
    """Interview with segments and a media file on disk."""
    media_dir = tmp_path / "interviews"
    media_dir.mkdir(parents=True, exist_ok=True)
    media_file = media_dir / "clip.webm"
    media_file.write_bytes(b"fake-webm-content-for-tests")

    with get_sync_db() as db:
        source = Source(
            engagement_id=test_engagement.id,
            type="interview",
            name="Expert session",
            status="indexed",
            external_id=f"interview_source:{uuid.uuid4()}",
            config={"interview": True},
        )
        db.add(source)
        db.flush()

        interview = Interview(
            engagement_id=test_engagement.id,
            source_id=source.id,
            clerk_user_id="user_test",
            title="Click parameter types",
            expert_name="Ahmed",
            status="indexed",
            media_path=str(media_file),
            media_mime="video/webm",
            consent_at=datetime.now(UTC),
        )
        db.add(interview)
        db.flush()

        artifact = Artifact(
            engagement_id=test_engagement.id,
            source_id=source.id,
            artifact_type="interview",
            external_id=f"interview:{interview.id}:segment:0",
            title="Interview segment 1",
            body="Click supports options and arguments for CLI tools.",
            metadata_={
                "interview_id": str(interview.id),
                "segment_index": 0,
                "start_seconds": 14.5,
                "end_seconds": 22.0,
                "expert_name": "Ahmed",
            },
        )
        db.add(artifact)
        db.flush()

        chunk = Chunk(
            engagement_id=test_engagement.id,
            source_id=source.id,
            artifact_id=artifact.id,
            chunk_index=0,
            content="Click supports options and arguments for CLI tools.",
            external_id=f"chunk:interview:{interview.id}:segment:0",
        )
        db.add(chunk)
        db.flush()

        segment = TranscriptSegment(
            interview_id=interview.id,
            segment_index=0,
            start_seconds=14.5,
            end_seconds=22.0,
            text="Click supports options and arguments for CLI tools.",
            artifact_id=artifact.id,
        )
        db.add(segment)
        db.flush()
        db.refresh(interview)
        iid = interview.id

    with get_sync_db() as db:
        interview = db.execute(
            select(Interview).where(Interview.id == iid)
        ).scalar_one()
        engagement = db.get(Engagement, test_engagement.id)
        return interview, engagement

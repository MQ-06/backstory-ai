"""Library API tests."""

import pytest
from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import Chunk, CodeEntity, Engagement, Source


@pytest.fixture
def library_engagement(test_org, requires_postgres):
    with get_sync_db() as db:
        engagement = Engagement(org_id=test_org.id, name="Library Test")
        db.add(engagement)
        db.flush()

        source = Source(
            engagement_id=engagement.id,
            type="git",
            name="repo",
            status="indexed",
            external_id="github:test/repo",
            config={"repo_url": "https://github.com/test/repo"},
        )
        db.add(source)
        db.flush()

        entity = CodeEntity(
            engagement_id=engagement.id,
            source_id=source.id,
            entity_type="file",
            path="batch_runner.py",
            commit_sha="sha1",
            external_id="file:sha1:batch_runner.py",
        )
        db.add(entity)
        db.flush()

        db.add(
            Chunk(
                engagement_id=engagement.id,
                source_id=source.id,
                code_entity_id=entity.id,
                chunk_index=0,
                content="batch runner",
                external_id="chunk:1",
            )
        )
        db.flush()
        eid = engagement.id

    yield eid

    with get_sync_db() as db:
        for model in (Chunk, CodeEntity, Source):
            rows = db.execute(
                select(model).where(model.engagement_id == eid)  # type: ignore[attr-defined]
            ).scalars().all()
            for row in rows:
                db.delete(row)
        engagement = db.get(Engagement, eid)
        if engagement:
            db.delete(engagement)


@pytest.mark.asyncio
async def test_library_lists_code_artifacts(
    client, override_auth, test_org, library_engagement, auth_context
):
    response = await client.get(f"/api/v1/engagements/{library_engagement}/library")
    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["code"] >= 1
    names = [a["name"] for a in body["artifacts"]]
    assert "batch_runner.py" in names

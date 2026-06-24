"""Engagement CRUD API tests."""

import uuid

import pytest
from sqlalchemy import select

from app.db_sync import get_sync_db
from app.models import Engagement, Org, Source


@pytest.mark.asyncio
async def test_create_and_list_engagements(client, override_auth, test_org, auth_context):
    create = await client.post(
        "/api/v1/engagements",
        json={"name": "Payroll rewrite"},
    )
    assert create.status_code == 201
    body = create.json()
    assert body["name"] == "Payroll rewrite"
    assert "id" in body

    listing = await client.get("/api/v1/engagements")
    assert listing.status_code == 200
    names = [e["name"] for e in listing.json()]
    assert "Payroll rewrite" in names


@pytest.mark.asyncio
async def test_delete_engagement_cascades_sources(
    client, override_auth, test_org, auth_context, test_engagement
):
    with get_sync_db() as db:
        db.add(
            Source(
                engagement_id=test_engagement.id,
                type="docs",
                name="README.md",
                status="indexed",
                external_id="upload:test",
                config={"filename": "README.md"},
            )
        )

    response = await client.delete(f"/api/v1/engagements/{test_engagement.id}")
    assert response.status_code == 204

    with get_sync_db() as db:
        engagement = db.get(Engagement, test_engagement.id)
        assert engagement is None
        sources = db.execute(
            select(Source).where(Source.engagement_id == test_engagement.id)
        ).scalars().all()
        assert sources == []


@pytest.mark.asyncio
async def test_delete_engagement_not_found(client, override_auth, test_org, auth_context):
    response = await client.delete(f"/api/v1/engagements/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_engagement_other_org_forbidden(
    client, override_auth, test_org, auth_context, test_engagement
):
    with get_sync_db() as db:
        other_org = Org(clerk_org_id=f"org_other_{uuid.uuid4().hex[:8]}", name="Other Org")
        db.add(other_org)
        db.flush()
        other = Engagement(org_id=other_org.id, name="Other engagement")
        db.add(other)
        db.flush()
        other_id = other.id

    response = await client.delete(f"/api/v1/engagements/{other_id}")
    assert response.status_code == 404

    with get_sync_db() as db:
        assert db.get(Engagement, other_id) is not None

import uuid

import pytest

from app.services.keyword_search import search_chunks_by_keyword


def test_search_chunks_by_keyword_empty_query():
    from unittest.mock import MagicMock

    db = MagicMock()
    assert search_chunks_by_keyword(db, engagement_id=uuid.uuid4(), query="   ") == []
    db.execute.assert_not_called()


@pytest.mark.skip(reason="Integration test — requires Postgres with migration 005")
def test_search_chunks_by_keyword_finds_content():
    pytest.importorskip("psycopg")
    from app.db_sync import get_sync_db
    from app.models import Chunk, Engagement, Org, Source

    with get_sync_db() as db:
        org = Org(clerk_org_id="fts-test-org", name="FTS Test Org")
        db.add(org)
        db.flush()

        engagement = Engagement(org_id=org.id, name="FTS Engagement", slug="fts-test")
        db.add(engagement)
        db.flush()

        source = Source(
            engagement_id=engagement.id,
            type="docs",
            name="test-doc",
            status="indexed",
            external_id="fts-doc-1",
            config={},
        )
        db.add(source)
        db.flush()

        chunk = Chunk(
            engagement_id=engagement.id,
            source_id=source.id,
            chunk_index=0,
            content="Payroll job fails on month-end when the calendar has thirty-one days.",
            external_id="fts-chunk-1",
        )
        db.add(chunk)
        db.flush()

        hits = search_chunks_by_keyword(
            db,
            engagement_id=engagement.id,
            query="payroll month-end",
            limit=5,
        )
        assert len(hits) == 1
        assert hits[0].chunk.id == chunk.id
        assert hits[0].rank > 0

        db.rollback()

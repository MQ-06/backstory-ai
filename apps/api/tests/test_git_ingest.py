import subprocess
import tempfile
from pathlib import Path

import pytest

from app.services.git_ingest import (
    chunk_lines,
    detect_language,
    should_ingest_path,
)


def test_should_ingest_path_skips_node_modules():
    assert should_ingest_path("node_modules/foo/index.js") is False
    assert should_ingest_path("src/main.py") is True


def test_should_ingest_path_skips_binaries():
    assert should_ingest_path("assets/logo.png") is False
    assert should_ingest_path("README.md") is True


def test_detect_language_python():
    assert detect_language("apps/api/main.py") == "python"


def test_chunk_lines_produces_ranges():
    lines = [f"line {i}\n" for i in range(1, 201)]
    chunks = list(chunk_lines(lines, max_lines=50, overlap=5))
    assert len(chunks) > 1
    assert chunks[0][1] == 1
    assert chunks[0][2] == 50


@pytest.mark.skip(reason="Integration test — run manually with make up && make db-migrate")
def test_clone_and_ingest_local_repo():
    """Integration: requires git + Postgres — skipped in CI without DB."""
    pytest.importorskip("psycopg")
    from app.db_sync import get_sync_db
    from app.models import Engagement, Org, Source
    from app.services.git_ingest import ingest_git_source

    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp) / "repo"
        repo.mkdir()
        subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
        subprocess.run(
            ["git", "config", "user.email", "test@example.com"],
            cwd=repo,
            check=True,
            capture_output=True,
        )
        subprocess.run(
            ["git", "config", "user.name", "Test"],
            cwd=repo,
            check=True,
            capture_output=True,
        )
        (repo / "hello.py").write_text("def greet():\n    return 'hi'\n", encoding="utf-8")
        subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True)
        subprocess.run(
            ["git", "commit", "-m", "add hello"],
            cwd=repo,
            check=True,
            capture_output=True,
        )

        with get_sync_db() as db:
            org = Org(clerk_org_id="test-org-git-ingest", name="Test Org")
            db.add(org)
            db.flush()
            engagement = Engagement(org_id=org.id, name="Test Engagement")
            db.add(engagement)
            db.flush()
            source = Source(
                engagement_id=engagement.id,
                type="git",
                name="local/test",
                status="processing",
                external_id="github:local/test",
                config={"repo_url": str(repo)},
            )
            db.add(source)
            db.flush()

            result = ingest_git_source(db, source, str(repo))
            assert result.file_count >= 1
            assert result.commit_count >= 1
            assert result.chunk_count >= 1

            db.rollback()  # don't persist test data

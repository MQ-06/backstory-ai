from pathlib import Path

import pytest

from app.services.doc_ingest import extract_text
from app.services.ingest_common import chunk_text
from app.services.ticket_ingest import parse_project_key


def test_chunk_text_paragraphs():
    text = "Para one.\n\nPara two is a bit longer.\n\nPara three."
    chunks = list(chunk_text(text, max_chars=30, overlap=5))
    assert len(chunks) >= 2


def test_parse_project_key_valid():
    owner, repo = parse_project_key("pallets/click")
    assert owner == "pallets"
    assert repo == "click"


def test_parse_project_key_invalid():
    with pytest.raises(ValueError):
        parse_project_key("not-valid")


def test_extract_text_markdown(tmp_path: Path):
    path = tmp_path / "runbook.md"
    path.write_text("# Title\n\nSome procedures here.", encoding="utf-8")
    assert "procedures" in extract_text(path)

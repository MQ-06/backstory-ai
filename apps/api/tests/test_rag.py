"""Unit tests for RAG verification and hybrid fusion helpers."""

import uuid

from app.services.hybrid_retrieval import _reciprocal_rank_fusion
from app.services.rag import _strip_trailing_summary, _verify_and_filter_answer


def test_rrf_merges_two_rankings():
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    scores = _reciprocal_rank_fusion([[a, b], [b, c]])
    assert scores[b] > scores[a]
    assert scores[b] > scores[c]
    assert a in scores and c in scores


def test_verify_keeps_cited_sentences():
    from types import SimpleNamespace

    chunk = SimpleNamespace(id=uuid.uuid4(), content="payroll fails on 31-day months")
    passages = [
        SimpleNamespace(
            passage_id=1,
            chunk=chunk,
            citation_type="code",
            label="payroll.py:10",
            locator={},
            snippet="payroll fails",
            rrf_score=0.1,
        )
    ]
    raw = "The payroll job fails on 31-day months [1]. It runs nightly."
    filtered, used, reason = _verify_and_filter_answer(raw, passages)
    assert reason is None
    assert "[1]" in filtered
    assert "nightly" not in filtered
    assert len(used) == 1


def test_verify_refuses_without_citations():
    from types import SimpleNamespace

    chunk = SimpleNamespace(id=uuid.uuid4(), content="some context")
    passages = [
        SimpleNamespace(
            passage_id=1,
            chunk=chunk,
            citation_type="doc",
            label="readme.md",
            locator={},
            snippet="some context",
            rrf_score=0.1,
        )
    ]
    filtered, used, reason = _verify_and_filter_answer(
        "The payroll job fails without any citation markers.",
        passages,
    )
    assert filtered == ""
    assert used == []
    assert reason is not None


def test_strip_trailing_claims_section():
    raw = (
        "Click supports options and arguments [1]. Types are validated consistently [3]. "
        "Claims:\n"
        "- Click supports options and arguments [1].\n"
        "- Types are validated consistently [3]."
    )
    assert "Claims:" not in _strip_trailing_summary(raw)
    assert _strip_trailing_summary(raw).endswith("[3].")


def test_verify_strips_claims_before_filtering():
    from types import SimpleNamespace

    chunk = SimpleNamespace(id=uuid.uuid4(), content="params")
    passages = [
        SimpleNamespace(
            passage_id=1,
            chunk=chunk,
            citation_type="code",
            label="params.md",
            locator={},
            snippet="params",
            rrf_score=0.1,
        ),
        SimpleNamespace(
            passage_id=3,
            chunk=chunk,
            citation_type="code",
            label="why.md",
            locator={},
            snippet="types",
            rrf_score=0.1,
        ),
    ]
    raw = (
        "Click supports options and arguments [1]. Types are validated consistently [3]. "
        "Claims: - Click supports options [1]. - Types are validated [3]."
    )
    filtered, _, reason = _verify_and_filter_answer(raw, passages)
    assert reason is None
    assert "Claims:" not in filtered
    assert filtered.count("[1]") == 1

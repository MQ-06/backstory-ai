"""Archaeology brief parsing tests."""

from app.services.archaeology_brief import _parse_questions


def test_parse_questions_q_prefix():
    raw = "Q: Why was RECON-7 patched at night? [S1]\nQ: Who owns the payroll module? [S2]"
    questions = _parse_questions(raw)
    assert len(questions) == 2
    assert "RECON-7" in questions[0]


def test_parse_questions_numbered():
    raw = "1. What happened in the March 2012 incident?"
    questions = _parse_questions(raw)
    assert len(questions) == 1

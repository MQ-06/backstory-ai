"""Unit tests for deterministic code linking patterns."""

from app.services.code_linking import _PATH_RE, _TICKET_RE


def test_path_regex_matches_python_file():
    text = 'See src/payroll_calc.py for the batch job logic.'
    matches = [_PATH_RE.search(text)]
    assert matches[0] is not None
    assert matches[0].group(1) == "src/payroll_calc.py"


def test_ticket_regex_matches_issue_number():
    text = "Fixed in issue #4821 and related to #12"
    numbers = [m.group(1) for m in _TICKET_RE.finditer(text)]
    assert numbers == ["4821", "12"]

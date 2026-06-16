import pytest

from app.services.sources import _git_external_id


def test_git_external_id_parses_https_url():
    external_id, name = _git_external_id("https://github.com/acme/payroll")
    assert external_id == "github:acme/payroll"
    assert name == "acme/payroll"


def test_git_external_id_strips_git_suffix():
    external_id, name = _git_external_id("https://github.com/acme/payroll.git")
    assert external_id == "github:acme/payroll"
    assert name == "acme/payroll"


def test_git_external_id_rejects_invalid():
    with pytest.raises(ValueError):
        _git_external_id("not-a-url")

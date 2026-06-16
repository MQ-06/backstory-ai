"""LLM provider config validation."""

from app.services.llm import llm_config_error


def test_llm_config_error_groq_missing_key(monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "")
    assert llm_config_error() is not None
    get_settings.cache_clear()


def test_llm_config_error_gemini_bad_key_prefix(monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("GOOGLE_API_KEY", "not-a-valid-key")
    assert "AIza" in (llm_config_error() or "")
    get_settings.cache_clear()


def test_llm_config_error_ollama_ok(monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    assert llm_config_error() is None
    get_settings.cache_clear()

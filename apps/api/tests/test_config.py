from app.config import Settings, normalize_database_url


def test_normalize_database_url_adds_asyncpg_for_postgresql():
    assert (
        normalize_database_url("postgresql://user:pass@host/db?sslmode=require")
        == "postgresql+asyncpg://user:pass@host/db?sslmode=require"
    )


def test_normalize_database_url_converts_postgres_scheme():
    assert (
        normalize_database_url("postgres://user:pass@host/db")
        == "postgresql+asyncpg://user:pass@host/db"
    )


def test_normalize_database_url_keeps_asyncpg():
    url = "postgresql+asyncpg://user:pass@host/db"
    assert normalize_database_url(url) == url


def test_settings_normalizes_env_style_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host/db")
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.database_url.startswith("postgresql+asyncpg://")
    get_settings.cache_clear()

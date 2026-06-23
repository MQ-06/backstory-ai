from app.config import Settings, asyncpg_database_url, normalize_database_url


def test_normalize_database_url_adds_asyncpg_for_postgresql():
    assert (
        normalize_database_url("postgresql://user:pass@host/db?sslmode=require")
        == "postgresql+asyncpg://user:pass@host/db?sslmode=require"
    )


def test_asyncpg_database_url_strips_sslmode_and_maps_ssl():
    url, connect_args = asyncpg_database_url(
        "postgresql+asyncpg://user:pass@host/db?sslmode=require"
    )
    assert url == "postgresql+asyncpg://user:pass@host/db"
    assert connect_args == {"ssl": True}


def test_asyncpg_database_url_preserves_other_query_params():
    url, connect_args = asyncpg_database_url(
        "postgresql+asyncpg://user:pass@host/db?sslmode=require&connect_timeout=10"
    )
    assert url == "postgresql+asyncpg://user:pass@host/db?connect_timeout=10"
    assert connect_args == {"ssl": True}


def test_settings_async_database_url_strips_sslmode(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://user:pass@host/db?sslmode=require",
    )
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.database_url_async == "postgresql+asyncpg://user:pass@host/db"
    assert settings.database_connect_args == {"ssl": True}
    assert "sslmode=require" in settings.database_url_sync
    get_settings.cache_clear()


def test_normalize_database_url_converts_postgres_scheme():
    assert (
        normalize_database_url("postgres://user:pass@host/db")
        == "postgresql+asyncpg://user:pass@host/db"
    )


def test_normalize_database_url_keeps_asyncpg():
    url = "postgresql+asyncpg://user:pass@host/db"
    assert normalize_database_url(url) == url


def test_normalize_database_url_fixes_ostgresql_typo():
    url = "ostgresql+asyncpg://user:pass@host/db"
    assert (
        normalize_database_url(url)
        == "postgresql+asyncpg://user:pass@host/db"
    )


def test_settings_default_ingest_mode_sync(monkeypatch):
    monkeypatch.delenv("INGEST_MODE", raising=False)
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.ingest_mode == "sync"
    get_settings.cache_clear()


def test_settings_normalizes_env_style_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host/db")
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.database_url.startswith("postgresql+asyncpg://")
    get_settings.cache_clear()

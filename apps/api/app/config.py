from functools import lru_cache
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# libpq/psycopg query params that asyncpg rejects when passed through the URL
_ASYNCPG_INCOMPATIBLE_QUERY_PARAMS = frozenset({"sslmode", "channel_binding"})


def asyncpg_database_url(url: str) -> tuple[str, dict[str, object]]:
    """Strip libpq-only query params and map sslmode to asyncpg connect_args."""
    parsed = urlparse(url)
    if not parsed.query:
        return url, {}

    params = parse_qs(parsed.query)
    connect_args: dict[str, object] = {}

    sslmode_values = params.pop("sslmode", [])
    if sslmode_values:
        sslmode = sslmode_values[0]
        if sslmode in ("require", "verify-ca", "verify-full"):
            connect_args["ssl"] = True
        elif sslmode == "disable":
            connect_args["ssl"] = False

    for key in _ASYNCPG_INCOMPATIBLE_QUERY_PARAMS:
        params.pop(key, None)

    flat = [(key, value) for key, values in params.items() for value in values]
    clean_url = urlunparse(parsed._replace(query=urlencode(flat)))
    return clean_url, connect_args


def normalize_database_url(url: str) -> str:
    """Ensure async SQLAlchemy engine uses asyncpg (Neon/Render often paste postgresql://)."""
    normalized = url.strip()
    # Common copy/paste typo on Render — produces sqlalchemy.dialects:ostgresql.asyncpg
    if normalized.startswith("ostgresql"):
        normalized = "p" + normalized
    scheme = normalized.split("://", 1)[0]
    if "+asyncpg" in scheme or "+psycopg" in scheme:
        return normalized
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized[len("postgres://") :]
    if normalized.startswith("postgresql://"):
        return normalized.replace("postgresql://", "postgresql+asyncpg://", 1)
    return normalized


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://backstory:backstory@localhost:5433/backstory"
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    redis_url: str = "redis://localhost:6380/0"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://backstory-ai.vercel.app"
    upload_dir: str = "data/uploads"
    github_token: str = ""
    max_upload_bytes: int = 10_485_760  # 10 MB
    openai_api_key: str = ""
    embedding_provider: str = "local"  # local (free) | openai (paid API)
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 384
    embedding_batch_size: int = 64
    google_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: str = "groq"  # groq (free cloud) | ollama (free local) | gemini
    llm_model: str = "llama-3.1-8b-instant"  # provider-specific; see .env.example
    ollama_base_url: str = "http://localhost:11434"
    llm_temperature: float = 0.2
    llm_max_output_tokens: int = 2048
    llm_context_passages: int = 5  # passages sent to LLM (keep low for Groq free tier)
    llm_context_max_chars: int = 600  # chars per passage in LLM prompt
    retrieval_top_k: int = 12
    retrieval_neighbor_limit: int = 4
    retrieval_min_rrf_score: float = 0.008
    media_dir: str = "data/interviews"
    interview_max_upload_bytes: int = 104_857_600  # 100 MB
    transcribe_provider: str = "groq"
    transcribe_model: str = "whisper-large-v3"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"
    sentry_dsn: str = ""
    e2e_test_mode: bool = False
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: object) -> object:
        if isinstance(value, str):
            return normalize_database_url(value)
        return value

    @property
    def database_url_async(self) -> str:
        """Async driver URL with libpq query params removed (asyncpg-safe)."""
        url, _ = asyncpg_database_url(self.database_url)
        return url

    @property
    def database_connect_args(self) -> dict[str, object]:
        """asyncpg connect_args derived from libpq sslmode in DATABASE_URL."""
        _, connect_args = asyncpg_database_url(self.database_url)
        return connect_args

    @property
    def database_url_sync(self) -> str:
        """Sync driver URL for Celery workers."""
        return self.database_url.replace("+asyncpg", "+psycopg")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

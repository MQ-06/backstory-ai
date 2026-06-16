from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://backstory:backstory@localhost:5433/backstory"
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    redis_url: str = "redis://localhost:6380/0"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    upload_dir: str = "data/uploads"
    github_token: str = ""
    max_upload_bytes: int = 10_485_760  # 10 MB
    openai_api_key: str = ""
    embedding_provider: str = "local"  # local (free) | openai (paid API)
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 384
    embedding_batch_size: int = 64

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

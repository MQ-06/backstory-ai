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

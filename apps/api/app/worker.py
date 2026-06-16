from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "backstory",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.ingest"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.ingest.run_source_ingest": {"queue": "ingest"},
    },
    task_default_queue="ingest",
)

# Import task modules so @celery_app.task decorators register.
import app.tasks.ingest  # noqa: E402, F401

"""Background ingestion tasks."""

import uuid

from app.db_sync import get_sync_db
from app.models import Source
from app.services.chunk_embed import embed_source_chunks
from app.services.doc_ingest import ingest_doc_source
from app.services.git_ingest import ingest_git_source
from app.services.ticket_ingest import ingest_ticket_source
from app.worker import celery_app


def _finalize_source(db, source: Source, detail: str) -> str:
    try:
        embed = embed_source_chunks(db, source)
        return detail + embed.suffix()
    except Exception as exc:
        config = dict(source.config or {})
        config["embeddings_ready"] = False
        config["embedding_error"] = str(exc)[:200]
        source.config = config
        return f"{detail} (vectors failed — {exc})"


@celery_app.task(name="app.tasks.ingest.run_source_ingest")
def run_source_ingest(source_id: str) -> dict[str, str]:
    sid = uuid.UUID(source_id)

    with get_sync_db() as db:
        source = db.get(Source, sid)
        if source is None:
            return {"status": "missing"}

        source.status = "processing"
        source.error_message = None
        source.status_detail = "Starting ingestion…"
        db.flush()

        try:
            if source.type == "git":
                repo_url = (source.config or {}).get("repo_url", "")
                result = ingest_git_source(db, source, repo_url)
                detail = _finalize_source(db, source, result.summary)
            elif source.type == "docs":
                result = ingest_doc_source(db, source)
                detail = _finalize_source(db, source, result.summary)
            elif source.type == "tickets":
                result = ingest_ticket_source(db, source)
                detail = _finalize_source(db, source, result.summary)
            else:
                raise ValueError(f"Unknown source type: {source.type}")

            source.status = "indexed"
            source.status_detail = detail
            source.error_message = None
            db.flush()
            return {"status": "indexed", "detail": detail}
        except Exception as exc:
            logger_msg = str(exc)
            source.status = "error"
            source.error_message = logger_msg
            source.status_detail = None
            db.flush()
            return {"status": "error", "detail": logger_msg}

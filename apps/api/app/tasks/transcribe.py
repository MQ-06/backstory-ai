"""Background transcription + indexing tasks."""

import uuid

from app.db_sync import get_sync_db
from app.models import Interview
from app.services.interview_storage import resolve_media_path
from app.services.transcribe import transcribe_media_file
from app.services.transcript_ingest import ingest_transcript_segments
from app.worker import celery_app


@celery_app.task(name="app.tasks.transcribe.run_interview_transcribe")
def run_interview_transcribe(interview_id: str) -> dict[str, str]:
    iid = uuid.UUID(interview_id)

    with get_sync_db() as db:
        interview = db.get(Interview, iid)
        if interview is None:
            return {"status": "missing"}

        if not interview.media_path:
            interview.status = "error"
            interview.error_message = "No media uploaded"
            db.flush()
            return {"status": "error", "detail": "No media uploaded"}

        interview.status = "transcribing"
        interview.status_detail = "Transcribing audio…"
        interview.error_message = None
        db.flush()

        try:
            segments = transcribe_media_file(resolve_media_path(interview.media_path))
            if not segments:
                raise RuntimeError("Transcription returned no segments")

            interview.status_detail = f"Indexing {len(segments)} segments…"
            db.flush()

            count = ingest_transcript_segments(db, interview, segments)
            if segments:
                interview.duration_seconds = segments[-1].end_seconds or None
            return {"status": "indexed", "detail": f"{count} segments indexed"}
        except Exception as exc:
            msg = str(exc)
            interview.status = "error"
            interview.error_message = msg
            interview.status_detail = None
            db.flush()
            return {"status": "error", "detail": msg}

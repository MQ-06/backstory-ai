"""Interview media storage — local disk or R2."""

from pathlib import Path

from app.config import get_settings
from app.services.storage import get_storage_backend


def interview_media_dir(engagement_id: str, interview_id: str) -> Path:
    settings = get_settings()
    path = Path(settings.media_dir) / engagement_id / interview_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_interview_media(
    engagement_id: str,
    interview_id: str,
    filename: str,
    data: bytes,
) -> tuple[str, str]:
    safe_name = Path(filename).name or "recording.webm"
    mime = "video/webm"
    lower = safe_name.lower()
    if lower.endswith(".mp4"):
        mime = "video/mp4"
    elif lower.endswith(".mp3"):
        mime = "audio/mpeg"
    elif lower.endswith(".wav"):
        mime = "audio/wav"
    elif lower.endswith(".m4a"):
        mime = "audio/mp4"

    key = f"interviews/{engagement_id}/{interview_id}/{safe_name}"
    stored = get_storage_backend().save_bytes(key, data, content_type=mime)
    return stored, mime


def resolve_media_path(stored_path: str) -> Path:
    return get_storage_backend().resolve_path(stored_path)

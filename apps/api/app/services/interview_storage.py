"""Local media storage for interview recordings."""

from pathlib import Path

from app.config import get_settings


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
    dest_dir = interview_media_dir(engagement_id, interview_id)
    safe_name = Path(filename).name or "recording.webm"
    dest = dest_dir / safe_name
    dest.write_bytes(data)
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
    return str(dest), mime


def resolve_media_path(stored_path: str) -> Path:
    return Path(stored_path)

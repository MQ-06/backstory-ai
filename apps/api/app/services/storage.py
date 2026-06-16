"""Local file storage for document uploads (R2 in production later)."""

from pathlib import Path

from app.config import get_settings


def engagement_upload_dir(engagement_id: str, source_id: str) -> Path:
    settings = get_settings()
    path = Path(settings.upload_dir) / engagement_id / source_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload_bytes(engagement_id: str, source_id: str, filename: str, data: bytes) -> str:
    dest_dir = engagement_upload_dir(engagement_id, source_id)
    safe_name = Path(filename).name
    dest = dest_dir / safe_name
    dest.write_bytes(data)
    return str(dest)

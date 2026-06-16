"""Audio/video transcription via Groq Whisper API."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import httpx

from app.config import get_settings

GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


@dataclass(frozen=True)
class TranscriptSegmentData:
    start_seconds: float
    end_seconds: float
    text: str


def transcribe_media_file(path: Path) -> list[TranscriptSegmentData]:
    settings = get_settings()
    if settings.transcribe_provider == "groq":
        return _transcribe_groq(path)
    raise RuntimeError(f"Unknown TRANSCRIBE_PROVIDER={settings.transcribe_provider!r}")


def _transcribe_groq(path: Path) -> list[TranscriptSegmentData]:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is required for transcription")

    suffix = path.suffix.lower()
    mime = "application/octet-stream"
    if suffix in {".webm", ".mp4", ".mpeg", ".mpga"}:
        mime = f"video/{suffix.lstrip('.')}"
    elif suffix in {".mp3", ".wav", ".m4a"}:
        mime = f"audio/{suffix.lstrip('.')}"

    with path.open("rb") as handle:
        files = {"file": (path.name, handle, mime)}
        data = {
            "model": settings.transcribe_model,
            "response_format": "verbose_json",
            "timestamp_granularities[]": "segment",
        }
        headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
        with httpx.Client(timeout=300.0) as client:
            response = client.post(GROQ_TRANSCRIBE_URL, headers=headers, files=files, data=data)
            if response.status_code >= 400:
                raise RuntimeError(f"Groq transcription error {response.status_code}: {response.text[:400]}")
            payload = response.json()

    segments: list[TranscriptSegmentData] = []
    for seg in payload.get("segments") or []:
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        segments.append(
            TranscriptSegmentData(
                start_seconds=float(seg.get("start", 0)),
                end_seconds=float(seg.get("end", 0)),
                text=text,
            )
        )

    if not segments:
        full_text = (payload.get("text") or "").strip()
        if full_text:
            segments.append(TranscriptSegmentData(0.0, 0.0, full_text))
    return segments

"""Gemini streaming generation client."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.config import get_settings

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _parse_gemini_error(body: bytes) -> str | None:
    try:
        payload = json.loads(body)
        err = payload.get("error") or {}
        message = err.get("message")
        if message:
            # Keep first line — full Google messages are verbose.
            return message.split("\n")[0].strip()
    except (json.JSONDecodeError, AttributeError):
        pass
    return None


async def stream_gemini_text(
    *,
    system_instruction: str,
    user_prompt: str,
) -> AsyncIterator[str]:
    """Stream text tokens from Gemini generateContent API."""
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not configured")

    model = settings.llm_model
    url = f"{GEMINI_BASE}/models/{model}:streamGenerateContent"

    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": settings.llm_temperature,
            "maxOutputTokens": settings.llm_max_output_tokens,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            url,
            params={"key": settings.google_api_key, "alt": "sse"},
            json=payload,
        ) as response:
            if response.status_code == 401:
                raise RuntimeError(
                    "Invalid GOOGLE_API_KEY — create a key at https://aistudio.google.com/apikey"
                )
            if response.status_code == 429:
                body = await response.aread()
                detail = _parse_gemini_error(body)
                raise RuntimeError(
                    detail
                    or "Gemini quota exceeded — create a new key at https://aistudio.google.com/apikey "
                    "or enable billing on your Google AI project."
                )
            if response.status_code >= 400:
                body = await response.aread()
                detail = _parse_gemini_error(body)
                raise RuntimeError(
                    detail or f"Gemini API error {response.status_code}: {body.decode()[:300]}"
                )

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:].strip()
                if not raw or raw == "[DONE]":
                    continue
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                for candidate in event.get("candidates", []):
                    content = candidate.get("content") or {}
                    for part in content.get("parts", []):
                        text = part.get("text")
                        if text:
                            yield text

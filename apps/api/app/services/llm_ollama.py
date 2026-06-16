"""Ollama — free local LLM (no API key, runs on your machine)."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.config import get_settings


async def stream_ollama_text(
    *,
    system_instruction: str,
    user_prompt: str,
) -> AsyncIterator[str]:
    settings = get_settings()
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
        "options": {"temperature": settings.llm_temperature},
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code == 404:
                    raise RuntimeError(
                        f"Ollama model {settings.llm_model!r} not found. "
                        f"Run: ollama pull {settings.llm_model}"
                    )
                if response.status_code >= 400:
                    body = await response.aread()
                    raise RuntimeError(
                        f"Ollama error {response.status_code}: {body.decode()[:300]}"
                    )

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    message = event.get("message") or {}
                    content = message.get("content")
                    if content:
                        yield content
    except httpx.ConnectError as exc:
        raise RuntimeError(
            "Ollama is not running. Install from https://ollama.com then run: "
            f"ollama pull {settings.llm_model} && ollama serve"
        ) from exc

"""Groq — free cloud LLM tier (fast, no credit card for dev)."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.config import get_settings

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


async def stream_groq_text(
    *,
    system_instruction: str,
    user_prompt: str,
) -> AsyncIterator[str]:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured — get a free key at https://console.groq.com/keys"
        )

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": settings.llm_temperature,
        "max_tokens": settings.llm_max_output_tokens,
        "stream": True,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", GROQ_CHAT_URL, headers=headers, json=payload) as response:
            if response.status_code == 401:
                raise RuntimeError("Invalid GROQ_API_KEY")
            if response.status_code == 429:
                raise RuntimeError("Groq rate limit exceeded — wait a minute and retry")
            if response.status_code >= 400:
                body = await response.aread()
                raise RuntimeError(f"Groq API error {response.status_code}: {body.decode()[:300]}")

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
                for choice in event.get("choices", []):
                    delta = choice.get("delta") or {}
                    content = delta.get("content")
                    if content:
                        yield content

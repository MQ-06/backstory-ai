"""Unified LLM streaming — dispatches to free/local or cloud providers."""

from __future__ import annotations

from collections.abc import AsyncIterator

from app.config import get_settings


async def stream_llm_text(
    *,
    system_instruction: str,
    user_prompt: str,
) -> AsyncIterator[str]:
    """Stream answer tokens from the configured LLM provider."""
    settings = get_settings()
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        from app.services.llm_ollama import stream_ollama_text

        async for token in stream_ollama_text(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
        ):
            yield token
        return

    if provider == "groq":
        from app.services.llm_groq import stream_groq_text

        async for token in stream_groq_text(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
        ):
            yield token
        return

    if provider == "gemini":
        from app.services.llm_gemini import stream_gemini_text

        async for token in stream_gemini_text(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
        ):
            yield token
        return

    raise RuntimeError(
        f"Unknown LLM_PROVIDER={settings.llm_provider!r}. "
        "Use ollama (free local), groq (free cloud), or gemini."
    )


def llm_config_error() -> str | None:
    """Return a user-facing message if LLM env is misconfigured, else None."""
    settings = get_settings()
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        return None  # validated at request time (Ollama reachability)

    if provider == "groq":
        if not settings.groq_api_key:
            return (
                "GROQ_API_KEY is not configured. "
                "Get a free key at https://console.groq.com/keys"
            )
        return None

    if provider == "gemini":
        if not settings.google_api_key:
            return (
                "GOOGLE_API_KEY is not configured. "
                "Create a free key at https://aistudio.google.com/apikey"
            )
        if not settings.google_api_key.startswith("AIza"):
            return (
                "GOOGLE_API_KEY should start with AIza (from Google AI Studio). "
                "Create one at https://aistudio.google.com/apikey"
            )
        return None

    return f"Unknown LLM_PROVIDER={settings.llm_provider!r}"

from app.services.embeddings import truncate_for_embedding


def test_truncate_for_embedding():
    short = "hello"
    assert truncate_for_embedding(short) == "hello"
    long = "x" * 10_000
    assert len(truncate_for_embedding(long)) == 8_000


def test_embed_skips_without_api_key_when_openai_provider():
    from unittest.mock import MagicMock, patch

    from app.services.chunk_embed import embed_source_chunks

    source = MagicMock()
    source.config = {}
    db = MagicMock()
    db.execute.return_value.scalars.return_value = []

    with patch("app.services.chunk_embed.get_settings") as mock_settings:
        mock_settings.return_value.embedding_provider = "openai"
        mock_settings.return_value.openai_api_key = ""
        result = embed_source_chunks(db, source)

    assert result.skipped is True
    assert result.reason == "no_api_key"
    assert source.config["embeddings_ready"] is False


def test_embed_does_not_skip_for_local_provider_without_openai_key():
    from unittest.mock import MagicMock, patch

    from app.services.chunk_embed import embed_source_chunks

    source = MagicMock()
    source.config = {}
    source.id = "test"
    db = MagicMock()
    db.execute.return_value.scalars.return_value = []

    with patch("app.services.chunk_embed.get_settings") as mock_settings:
        mock_settings.return_value.embedding_provider = "local"
        mock_settings.return_value.openai_api_key = ""
        mock_settings.return_value.embedding_batch_size = 64
        result = embed_source_chunks(db, source)

    assert result.skipped is False
    assert source.config["embeddings_ready"] is True

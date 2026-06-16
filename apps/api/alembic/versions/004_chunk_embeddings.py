"""Add pgvector embeddings column + HNSW index on chunks."""

from typing import Sequence, Union

from alembic import op

revision: str = "004_chunk_embeddings"
down_revision: Union[str, None] = "003_sprint1_content"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIM = 1536


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute(
        f"ALTER TABLE chunk ADD COLUMN embedding vector({EMBEDDING_DIM})"
    )
    op.execute(
        """
        CREATE INDEX ix_chunk_embedding_hnsw ON chunk
        USING hnsw (embedding vector_cosine_ops)
        WHERE embedding IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_chunk_embedding_hnsw")
    op.execute("ALTER TABLE chunk DROP COLUMN IF EXISTS embedding")

"""Resize chunk embeddings to 384 dims for local open-source model."""

from typing import Sequence, Union

from alembic import op

revision: str = "006_embedding_384_local"
down_revision: Union[str, None] = "005_chunk_fts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIM = 384


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_chunk_embedding_hnsw")
    op.execute("ALTER TABLE chunk DROP COLUMN IF EXISTS embedding")
    op.execute(f"ALTER TABLE chunk ADD COLUMN embedding vector({EMBEDDING_DIM})")
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
    op.execute("ALTER TABLE chunk ADD COLUMN embedding vector(1536)")
    op.execute(
        """
        CREATE INDEX ix_chunk_embedding_hnsw ON chunk
        USING hnsw (embedding vector_cosine_ops)
        WHERE embedding IS NOT NULL
        """
    )

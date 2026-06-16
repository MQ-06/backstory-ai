"""Add generated tsvector column + GIN index on chunks for keyword search."""

from typing import Sequence, Union

from alembic import op

revision: str = "005_chunk_fts"
down_revision: Union[str, None] = "004_chunk_embeddings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE chunk
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
        """
    )
    op.execute(
        """
        CREATE INDEX ix_chunk_search_vector ON chunk
        USING GIN (search_vector)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_chunk_search_vector")
    op.execute("ALTER TABLE chunk DROP COLUMN IF EXISTS search_vector")

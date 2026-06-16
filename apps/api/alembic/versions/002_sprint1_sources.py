"""Sprint 1 — extend source table for ingestion pipeline."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_sprint1_sources"
down_revision: Union[str, None] = "001_sprint0_core"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("source", sa.Column("external_id", sa.String(512), nullable=True))
    op.add_column(
        "source",
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("source", sa.Column("error_message", sa.Text(), nullable=True))
    op.add_column("source", sa.Column("status_detail", sa.Text(), nullable=True))
    op.add_column(
        "source",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_source_engagement_type_external",
        "source",
        ["engagement_id", "type", "external_id"],
        unique=True,
        postgresql_where=sa.text("external_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_source_engagement_type_external", table_name="source")
    op.drop_column("source", "updated_at")
    op.drop_column("source", "status_detail")
    op.drop_column("source", "error_message")
    op.drop_column("source", "config")
    op.drop_column("source", "external_id")

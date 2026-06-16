"""Sprint 1 — code_entity, artifact, chunk for ingestion."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_sprint1_content"
down_revision: Union[str, None] = "002_sprint1_sources"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "code_entity",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("path", sa.String(1024), nullable=False),
        sa.Column("commit_sha", sa.String(64), nullable=False),
        sa.Column("line_start", sa.Integer(), nullable=True),
        sa.Column("line_end", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(64), nullable=True),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["source.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_code_entity_engagement_id", "code_entity", ["engagement_id"])
    op.create_index("ix_code_entity_source_id", "code_entity", ["source_id"])
    op.create_index(
        "ix_code_entity_source_external",
        "code_entity",
        ["source_id", "external_id"],
        unique=True,
    )

    op.create_table(
        "artifact",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("artifact_type", sa.String(50), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["source.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_artifact_engagement_id", "artifact", ["engagement_id"])
    op.create_index("ix_artifact_source_id", "artifact", ["source_id"])
    op.create_index(
        "ix_artifact_source_external",
        "artifact",
        ["source_id", "external_id"],
        unique=True,
    )

    op.create_table(
        "chunk",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code_entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("artifact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("line_start", sa.Integer(), nullable=True),
        sa.Column("line_end", sa.Integer(), nullable=True),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["source.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["code_entity_id"], ["code_entity.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["artifact_id"], ["artifact.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_chunk_engagement_id", "chunk", ["engagement_id"])
    op.create_index("ix_chunk_source_id", "chunk", ["source_id"])
    op.create_index(
        "ix_chunk_source_external",
        "chunk",
        ["source_id", "external_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_chunk_source_external", table_name="chunk")
    op.drop_index("ix_chunk_source_id", table_name="chunk")
    op.drop_index("ix_chunk_engagement_id", table_name="chunk")
    op.drop_table("chunk")
    op.drop_index("ix_artifact_source_external", table_name="artifact")
    op.drop_index("ix_artifact_source_id", table_name="artifact")
    op.drop_index("ix_artifact_engagement_id", table_name="artifact")
    op.drop_table("artifact")
    op.drop_index("ix_code_entity_source_external", table_name="code_entity")
    op.drop_index("ix_code_entity_source_id", table_name="code_entity")
    op.drop_index("ix_code_entity_engagement_id", table_name="code_entity")
    op.drop_table("code_entity")

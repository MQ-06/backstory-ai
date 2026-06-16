"""Sprint 2 — link table, answer, citation for RAG."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_sprint2_ask"
down_revision: Union[str, None] = "006_embedding_384_local"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "link",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("artifact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("from_chunk_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("code_entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("method", sa.String(50), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["artifact_id"], ["artifact.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["from_chunk_id"], ["chunk.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["code_entity_id"], ["code_entity.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_link_engagement_id", "link", ["engagement_id"])
    op.create_index("ix_link_artifact_id", "link", ["artifact_id"])
    op.create_index("ix_link_code_entity_id", "link", ["code_entity_id"])

    op.create_table(
        "answer",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("refused", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("refusal_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_answer_engagement_id", "answer", ["engagement_id"])

    op.create_table(
        "citation",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("answer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("citation_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(512), nullable=False),
        sa.Column("snippet", sa.Text(), nullable=True),
        sa.Column("locator", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["answer_id"], ["answer.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["chunk_id"], ["chunk.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_citation_answer_id", "citation", ["answer_id"])


def downgrade() -> None:
    op.drop_index("ix_citation_answer_id", table_name="citation")
    op.drop_table("citation")
    op.drop_index("ix_answer_engagement_id", table_name="answer")
    op.drop_table("answer")
    op.drop_index("ix_link_code_entity_id", table_name="link")
    op.drop_index("ix_link_artifact_id", table_name="link")
    op.drop_index("ix_link_engagement_id", table_name="link")
    op.drop_table("link")

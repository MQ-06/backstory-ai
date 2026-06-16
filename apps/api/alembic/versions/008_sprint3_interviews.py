"""Sprint 3 — archaeology brief, interview, transcript segments."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_sprint3_interviews"
down_revision: Union[str, None] = "007_sprint2_ask"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "archaeology_brief",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("expert_name", sa.String(255), nullable=True),
        sa.Column("module_path", sa.String(1024), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="ready"),
        sa.Column("signals", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_archaeology_brief_engagement_id", "archaeology_brief", ["engagement_id"])

    op.create_table(
        "brief_question",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("brief_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("evidence", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("code_entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["brief_id"], ["archaeology_brief.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["code_entity_id"], ["code_entity.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_brief_question_brief_id", "brief_question", ["brief_id"])

    op.create_table(
        "interview",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("engagement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("brief_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("expert_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("media_path", sa.Text(), nullable=True),
        sa.Column("media_mime", sa.String(128), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status_detail", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["engagement_id"], ["engagement.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["brief_id"], ["archaeology_brief.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_id"], ["source.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_interview_engagement_id", "interview", ["engagement_id"])

    op.create_table(
        "transcript_segment",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("interview_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("segment_index", sa.Integer(), nullable=False),
        sa.Column("start_seconds", sa.Float(), nullable=False),
        sa.Column("end_seconds", sa.Float(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("artifact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["interview_id"], ["interview.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["artifact_id"], ["artifact.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_transcript_segment_interview_id", "transcript_segment", ["interview_id"])


def downgrade() -> None:
    op.drop_index("ix_transcript_segment_interview_id", table_name="transcript_segment")
    op.drop_table("transcript_segment")
    op.drop_index("ix_interview_engagement_id", table_name="interview")
    op.drop_table("interview")
    op.drop_index("ix_brief_question_brief_id", table_name="brief_question")
    op.drop_table("brief_question")
    op.drop_index("ix_archaeology_brief_engagement_id", table_name="archaeology_brief")
    op.drop_table("archaeology_brief")

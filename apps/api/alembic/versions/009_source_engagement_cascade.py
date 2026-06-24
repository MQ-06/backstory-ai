"""Source engagement_id ON DELETE CASCADE

Revision ID: 009_source_engagement_cascade
Revises: 008_sprint3_interviews
Create Date: 2026-06-24

"""

from typing import Sequence, Union

from alembic import op

revision: str = "009_source_engagement_cascade"
down_revision: Union[str, None] = "008_sprint3_interviews"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("source_engagement_id_fkey", "source", type_="foreignkey")
    op.create_foreign_key(
        "source_engagement_id_fkey",
        "source",
        "engagement",
        ["engagement_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("source_engagement_id_fkey", "source", type_="foreignkey")
    op.create_foreign_key(
        "source_engagement_id_fkey",
        "source",
        "engagement",
        ["engagement_id"],
        ["id"],
    )

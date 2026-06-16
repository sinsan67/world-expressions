"""add_index_expression_tags_tag_id

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-06-16

Add a B-tree index on expression_tags(tag_id).
Without it, any lookup by tag_id requires a Seq Scan over 31K rows.
With it, concept_pass and phrasebook exclusion filters hit the index directly.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expression_tags_tag_id
        ON expression_tags (tag_id)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_expression_tags_tag_id")

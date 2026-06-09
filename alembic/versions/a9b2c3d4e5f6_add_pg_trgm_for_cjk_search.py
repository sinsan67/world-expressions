"""add_pg_trgm_for_cjk_search

Enables pg_trgm extension and adds GIN trigram indexes on expressions.text
and expression_content.meaning to support Japanese (CJK) full-text search.
Standard tsvector/tsquery tokenises by whitespace and doesn't work for Japanese.

Revision ID: a9b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-06-09

"""
from typing import Sequence, Union

from alembic import op


revision: str = "a9b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expressions_text_trgm
        ON expressions USING GIN(text gin_trgm_ops)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expression_content_meaning_trgm
        ON expression_content USING GIN(meaning gin_trgm_ops)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_expressions_text_trgm")
    op.execute("DROP INDEX IF EXISTS idx_expression_content_meaning_trgm")

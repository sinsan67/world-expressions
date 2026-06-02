"""add_gin_index_content_translations

Revision ID: a1f3c8e9d2b5
Revises: b99ab92c0334
Create Date: 2026-06-02

Add a GIN index on content_translations so cross-language FTS search
(word → translated meanings → expressions in other languages) is fast.
Without this index, searching 23k+ rows takes ~900ms; with it, <50ms.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a1f3c8e9d2b5'
down_revision: Union[str, Sequence[str], None] = 'b99ab92c0334'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_content_translations_fts
        ON content_translations
        USING GIN(to_tsvector('simple',
            coalesce(meaning, '') || ' ' ||
            coalesce(origin, '')  || ' ' ||
            coalesce(example, '')
        ))
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_content_translations_fts")

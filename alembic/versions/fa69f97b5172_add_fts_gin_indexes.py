"""add_fts_gin_indexes

Revision ID: fa69f97b5172
Revises: c23b035cc0c0
Create Date: 2026-05-28 17:28:21.123700

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa69f97b5172'
down_revision: Union[str, Sequence[str], None] = 'c23b035cc0c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expressions_text_fts
        ON expressions
        USING GIN(to_tsvector('simple', text))
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expression_content_fts
        ON expression_content
        USING GIN(to_tsvector('simple',
            coalesce(meaning, '') || ' ' ||
            coalesce(origin, '')  || ' ' ||
            coalesce(example, '')
        ))
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_expressions_text_fts")
    op.execute("DROP INDEX IF EXISTS idx_expression_content_fts")

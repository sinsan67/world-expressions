"""drop_newsletter_subscribers_table

Revision ID: e2a7f4c9b1d6
Revises: c4d5e6f7a8b9
Create Date: 2026-07-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2a7f4c9b1d6'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Formalizes under Alembic a drop that already happened manually in prod
    (S227, Audit Luke #2 L9): the newsletter feature never survived the
    games-hub pivot — frontend trigger died as collateral of the
    HomePage.tsx -> Hub.tsx rewrite, backend table was dropped by hand
    outside Alembic. `IF EXISTS` makes this safe on prod (already gone)
    and on any fresh/dev DB still carrying the original migration.
    """
    op.execute("DROP TABLE IF EXISTS newsletter_subscribers")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('newsletter_subscribers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('language', sa.String(length=10), server_default='en', nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )

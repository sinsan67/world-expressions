"""add_user_preferences_explore_mode_learning_langs_content_type

Revision ID: bef0c0b35db1
Revises: e7f8a9b0c1d2
Create Date: 2026-06-06 12:18:00.540527

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'bef0c0b35db1'
down_revision: Union[str, Sequence[str], None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column(
        'explore_mode',
        sa.String(length=20),
        server_default='multilingual',
        nullable=False,
    ))
    op.add_column('users', sa.Column(
        'learning_langs',
        postgresql.ARRAY(sa.String(length=10)),
        server_default='{}',
        nullable=False,
    ))
    op.add_column('users', sa.Column(
        'content_type',
        sa.String(length=20),
        server_default='all',
        nullable=False,
    ))


def downgrade() -> None:
    op.drop_column('users', 'content_type')
    op.drop_column('users', 'learning_langs')
    op.drop_column('users', 'explore_mode')

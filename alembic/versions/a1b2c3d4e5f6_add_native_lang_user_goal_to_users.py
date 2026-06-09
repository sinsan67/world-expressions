"""add native_lang and user_goal to users

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-06-09 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("native_lang", sa.String(10), nullable=True))
    op.add_column("users", sa.Column("user_goal", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "user_goal")
    op.drop_column("users", "native_lang")

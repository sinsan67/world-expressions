"""merge native_lang/user_goal and pg_trgm branches

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6, a9b2c3d4e5f6
Create Date: 2026-06-09 00:00:01.000000
"""
from typing import Sequence, Union

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = ("a1b2c3d4e5f6", "a9b2c3d4e5f6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

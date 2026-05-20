"""add_check_constraint_on_type

Revision ID: cef545ad50be
Revises: ff8d8b9f2d35
Create Date: 2026-05-20 03:52:36.435160

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cef545ad50be'
down_revision: Union[str, Sequence[str], None] = 'ff8d8b9f2d35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "ck_expressions_type",
        "expressions",
        "type IN ('expression', 'word')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_expressions_type", "expressions")

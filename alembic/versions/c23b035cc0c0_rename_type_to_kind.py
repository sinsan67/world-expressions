"""rename type column to kind

Revision ID: c23b035cc0c0
Revises: 6a1667fc
Create Date: 2026-05-28

`type` is a reserved word in PostgreSQL — every query needs double-quotes around it.
Renaming to `kind` removes that friction permanently.
PostgreSQL auto-updates the check constraint reference.
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c23b035cc0c0'
down_revision: Union[str, Sequence[str], None] = '6a1667fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE expressions RENAME COLUMN "type" TO kind')


def downgrade() -> None:
    op.execute('ALTER TABLE expressions RENAME COLUMN kind TO "type"')

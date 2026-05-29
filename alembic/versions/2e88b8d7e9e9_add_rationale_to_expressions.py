"""add rationale to expressions

Revision ID: 2e88b8d7e9e9
Revises: d6af52f5939a
Create Date: 2026-05-29 05:42:32.777757

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2e88b8d7e9e9'
down_revision: Union[str, Sequence[str], None] = 'd6af52f5939a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expressions', sa.Column('rationale', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('expressions', 'rationale')

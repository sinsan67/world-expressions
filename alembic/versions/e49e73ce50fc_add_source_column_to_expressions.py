"""add_source_column_to_expressions

Revision ID: e49e73ce50fc
Revises: cef545ad50be
Create Date: 2026-05-20 04:13:41.059049

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e49e73ce50fc'
down_revision: Union[str, Sequence[str], None] = 'cef545ad50be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expressions', sa.Column('source', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('expressions', 'source')

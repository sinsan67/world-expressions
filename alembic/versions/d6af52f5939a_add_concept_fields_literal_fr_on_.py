"""add concept fields: literal_fr on expressions, concept_confidence on expressions, name_fr on concepts

Revision ID: d6af52f5939a
Revises: fa69f97b5172
Create Date: 2026-05-29 04:30:58.684926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd6af52f5939a'
down_revision: Union[str, Sequence[str], None] = 'fa69f97b5172'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expressions', sa.Column('literal_fr', sa.Text(), nullable=True))
    op.add_column('expressions', sa.Column('concept_confidence', sa.Float(), nullable=True))
    op.add_column('concepts', sa.Column('name_fr', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('concepts', 'name_fr')
    op.drop_column('expressions', 'concept_confidence')
    op.drop_column('expressions', 'literal_fr')

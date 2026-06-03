"""add concept_domains table (tag → domain many-to-many)

Revision ID: e7f8a9b0c1d2
Revises: a1f3c8e9d2b5
Create Date: 2026-06-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'a1f3c8e9d2b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'concept_domains',
        sa.Column('tag_id', sa.String(60), sa.ForeignKey('tags.id', ondelete='CASCADE'), nullable=False),
        sa.Column('domain_slug', sa.String(30), nullable=False),
        sa.PrimaryKeyConstraint('tag_id', 'domain_slug'),
    )
    op.create_index('ix_concept_domains_domain_slug', 'concept_domains', ['domain_slug'])


def downgrade() -> None:
    op.drop_index('ix_concept_domains_domain_slug', table_name='concept_domains')
    op.drop_table('concept_domains')

"""pivot_game_sessions_reports_review

Games hub pivot — Lot API (docs/pivot-lot0-contract.md §2):
  - new table game_sessions (Voyage / Révision draws)
  - new table expression_reports (🚩 flag)
  - user_favorites gains review_box / reviewed_at / game_session_id (Leitner box, v1 semantics)
  - users gains language_modes (🧳/📚 profile per language, JSONB)

Revision ID: c4d5e6f7a8b9
Revises: f2a3b4c5d6e7
Create Date: 2026-07-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── game_sessions ────────────────────────────────────────────────────
    op.create_table(
        'game_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', sa.String(length=64), nullable=False),
        sa.Column('game', sa.String(length=20), nullable=False),
        sa.Column('filters', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('cards', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('kept_ids', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_game_sessions_user_id', 'game_sessions', ['user_id'])
    op.create_index('ix_game_sessions_client_id', 'game_sessions', ['client_id'])
    op.create_index('ix_game_sessions_started_at', 'game_sessions', ['started_at'])

    # ── expression_reports (🚩) ─────────────────────────────────────────
    op.create_table(
        'expression_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expression_id', sa.String(length=120), nullable=False),
        sa.Column('reason', sa.String(length=30), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', sa.String(length=64), nullable=True),
        sa.Column('ui_lang', sa.String(length=10), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='open', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['expression_id'], ['expressions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    # Dedupe rule (contract §2): one OPEN report per (client_id, expression_id).
    # Partial unique index — only enforced while status='open', so a resolved/dismissed
    # report doesn't block a later, distinct report on the same expression.
    op.execute("""
        CREATE UNIQUE INDEX ix_expression_reports_open_client_expr
        ON expression_reports (client_id, expression_id)
        WHERE status = 'open' AND client_id IS NOT NULL
    """)

    # ── user_favorites: Leitner box fields (v1 semantics, full box stored from day 1) ──
    op.add_column('user_favorites', sa.Column('review_box', sa.SmallInteger(), server_default='0', nullable=False))
    op.add_column('user_favorites', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_favorites', sa.Column('game_session_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_user_favorites_game_session_id', 'user_favorites', 'game_sessions',
        ['game_session_id'], ['id'], ondelete='SET NULL',
    )

    # ── users: language_modes (🧳/📚 profile per language) ──────────────
    op.add_column('users', sa.Column('language_modes', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'language_modes')

    op.drop_constraint('fk_user_favorites_game_session_id', 'user_favorites', type_='foreignkey')
    op.drop_column('user_favorites', 'game_session_id')
    op.drop_column('user_favorites', 'reviewed_at')
    op.drop_column('user_favorites', 'review_box')

    op.execute("DROP INDEX IF EXISTS ix_expression_reports_open_client_expr")
    op.drop_table('expression_reports')

    op.drop_index('ix_game_sessions_started_at', table_name='game_sessions')
    op.drop_index('ix_game_sessions_client_id', table_name='game_sessions')
    op.drop_index('ix_game_sessions_user_id', table_name='game_sessions')
    op.drop_table('game_sessions')

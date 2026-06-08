"""add_email_auth

Adds password_hash, email_verified to users (google_id nullable),
and creates email_tokens table for verify/reset flows.

Revision ID: f1a2b3c4d5e6
Revises: bef0c0b35db1
Create Date: 2026-06-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "bef0c0b35db1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make google_id nullable (email users won't have one)
    op.alter_column("users", "google_id", nullable=True)

    # Add email auth columns
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # One-time tokens for email verification and password reset
    op.create_table(
        "email_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("purpose", sa.String(length=16), nullable=False),  # 'verify' | 'reset'
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )


def downgrade() -> None:
    op.drop_table("email_tokens")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "password_hash")
    op.alter_column("users", "google_id", nullable=False)

"""expression type taxonomy: idiom, proverb, locution, word

Replaces the binary expression/word type with a 4-value taxonomy.
- expression → idiom (rename, same semantic)
- proverb-tagged expressions → type = proverb
- locution-tagged expressions → type = locution
- proverb and locution tags removed from tags/expression_tags (type info now on expression)

Revision ID: 6a1667fc
Revises: cc9a44b2effc
Create Date: 2026-05-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '6a1667fc'
down_revision: Union[str, Sequence[str], None] = 'cc9a44b2effc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE expressions DROP CONSTRAINT IF EXISTS ck_expressions_type")

    op.execute("UPDATE expressions SET type = 'idiom' WHERE type = 'expression'")

    op.execute("""
        UPDATE expressions SET type = 'proverb'
        WHERE id IN (
            SELECT expression_id FROM expression_tags WHERE tag_id = 'proverb'
        )
    """)

    op.execute("""
        UPDATE expressions SET type = 'locution'
        WHERE id IN (
            SELECT expression_id FROM expression_tags WHERE tag_id = 'locution'
        )
    """)

    op.execute("DELETE FROM expression_tags WHERE tag_id IN ('proverb', 'locution')")
    op.execute("DELETE FROM tag_names WHERE tag_id IN ('proverb', 'locution')")
    op.execute("DELETE FROM tags WHERE id IN ('proverb', 'locution')")

    op.execute("ALTER TABLE expressions ALTER COLUMN type SET DEFAULT 'idiom'")

    op.create_check_constraint(
        "ck_expressions_type",
        "expressions",
        "type IN ('idiom', 'word', 'proverb', 'locution')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_expressions_type", "expressions")

    op.execute("INSERT INTO tags (id, slug) VALUES ('proverb', 'proverb') ON CONFLICT DO NOTHING")
    op.execute("INSERT INTO tags (id, slug) VALUES ('locution', 'locution') ON CONFLICT DO NOTHING")

    op.execute("""
        INSERT INTO expression_tags (expression_id, tag_id)
        SELECT id, 'proverb' FROM expressions WHERE type = 'proverb'
        ON CONFLICT DO NOTHING
    """)
    op.execute("""
        INSERT INTO expression_tags (expression_id, tag_id)
        SELECT id, 'locution' FROM expressions WHERE type = 'locution'
        ON CONFLICT DO NOTHING
    """)

    op.execute("UPDATE expressions SET type = 'expression' WHERE type IN ('idiom', 'proverb', 'locution')")
    op.execute("ALTER TABLE expressions ALTER COLUMN type SET DEFAULT 'expression'")

    op.create_check_constraint(
        "ck_expressions_type",
        "expressions",
        "type IN ('expression', 'word')",
    )

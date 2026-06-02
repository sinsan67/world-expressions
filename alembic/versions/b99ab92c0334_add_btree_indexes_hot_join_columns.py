"""add_btree_indexes_hot_join_columns

Indexes B-tree sur les colonnes de JOIN les plus sollicitées.
Couvre les hot paths : pages expression, traductions à la demande,
section "La même idée", et tags sur chaque requête.

Revision ID: b99ab92c0334
Revises: d6af52f5939a
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b99ab92c0334'
down_revision: Union[str, Sequence[str], None] = '39ae14bade48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # expression_content : filtré par (expression_id, locale) sur chaque page expression
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expression_content_expr_locale
        ON expression_content (expression_id, locale)
    """)

    # content_translations : filtré par (expression_id, target_lang) pour les traductions à la demande
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_content_translations_expr_lang
        ON content_translations (expression_id, target_lang)
    """)

    # expressions.concept_id : utilisé pour la section "La même idée"
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expressions_concept_id
        ON expressions (concept_id)
    """)

    # expression_tags.expression_id : jointure omniprésente dans toutes les requêtes avec tags
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_expression_tags_expression_id
        ON expression_tags (expression_id)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_expression_content_expr_locale")
    op.execute("DROP INDEX IF EXISTS idx_content_translations_expr_lang")
    op.execute("DROP INDEX IF EXISTS idx_expressions_concept_id")
    op.execute("DROP INDEX IF EXISTS idx_expression_tags_expression_id")

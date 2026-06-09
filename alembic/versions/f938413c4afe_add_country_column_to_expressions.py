"""add country column to expressions

Revision ID: f938413c4afe
Revises: b1c2d3e4f5a6
Create Date: 2026-06-09

Séparation language / country / region dans la table expressions.
- `language` : code ISO de la langue (inchangé)
- `country`  : nouveau — code ISO du pays d'origine (ce que l'Atlas affiche)
- `region`   : conservé uniquement pour les vraies sous-régions (alsace, bretagne)
"""
from alembic import op
import sqlalchemy as sa


revision = "f938413c4afe"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Ajouter la colonne country (nullable pour l'instant)
    op.add_column("expressions", sa.Column("country", sa.String(20), nullable=True))

    conn = op.get_bind()

    # 2. Cas 1 : region est un code pays connu → country = region
    conn.execute(sa.text("""
        UPDATE expressions
        SET country = region
        WHERE region IN ('fr','it','de','tr','jp','es','ar','mx','co','pe','cu','ve','cl','uk','us','au')
    """))

    # 3. Cas 2 : region est une sous-région → country = language (pays parent)
    conn.execute(sa.text("""
        UPDATE expressions
        SET country = language
        WHERE region IN ('alsace', 'bretagne')
    """))

    # 4. Cas 3 : region IS NULL → country = language (langue = pays par défaut)
    conn.execute(sa.text("""
        UPDATE expressions
        SET country = language
        WHERE region IS NULL
    """))

    # 4b. Fallback : tout code region non répertorié (ex: 'en') → country = language
    conn.execute(sa.text("""
        UPDATE expressions
        SET country = language
        WHERE country IS NULL
    """))

    # 5. Nettoyer region : vider les codes pays (garder seulement les vraies sous-régions)
    conn.execute(sa.text("""
        UPDATE expressions
        SET region = NULL
        WHERE region IN ('fr','it','de','tr','jp','es','ar','mx','co','pe','cu','ve','cl','uk','us','au','en')
    """))

    # 6. NOT NULL sur country
    op.alter_column("expressions", "country", nullable=False)

    # 7. Index B-tree sur country (critique pour les requêtes pages pays)
    op.create_index("ix_expressions_country", "expressions", ["country"])


def downgrade() -> None:
    op.drop_index("ix_expressions_country", table_name="expressions")
    op.drop_column("expressions", "country")

"""Add countries, country_languages, regions tables; fix country='en'->uk

Revision ID: e1f2a3b4c5d6
Revises: b1c2d3e4f5a6
Create Date: 2026-06-10

Séparation propre langues / pays / régions :
- countries     : référentiel des pays réels (code PK, name_en)
- country_languages : jonction pays↔langues (max ~3 par pays — Canada, Suisse)
- regions       : sous-pays rattachés à un pays (alsace, bretagne)
- Fix data      : country='en' (hack) → 'uk' pour les 1259 expressions génériques anglaises
- FK            : expressions.country → countries.code (nullable)
                  expressions.region  → regions.code  (nullable)
"""
from alembic import op
import sqlalchemy as sa

revision = "e1f2a3b4c5d6"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Table countries ────────────────────────────────────────────────
    op.create_table(
        "countries",
        sa.Column("code", sa.String(10), primary_key=True),
        sa.Column("name_en", sa.String(100), nullable=False),
    )

    op.execute("""
        INSERT INTO countries (code, name_en) VALUES
        ('ar', 'Argentina'),
        ('au', 'Australia'),
        ('co', 'Colombia'),
        ('cu', 'Cuba'),
        ('de', 'Germany'),
        ('es', 'Spain'),
        ('fr', 'France'),
        ('it', 'Italy'),
        ('jp', 'Japan'),
        ('mx', 'Mexico'),
        ('pe', 'Peru'),
        ('tr', 'Turkey'),
        ('uk', 'United Kingdom'),
        ('us', 'United States')
    """)

    # ── 2. Table country_languages ────────────────────────────────────────
    op.create_table(
        "country_languages",
        sa.Column("country_code", sa.String(10),
                  sa.ForeignKey("countries.code", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("language_code", sa.String(10), nullable=False),
        sa.PrimaryKeyConstraint("country_code", "language_code"),
    )

    op.execute("""
        INSERT INTO country_languages (country_code, language_code) VALUES
        ('fr', 'fr'),
        ('uk', 'en'),
        ('us', 'en'),
        ('au', 'en'),
        ('de', 'de'),
        ('it', 'it'),
        ('tr', 'tr'),
        ('jp', 'ja'),
        ('es', 'es'),
        ('mx', 'es'),
        ('ar', 'es'),
        ('co', 'es'),
        ('pe', 'es'),
        ('cu', 'es')
    """)

    # ── 3. Table regions ──────────────────────────────────────────────────
    op.create_table(
        "regions",
        sa.Column("code", sa.String(50), primary_key=True),
        sa.Column("country_code", sa.String(10),
                  sa.ForeignKey("countries.code", ondelete="SET NULL"),
                  nullable=True),
        sa.Column("name_en", sa.String(100), nullable=False),
    )

    op.execute("""
        INSERT INTO regions (code, country_code, name_en) VALUES
        ('alsace',   'fr', 'Alsace'),
        ('bretagne', 'fr', 'Brittany')
    """)

    # ── 4. Fix data : country='en' (hack) → 'uk' ─────────────────────────
    op.execute("UPDATE expressions SET country = 'uk' WHERE country = 'en'")

    # ── 5. FK expressions.country → countries.code ───────────────────────
    op.create_foreign_key(
        "fk_expressions_country",
        "expressions", "countries",
        ["country"], ["code"],
        ondelete="SET NULL",
    )

    # ── 6. FK expressions.region → regions.code ──────────────────────────
    op.create_foreign_key(
        "fk_expressions_region",
        "expressions", "regions",
        ["region"], ["code"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_expressions_region", "expressions", type_="foreignkey")
    op.drop_constraint("fk_expressions_country", "expressions", type_="foreignkey")
    op.execute("UPDATE expressions SET country = 'en' WHERE country = 'uk' AND language = 'en' AND region IS NULL")
    op.drop_table("regions")
    op.drop_table("country_languages")
    op.drop_table("countries")

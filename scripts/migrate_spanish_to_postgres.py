"""
Migration des 120 expressions espagnoles depuis SQLite → PostgreSQL.
Ces expressions ont été ajoutées directement dans SQLite après la migration JSON→SQLite,
elles ne sont pas dans expressions.json.
Script idempotent : ignore les doublons.
"""

import json
import os
import sqlite3
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).parent.parent

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERREUR : variable DATABASE_URL manquante.")
    sys.exit(1)

# Lire les expressions espagnoles depuis SQLite
sqlite_conn = sqlite3.connect(ROOT / "data" / "expressions.db")
sqlite_conn.row_factory = sqlite3.Row
es_rows = sqlite_conn.execute(
    "SELECT * FROM expressions WHERE language = 'es'"
).fetchall()
sqlite_conn.close()

print(f"Expressions espagnoles trouvées dans SQLite : {len(es_rows)}")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

inserted = 0
skipped = 0

for row in es_rows:
    expr_id = row["id"]

    existing = session.execute(
        text("SELECT id FROM expressions WHERE id = :id"), {"id": expr_id}
    ).fetchone()

    if existing:
        skipped += 1
        continue

    # Insérer dans expressions
    session.execute(
        text("""
            INSERT INTO expressions (id, text, language, region, register, illustration, concept_id)
            VALUES (:id, :text, :language, :region, :register, :illustration, NULL)
        """),
        {
            "id": expr_id,
            "text": row["expression"],
            "language": row["language"],
            "region": row["region"],
            "register": row["register"],
            "illustration": row["illustration"],
        }
    )

    # Insérer dans expression_content
    session.execute(
        text("""
            INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
            VALUES (:expression_id, :locale, :meaning, :origin, :example)
            ON CONFLICT (expression_id, locale) DO NOTHING
        """),
        {
            "expression_id": expr_id,
            "locale": row["language"],
            "meaning": row["meaning"] or "",
            "origin": row["origin"] or "",
            "example": row["example"] or "",
        }
    )

    # Insérer les tags
    tags = json.loads(row["tags"]) if row["tags"] else []
    for tag_text in tags:
        tag_slug = tag_text.lower().strip().replace(" ", "-")

        session.execute(
            text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT DO NOTHING"),
            {"id": tag_slug, "slug": tag_slug}
        )
        session.execute(
            text("""
                INSERT INTO tag_names (tag_id, locale, name)
                VALUES (:tag_id, :locale, :name)
                ON CONFLICT (tag_id, locale) DO NOTHING
            """),
            {"tag_id": tag_slug, "locale": row["language"], "name": tag_text}
        )
        session.execute(
            text("""
                INSERT INTO expression_tags (expression_id, tag_id)
                VALUES (:expression_id, :tag_id)
                ON CONFLICT DO NOTHING
            """),
            {"expression_id": expr_id, "tag_id": tag_slug}
        )

    inserted += 1

session.commit()
session.close()

print(f"\n=== Migration espagnol terminée ===")
print(f"  Insérées : {inserted}")
print(f"  Ignorées : {skipped} (déjà présentes)")

with engine.connect() as conn:
    total = conn.execute(text("SELECT COUNT(*) FROM expressions")).scalar()
    by_lang = conn.execute(text(
        "SELECT language, COUNT(*) as n FROM expressions GROUP BY language ORDER BY n DESC"
    )).fetchall()

print(f"\n=== État de la base ===")
print(f"  Total : {total}")
for r in by_lang:
    print(f"  {r.language}: {r.n}")

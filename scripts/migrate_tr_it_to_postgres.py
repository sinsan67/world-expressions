"""
Migration des expressions turques et italiennes depuis SQLite → PostgreSQL.
Script idempotent : ignore les doublons.

Prérequis : variable DATABASE_URL définie (ex: depuis .env).
Usage : python3 scripts/migrate_tr_it_to_postgres.py
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
    print("Conseil : créer un fichier .env avec DATABASE_URL=postgresql://...")
    sys.exit(1)

# Lire les expressions TR et IT depuis SQLite
sqlite_conn = sqlite3.connect(ROOT / "data" / "expressions.db")
sqlite_conn.row_factory = sqlite3.Row

rows = sqlite_conn.execute(
    "SELECT * FROM expressions WHERE region IN ('tr', 'it')"
).fetchall()
sqlite_conn.close()

# Associer region → language ISO 639-1
REGION_TO_LANGUAGE = {"tr": "tr", "it": "it"}

print(f"Expressions trouvées dans SQLite : {len(rows)}")
by_region = {}
for r in rows:
    by_region.setdefault(r["region"], 0)
    by_region[r["region"]] += 1
for region, count in sorted(by_region.items()):
    print(f"  {region}: {count}")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

inserted = 0
skipped = 0

for row in rows:
    expr_id = row["id"]
    region = row["region"]
    language = REGION_TO_LANGUAGE.get(region, region)

    existing = session.execute(
        text("SELECT id FROM expressions WHERE id = :id"), {"id": expr_id}
    ).fetchone()

    if existing:
        skipped += 1
        continue

    # Insérer dans expressions (avec source)
    session.execute(
        text("""
            INSERT INTO expressions (id, text, language, region, register, illustration, source, concept_id)
            VALUES (:id, :text, :language, :region, :register, :illustration, :source, NULL)
        """),
        {
            "id":           expr_id,
            "text":         row["expression"],
            "language":     language,
            "region":       region,
            "register":     row["register"] or "standard",
            "illustration": row["illustration"],
            "source":       row["source"] or None,
        }
    )

    # Insérer dans expression_content (dans la langue d'origine)
    session.execute(
        text("""
            INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
            VALUES (:expression_id, :locale, :meaning, :origin, :example)
            ON CONFLICT (expression_id, locale) DO NOTHING
        """),
        {
            "expression_id": expr_id,
            "locale":        language,
            "meaning":       row["meaning"] or "",
            "origin":        row["origin"] or "",
            "example":       row["example"] or "",
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
            {"tag_id": tag_slug, "locale": language, "name": tag_text}
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

print(f"\n=== Migration TR + IT terminée ===")
print(f"  Insérées : {inserted}")
print(f"  Ignorées : {skipped} (déjà présentes)")

with engine.connect() as conn:
    total = conn.execute(text("SELECT COUNT(*) FROM expressions")).scalar()
    by_lang = conn.execute(text(
        "SELECT language, COUNT(*) as n FROM expressions GROUP BY language ORDER BY n DESC"
    )).fetchall()

print(f"\n=== État de la base PostgreSQL ===")
print(f"  Total : {total}")
for r in by_lang:
    print(f"  {r.language}: {r.n}")

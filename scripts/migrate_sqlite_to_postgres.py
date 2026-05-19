"""
Migration complète SQLite → PostgreSQL (toutes les langues, toutes les régions).

Lit data/expressions.db et insère tout dans les 5 tables PostgreSQL.
Idempotent : ignore les doublons (ON CONFLICT DO NOTHING).
À lancer une seule fois depuis la racine du projet.
"""

import json
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os

ROOT = Path(__file__).parent.parent

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/expressions_dev")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Lire toutes les expressions depuis SQLite
sqlite_conn = sqlite3.connect(ROOT / "data" / "expressions.db")
sqlite_conn.row_factory = sqlite3.Row
rows = sqlite_conn.execute("SELECT * FROM expressions").fetchall()
sqlite_conn.close()

print(f"{len(rows)} expressions dans SQLite.")

inserted = skipped = tags_inserted = 0
tags_seen: set[str] = set()

for row in rows:
    expr_id = row["id"]

    if session.execute(text("SELECT id FROM expressions WHERE id = :id"), {"id": expr_id}).fetchone():
        skipped += 1
        continue

    session.execute(
        text("""
            INSERT INTO expressions (id, text, language, region, register, illustration, concept_id)
            VALUES (:id, :text, :language, :region, :register, :illustration, NULL)
        """),
        {
            "id":           expr_id,
            "text":         row["expression"],
            "language":     row["language"] or "fr",
            "region":       row["region"] or "fr",
            "register":     row["register"] or "standard",
            "illustration": row["illustration"],
        }
    )

    session.execute(
        text("""
            INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
            VALUES (:expression_id, :locale, :meaning, :origin, :example)
            ON CONFLICT (expression_id, locale) DO NOTHING
        """),
        {
            "expression_id": expr_id,
            "locale":        row["language"] or "fr",
            "meaning":       row["meaning"] or "",
            "origin":        row["origin"] or "",
            "example":       row["example"] or "",
        }
    )

    tags = json.loads(row["tags"]) if row["tags"] else []
    for tag_text in tags:
        slug = tag_text.lower().strip().replace(" ", "-")

        if slug not in tags_seen:
            session.execute(
                text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT DO NOTHING"),
                {"id": slug, "slug": slug}
            )
            session.execute(
                text("""
                    INSERT INTO tag_names (tag_id, locale, name)
                    VALUES (:tag_id, :locale, :name)
                    ON CONFLICT (tag_id, locale) DO NOTHING
                """),
                {"tag_id": slug, "locale": row["language"] or "fr", "name": tag_text}
            )
            tags_seen.add(slug)
            tags_inserted += 1

        session.execute(
            text("""
                INSERT INTO expression_tags (expression_id, tag_id)
                VALUES (:expression_id, :tag_id)
                ON CONFLICT DO NOTHING
            """),
            {"expression_id": expr_id, "tag_id": slug}
        )

    inserted += 1

session.commit()
session.close()

print(f"\n=== Migration terminée ===")
print(f"  Insérées : {inserted}")
print(f"  Ignorées : {skipped} (déjà présentes)")
print(f"  Tags     : {tags_inserted}")

with engine.connect() as conn:
    total = conn.execute(text("SELECT COUNT(*) FROM expressions")).scalar()
    by_lang = conn.execute(text(
        "SELECT language, COUNT(*) as n FROM expressions GROUP BY language ORDER BY n DESC"
    )).fetchall()

print(f"\n=== Vérification ===")
print(f"  Total : {total}")
for r in by_lang:
    print(f"  {r.language}: {r.n}")

#!/usr/bin/env python3
"""
Copie un échantillon de traductions IT+TR depuis la DB prod vers staging.
Objectif : permettre de tester le sélecteur de langue en staging sans
re-générer les traductions via Mistral.

Sélection : les N premières expressions communes aux deux bases,
qui ont une traduction IT et TR en prod.
"""

import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine, text

ROOT = Path(__file__).parent.parent

load_dotenv(ROOT / ".env")
PROD_URL = os.getenv("DATABASE_URL")

load_dotenv(ROOT / ".env.staging", override=True)
STAGING_URL = os.getenv("DATABASE_URL")

SAMPLE_SIZE = 100
LANGS = ["it", "tr"]

def main():
    prod_engine = create_engine(PROD_URL)
    staging_engine = create_engine(STAGING_URL)

    with prod_engine.connect() as prod, staging_engine.connect() as staging:
        # Expression IDs présents en staging
        staging_ids = {
            row[0] for row in staging.execute(text("SELECT id FROM expressions"))
        }
        print(f"Expressions en staging : {len(staging_ids)}")

        for lang in LANGS:
            # Traductions prod pour les expressions qui existent aussi en staging
            rows = prod.execute(text("""
                SELECT ct.expression_id, ct.target_lang,
                       ct.meaning, ct.literal, ct.idiomatic,
                       ct.origin, ct.example
                FROM content_translations ct
                WHERE ct.target_lang = :lang
                ORDER BY ct.expression_id
                LIMIT :limit
            """), {"lang": lang, "limit": SAMPLE_SIZE * 3}).fetchall()

            # Filtrer : garder seulement ceux présents en staging
            eligible = [r for r in rows if r[0] in staging_ids][:SAMPLE_SIZE]

            if not eligible:
                print(f"FR→{lang} : aucune expression commune trouvée")
                continue

            inserted = 0
            skipped = 0
            for row in eligible:
                expr_id, tl, meaning, literal, idiomatic, origin, example = row
                # Idempotent : skip si déjà présent
                exists = staging.execute(text("""
                    SELECT 1 FROM content_translations
                    WHERE expression_id = :eid AND target_lang = :lang
                """), {"eid": expr_id, "lang": tl}).fetchone()
                if exists:
                    skipped += 1
                    continue
                staging.execute(text("""
                    INSERT INTO content_translations
                      (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
                    VALUES (:eid, :lang, :meaning, :literal, :idiomatic, :origin, :example)
                """), {
                    "eid": expr_id, "lang": tl,
                    "meaning": meaning, "literal": literal,
                    "idiomatic": idiomatic, "origin": origin, "example": example,
                })
                inserted += 1

            staging.commit()
            print(f"FR→{lang} : {inserted} insérées, {skipped} déjà présentes")

    print("Terminé.")

if __name__ == "__main__":
    main()

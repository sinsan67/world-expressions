#!/usr/bin/env python3
"""
Copie un échantillon de traductions IT+TR depuis la DB prod vers dev local.
Objectif : permettre de tester le sélecteur de langue en local sans
re-générer les traductions via Mistral.

Sélection : les N premières expressions communes aux deux bases,
qui ont une traduction IT et TR en prod.
"""

import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine, text

ROOT = Path(__file__).parent.parent

load_dotenv(ROOT / ".env.dev")
DEV_URL = os.getenv("DATABASE_URL")

load_dotenv(ROOT / ".env.prod", override=True)
PROD_URL = os.getenv("DATABASE_URL")

SAMPLE_SIZE = 100
LANGS = ["it", "tr"]

def main():
    prod_engine = create_engine(PROD_URL)
    dev_engine = create_engine(DEV_URL)

    with prod_engine.connect() as prod, dev_engine.connect() as dev:
        # Expression IDs présents en dev local
        staging_ids = {
            row[0] for row in dev.execute(text("SELECT id FROM expressions"))
        }
        print(f"Expressions en dev local : {len(staging_ids)}")

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
                exists = dev.execute(text("""
                    SELECT 1 FROM content_translations
                    WHERE expression_id = :eid AND target_lang = :lang
                """), {"eid": expr_id, "lang": tl}).fetchone()
                if exists:
                    skipped += 1
                    continue
                dev.execute(text("""
                    INSERT INTO content_translations
                      (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
                    VALUES (:eid, :lang, :meaning, :literal, :idiomatic, :origin, :example)
                """), {
                    "eid": expr_id, "lang": tl,
                    "meaning": meaning, "literal": literal,
                    "idiomatic": idiomatic, "origin": origin, "example": example,
                })
                inserted += 1

            dev.commit()
            print(f"FR→{lang} : {inserted} insérées, {skipped} déjà présentes")

    print("Terminé.")

if __name__ == "__main__":
    main()

"""
Insert linguistic type tags into the database (tags + tag_names tables).

These tags classify expressions by their linguistic form — distinct from
thematic tags (argent, animaux, etc.). They work exactly like other tags:
clickable on cards, navigable, cross-language via TAG_ICONS.

Tags added:
  proverb   → Proverbe / Proverb / Proverbio / Proverbio / Atasözü
  adage     → Adage / Adage / Adagio / Adagio / Özdeyiş
  saying    → Dicton / Saying / Dicho / Detto / Söz
  maxim     → Maxime / Maxim / Máxima / Massima / Özdeyiş
  locution  → Locution / Set phrase / Locución / Locuzione / Deyim
  cliche    → Cliché / Cliché / Cliché / Cliché / Klişe

Usage:
    python3 scripts/add_type_tags.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


def get_engine():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("ERROR: DATABASE_URL not set.")
    return create_engine(url)

TYPE_TAGS: list[dict] = [
    {
        "slug": "proverb",
        "names": {
            "fr": "Proverbe",
            "en": "Proverb",
            "es": "Proverbio",
            "it": "Proverbio",
            "tr": "Atasözü",
        },
    },
    {
        "slug": "adage",
        "names": {
            "fr": "Adage",
            "en": "Adage",
            "es": "Adagio",
            "it": "Adagio",
            "tr": "Özdeyiş",
        },
    },
    {
        "slug": "saying",
        "names": {
            "fr": "Dicton",
            "en": "Saying",
            "es": "Dicho",
            "it": "Detto",
            "tr": "Söz",
        },
    },
    {
        "slug": "maxim",
        "names": {
            "fr": "Maxime",
            "en": "Maxim",
            "es": "Máxima",
            "it": "Massima",
            "tr": "Özdeyiş",
        },
    },
    {
        "slug": "locution",
        "names": {
            "fr": "Locution",
            "en": "Set phrase",
            "es": "Locución",
            "it": "Locuzione",
            "tr": "Deyim",
        },
    },
    {
        "slug": "cliche",
        "names": {
            "fr": "Cliché",
            "en": "Cliché",
            "es": "Cliché",
            "it": "Cliché",
            "tr": "Klişe",
        },
    },
]


def main() -> None:
    engine = get_engine()
    inserted_tags = 0
    inserted_names = 0

    with engine.begin() as conn:
        for tag in TYPE_TAGS:
            slug = tag["slug"]

            # Insert tag (idempotent — skip if already exists)
            result = conn.execute(
                text("""
                    INSERT INTO tags (id, slug)
                    VALUES (:id, :slug)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": slug, "slug": slug},
            )
            inserted_tags += result.rowcount

            # Insert tag_names for each locale
            for locale, name in tag["names"].items():
                result = conn.execute(
                    text("""
                        INSERT INTO tag_names (tag_id, locale, name)
                        VALUES (:tag_id, :locale, :name)
                        ON CONFLICT (tag_id, locale) DO UPDATE SET name = EXCLUDED.name
                    """),
                    {"tag_id": slug, "locale": locale, "name": name},
                )
                inserted_names += result.rowcount

    print(f"Done. Tags inserted: {inserted_tags} / Names upserted: {inserted_names}")
    for tag in TYPE_TAGS:
        print(f"  {tag['slug']:12} → {' / '.join(tag['names'].values())}")


if __name__ == "__main__":
    main()

"""
Traduit les tags sans traduction via Claude Haiku.
Même logique que populate_tag_names_mistral.py mais utilise l'API Anthropic.

Idempotent : INSERT ... ON CONFLICT DO UPDATE.

Usage :
  python3 scripts/populate_tag_names_claude.py              # local (.env.dev)
  python3 scripts/populate_tag_names_claude.py --prod       # Neon prod
  python3 scripts/populate_tag_names_claude.py --dry-run    # aperçu sans écrire
  python3 scripts/populate_tag_names_claude.py --limit 50   # tester sur 50 tags
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / _env_file)

import anthropic
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/expressions_dev")
engine = create_engine(DATABASE_URL)

MODEL = "claude-haiku-4-5-20251001"
BATCH_SIZE = 50

SYSTEM_PROMPT = """You are a multilingual dictionary specialist.
For each English tag slug provided, give the natural translation in French, Spanish, Italian, Turkish, German, and Japanese.
Slugs may use hyphens (e.g. "village-life" → "vie de village", "humor-black" → "humour noir").
Translate the concept, not word-for-word — the result should sound natural in each language.

Return ONLY a valid JSON object where each key is the original English slug, and each value is an object with keys "fr", "es", "it", "tr", "de", "ja".

Example input: ["family", "village-life", "humor-black"]
Example output:
{
  "family": {"fr": "famille", "es": "familia", "it": "famiglia", "tr": "aile", "de": "Familie", "ja": "家族"},
  "village-life": {"fr": "vie de village", "es": "vida de pueblo", "it": "vita di paese", "tr": "köy hayatı", "de": "Dorfleben", "ja": "村の生活"},
  "humor-black": {"fr": "humour noir", "es": "humor negro", "it": "umorismo nero", "tr": "kara mizah", "de": "schwarzer Humor", "ja": "ブラックユーモア"}
}

No markdown, no extra text — only the JSON object."""


def fetch_tags_missing_any(conn, limit: int | None) -> list[str]:
    q = """
        WITH candidates AS (
            SELECT t.id, COUNT(et.expression_id) AS expr_count
            FROM tags t
            LEFT JOIN expression_tags et ON et.tag_id = t.id
            WHERE NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'fr')
               OR NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'es')
               OR NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'it')
               OR NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'tr')
               OR NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'de')
               OR NOT EXISTS (SELECT 1 FROM tag_names tn WHERE tn.tag_id = t.id AND tn.locale = 'ja')
            GROUP BY t.id
        )
        SELECT id FROM candidates ORDER BY expr_count DESC
    """
    if limit:
        q += f" LIMIT {limit}"
    rows = conn.execute(text(q)).fetchall()
    return [r[0] for r in rows]


def translate_batch(client: anthropic.Anthropic, slugs: list[str]) -> dict:
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        temperature=0.1,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": json.dumps(slugs)}],
    )
    raw = response.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def populate(dry_run: bool, limit: int | None):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Erreur : ANTHROPIC_API_KEY absent du .env")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    with engine.begin() as conn:
        slugs = fetch_tags_missing_any(conn, limit)
        print(f"Tags avec traduction(s) manquante(s) : {len(slugs)}")

        inserted = 0
        errors = 0

        for i in range(0, len(slugs), BATCH_SIZE):
            batch = slugs[i : i + BATCH_SIZE]
            print(f"  Lot {i // BATCH_SIZE + 1} — {len(batch)} tags ({batch[0]} … {batch[-1]})", end=" ", flush=True)

            try:
                translations = translate_batch(client, batch)
            except Exception as e:
                print(f"ERREUR API : {e}")
                errors += 1
                time.sleep(2)
                continue

            for slug, names in translations.items():
                if slug not in batch:
                    continue  # hallucination : slug inconnu
                for locale in ("fr", "es", "it", "tr", "de", "ja"):
                    name = names.get(locale)
                    if not name:
                        continue
                    if not dry_run:
                        try:
                            conn.execute(text("""
                                INSERT INTO tag_names (tag_id, locale, name)
                                VALUES (:tag_id, :locale, :name)
                                ON CONFLICT (tag_id, locale) DO UPDATE SET name = EXCLUDED.name
                            """), {"tag_id": slug, "locale": locale, "name": name})
                            inserted += 1
                        except Exception as e:
                            print(f"\n  DB erreur {slug}/{locale}: {e}")
                    else:
                        inserted += 1

            print(f"→ {len(translations)} traduits")
            time.sleep(0.3)

        print(f"\n{'[DRY-RUN] ' if dry_run else ''}Terminé : {inserted} lignes insérées/màj, {errors} lots en erreur.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Traduit les tags manquants via Claude Haiku")
    parser.add_argument("--prod",    action="store_true", help="Cible Neon prod")
    parser.add_argument("--dry-run", action="store_true", help="Aperçu sans écrire en DB")
    parser.add_argument("--limit",   type=int, default=None, help="Limiter à N tags (test)")
    args = parser.parse_args()

    env_label = "PROD" if args.prod else "local"
    print(f"{'[DRY-RUN] ' if args.dry_run else ''}Traduction tags Claude Haiku — {env_label}\n")
    populate(dry_run=args.dry_run, limit=args.limit)

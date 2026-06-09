"""
Traduit les tags sans traduction FR vers FR/ES/IT/TR via Mistral Small.
Traite les tags par lots de 50 (~ 22 appels API pour 1072 tags).

Idempotent : INSERT ... ON CONFLICT DO UPDATE.

Usage :
  python3 scripts/populate_tag_names_mistral.py              # local (.env.dev)
  python3 scripts/populate_tag_names_mistral.py --prod       # Neon ep-dawn-smoke
  python3 scripts/populate_tag_names_mistral.py --dry-run    # aperçu sans écrire
  python3 scripts/populate_tag_names_mistral.py --limit 100  # tester sur 100 tags
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Charger le bon .env avant d'importer config
_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / _env_file)

from sqlalchemy import create_engine, text
from mistralai.client import Mistral

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/expressions_dev")
engine = create_engine(DATABASE_URL)

MODEL = "mistral-small-latest"
BATCH_SIZE = 50  # tags par appel API

SYSTEM_PROMPT = """You are a multilingual dictionary specialist.
For each English tag slug provided, give the natural translation in French, Spanish, Italian, Turkish, German, and Japanese.
Slugs may use hyphens (e.g. "village-life" → "vie de village").

Return ONLY a valid JSON object where each key is the original English slug, and each value is an object with keys "fr", "es", "it", "tr", "de", "ja".

Example input: ["family", "village-life"]
Example output:
{
  "family": {"fr": "famille", "es": "familia", "it": "famiglia", "tr": "aile", "de": "Familie", "ja": "家族"},
  "village-life": {"fr": "vie de village", "es": "vida de pueblo", "it": "vita di paese", "tr": "köy hayatı", "de": "Dorfleben", "ja": "村の生活"}
}

No markdown, no extra text — only the JSON object."""


def fetch_tags_missing_any(conn, limit: int | None) -> list[str]:
    """Retourne les slugs de tags manquant au moins une traduction FR/ES/IT/TR, triés par popularité."""
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


def translate_batch(client: Mistral, slugs: list[str]) -> dict:
    """Envoie un lot de slugs à Mistral, retourne {slug: {fr, es, it, tr}}."""
    user_msg = json.dumps(slugs)
    response = client.chat.complete(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    raw = response.choices[0].message.content.strip()

    # Extraire le JSON même si Mistral ajoute des backticks
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def populate(dry_run: bool, limit: int | None):
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Erreur : MISTRAL_API_KEY absent du .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)

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

            # Insérer chaque traduction
            for slug, names in translations.items():
                if slug not in batch:
                    continue  # Mistral a hallucine un slug inconnu
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
            time.sleep(0.5)  # éviter rate-limit

        print(f"\n{'[DRY-RUN] ' if dry_run else ''}Terminé : {inserted} lignes insérées/màj, {errors} lots en erreur.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Traduit les tags manquants via Mistral")
    parser.add_argument("--prod",    action="store_true", help="Cible Neon ep-dawn-smoke")
    parser.add_argument("--dry-run", action="store_true", help="Aperçu sans écrire en DB")
    parser.add_argument("--limit",   type=int, default=None, help="Limiter à N tags (test)")
    args = parser.parse_args()

    env_label = "PROD (Neon ep-dawn-smoke)" if args.prod else "local (ep-frosty-dew)"
    print(f"{'[DRY-RUN] ' if args.dry_run else ''}Traduction tags Mistral — {env_label}\n")
    populate(dry_run=args.dry_run, limit=args.limit)

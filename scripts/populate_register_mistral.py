"""
Backfille expressions.register (standard/informal/slang/vulgar/formal) sur les idioms
qui n'en ont jamais eu (champ retrofit jamais rempli sur le contenu historique).

Classe chaque idiom à partir de son texte + son sens natif (expression_content, même
locale que la langue de l'expression) via Mistral Small.

Idempotent : WHERE register IS NULL fait sortir automatiquement les lignes déjà
traitées des runs suivants. Écriture ligne par ligne avec garde IS NULL — résistant
à une interruption en cours de run.

Usage :
  python3 scripts/populate_register_mistral.py --prod --dry-run --limit 20   # échantillon à relire
  python3 scripts/populate_register_mistral.py --prod                        # run complet
  python3 scripts/populate_register_mistral.py --prod --limit 100            # tester sur 100 lignes
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Charger le bon .env avant d'importer quoi que ce soit lié à la DB
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
BATCH_SIZE = 30

ALLOWED_REGISTERS = {"standard", "informal", "slang", "vulgar", "formal"}

SYSTEM_PROMPT = """You are a linguistic register classifier for idiomatic expressions.
For each expression given (its text and its meaning, in its original language), classify its
register into EXACTLY ONE of these five values:

- "standard": neutral, used in everyday speech and writing, no special marking
- "informal": casual conversational tone, but not slang
- "slang": very casual, colloquial, often generational or subcultural
- "vulgar": crude, rude, or offensive language
- "formal": elevated, literary, or used only in formal/written contexts

Return ONLY a valid JSON object where each key is the expression id provided, and each value is
one of: standard, informal, slang, vulgar, formal.

Example input: [{"id": "avoir-le-cafard", "language": "fr", "text": "Avoir le cafard", "meaning": "Être triste, déprimé, sans raison précise"}]
Example output:
{"avoir-le-cafard": "informal"}

No markdown, no extra text — only the JSON object."""


def fetch_candidates(conn, limit: int | None) -> list[dict]:
    """Idioms sans register, avec leur sens natif — ordre aléatoire pour un échantillon représentatif."""
    q = """
        SELECT e.id, e.language, e.text, ec.meaning
        FROM expressions e
        JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        WHERE e.register IS NULL AND e.kind = 'idiom'
        ORDER BY RANDOM()
    """
    if limit:
        q += f" LIMIT {limit}"
    rows = conn.execute(text(q)).fetchall()
    return [{"id": r[0], "language": r[1], "text": r[2], "meaning": r[3]} for r in rows]


def classify_batch(client: Mistral, items: list[dict], max_retries: int = 3) -> dict:
    """Envoie un lot d'expressions à Mistral, retourne {id: register}. Retry expo sur 429."""
    user_msg = json.dumps([
        {"id": it["id"], "language": it["language"], "text": it["text"], "meaning": it["meaning"]}
        for it in items
    ])

    for attempt in range(max_retries):
        try:
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
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception as e:
            msg = str(e)
            if "429" in msg and attempt < max_retries - 1:
                wait = 4 * (2 ** attempt)  # 4s, 8s, 16s
                print(f"  Rate limit — retry dans {wait}s ({attempt + 1}/{max_retries})")
                time.sleep(wait)
            else:
                raise
    return {}


def truncate(s: str | None, n: int = 60) -> str:
    if not s:
        return ""
    return s if len(s) <= n else s[: n - 1] + "…"


def populate(dry_run: bool, limit: int | None):
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Erreur : MISTRAL_API_KEY absent du .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)

    with engine.connect() as conn:
        items = fetch_candidates(conn, limit)
    print(f"{'[DRY-RUN] ' if dry_run else ''}Idioms sans register : {len(items)}\n")

    classified = 0
    invalid = 0
    errors = 0

    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i : i + BATCH_SIZE]
        print(f"Lot {i // BATCH_SIZE + 1} — {len(batch)} expressions", flush=True)

        try:
            results = classify_batch(client, batch)
        except Exception as e:
            print(f"  ERREUR API, lot ignoré : {e}")
            errors += 1
            time.sleep(2)
            continue

        by_id = {it["id"]: it for it in batch}
        for expr_id, register in results.items():
            item = by_id.get(expr_id)
            if item is None:
                continue  # Mistral a halluciné un id inconnu

            if register not in ALLOWED_REGISTERS:
                print(f"  [{expr_id}] valeur invalide ignorée : {register!r}")
                invalid += 1
                continue

            if dry_run:
                print(
                    f"  [{item['language']}] {truncate(item['text'], 40)!r} "
                    f"— {truncate(item['meaning'])!r} → {register}"
                )
            else:
                with engine.begin() as write_conn:
                    write_conn.execute(
                        text("""
                            UPDATE expressions SET register = :register
                            WHERE id = :id AND register IS NULL
                        """),
                        {"register": register, "id": expr_id},
                    )
                print(f"  [{item['language']}] {expr_id} → {register}")

            classified += 1

        time.sleep(1)  # éviter le rate-limit Mistral

    print(
        f"\n{'[DRY-RUN] ' if dry_run else ''}Terminé : {classified} classifiées, "
        f"{invalid} valeurs invalides, {errors} lots en erreur."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill du register via Mistral")
    parser.add_argument("--prod", action="store_true", help="Cible Neon ep-dawn-smoke")
    parser.add_argument("--dry-run", action="store_true", help="Aperçu sans écrire en DB")
    parser.add_argument("--limit", type=int, default=None, help="Limiter à N idioms (test/échantillon)")
    args = parser.parse_args()

    env_label = "PROD (Neon ep-dawn-smoke)" if args.prod else "local (ep-frosty-dew)"
    print(f"{'[DRY-RUN] ' if args.dry_run else ''}Backfill register Mistral — {env_label}\n")
    populate(dry_run=args.dry_run, limit=args.limit)

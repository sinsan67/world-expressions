#!/usr/bin/env python3
"""
Génère les traductions EN pour toutes les expressions FR et les insère dans content_translations.

Idempotent : les expressions déjà traduites sont ignorées. Relancez librement si une exécution
est interrompue.

Usage :
    python3 scripts/populate_translations_en.py             # traduit toutes les expressions FR
    python3 scripts/populate_translations_en.py --limit 5   # teste sur 5 expressions
    python3 scripts/populate_translations_en.py --dry-run   # affiche sans appeler l'API
"""

import sys
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv
from sqlalchemy import text

# Charge .env depuis la racine du projet, indépendamment du répertoire courant
load_dotenv(Path(__file__).parent.parent / ".env")

from mistralai.client import Mistral
from config import engine  # import après load_dotenv

MODEL = "mistral-small-latest"  # économique et rapide pour les traductions en masse

SYSTEM_PROMPT = """You are a specialist in French idiomatic expressions and cultural linguistics.
For each French expression provided, generate an English explanation for an English-speaking reader
who does not know French.

Return ONLY a valid JSON object with exactly these 5 fields:
- "meaning": clear explanation of what the expression means (1-2 sentences)
- "literal": word-for-word English translation of the French text (even if awkward)
- "idiomatic": closest natural English equivalent idiom or phrase (null if none exists)
- "origin": origin or etymology explained in English (null if unknown)
- "example": natural English sentence using the expression or its English equivalent

No markdown, no extra text — only the JSON object."""

USER_TEMPLATE = """French expression: "{text}"

Original French meaning: {meaning}
Original French origin: {origin}
Original French example: {example}"""


def get_fr_without_en(limit: int | None = None) -> list[dict]:
    """Retourne les expressions FR qui n'ont pas encore de traduction EN."""
    sql = """
        SELECT e.id, e.text, ec.meaning, ec.origin, ec.example
        FROM expressions e
        LEFT JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = 'fr'
        WHERE e.language = 'fr'
          AND e.id NOT IN (
              SELECT expression_id FROM content_translations WHERE target_lang = 'en'
          )
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql)).fetchall()
    return [
        {
            "id": r.id,
            "text": r.text,
            "meaning": r.meaning or "(sens non renseigné)",
            "origin": r.origin or "(origine inconnue)",
            "example": r.example or "(pas d'exemple)",
        }
        for r in rows
    ]


def call_mistral(client: Mistral, expr: dict) -> dict:
    """Appelle Mistral pour générer la traduction EN d'une expression."""
    user_msg = USER_TEMPLATE.format(
        text=expr["text"],
        meaning=expr["meaning"],
        origin=expr["origin"],
        example=expr["example"],
    )
    response = client.chat.complete(
        model=MODEL,
        max_tokens=600,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
    )
    raw = response.choices[0].message.content.strip()
    # Nettoie les éventuels blocs markdown ```json ... ```
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    return json.loads(raw)


def insert_translation(expression_id: str, t: dict) -> None:
    """Insère ou met à jour une traduction EN (upsert)."""
    sql = """
        INSERT INTO content_translations
            (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
        VALUES
            (:id, 'en', :meaning, :literal, :idiomatic, :origin, :example)
        ON CONFLICT (expression_id, target_lang) DO UPDATE SET
            meaning   = EXCLUDED.meaning,
            literal   = EXCLUDED.literal,
            idiomatic = EXCLUDED.idiomatic,
            origin    = EXCLUDED.origin,
            example   = EXCLUDED.example
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {
            "id":        expression_id,
            "meaning":   t.get("meaning"),
            "literal":   t.get("literal"),
            "idiomatic": t.get("idiomatic"),
            "origin":    t.get("origin"),
            "example":   t.get("example"),
        })


def main():
    parser = argparse.ArgumentParser(
        description="Génère les traductions EN pour les expressions FR"
    )
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre max d'expressions à traiter")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche les expressions sans appeler l'API ni écrire en base")
    parser.add_argument("--delay", type=float, default=0.3,
                        help="Délai entre appels API en secondes (défaut: 0.3)")
    args = parser.parse_args()

    expressions = get_fr_without_en(limit=args.limit)
    total = len(expressions)

    if total == 0:
        print("Toutes les expressions FR ont déjà une traduction EN.")
        return

    print(f"{total} expression(s) FR sans traduction EN.")

    if args.dry_run:
        print("Mode dry-run — aucun appel API.\n")
        for i, e in enumerate(expressions, 1):
            print(f"  [{i:3}/{total}] {e['id']}")
        return

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Erreur : MISTRAL_API_KEY absent du .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)
    ok = errors = 0

    for i, expr in enumerate(expressions, 1):
        print(f"[{i:3}/{total}] {expr['id']} ... ", end="", flush=True)
        try:
            translation = call_mistral(client, expr)
            insert_translation(expr["id"], translation)
            print("OK")
            ok += 1
        except json.JSONDecodeError as e:
            print(f"ERREUR JSON ({e})")
            errors += 1
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("RATE LIMIT — pause 60s")
                time.sleep(60)
                try:
                    translation = call_mistral(client, expr)
                    insert_translation(expr["id"], translation)
                    print(f"[{i:3}/{total}] {expr['id']} ... OK (retry)")
                    ok += 1
                except Exception as e2:
                    print(f"ERREUR retry ({e2})")
                    errors += 1
            else:
                print(f"ERREUR ({e})")
                errors += 1

        if i < total and args.delay > 0:
            time.sleep(args.delay)

    print(f"\nTerminé : {ok} traduit(e)s, {errors} erreur(s).")
    if errors:
        print("Relancez le script pour réessayer les expressions ratées (idempotent).")


if __name__ == "__main__":
    main()

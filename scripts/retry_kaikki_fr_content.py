#!/usr/bin/env python3
"""
Génère le contenu FR manquant pour les expressions kaikki.

Ces expressions ont language='fr' mais leur seul contenu disponible est
expression_content.locale='en' (fourni par kaikki/enwiktionary).
Mistral génère le contenu FR et l'insère dans content_translations.target_lang='fr'.

Idempotent : seules les expressions sans contenu FR sont traitées.

Usage:
    python3 scripts/retry_kaikki_fr_content.py --dry-run
    python3 scripts/retry_kaikki_fr_content.py --delay 2.0
    python3 scripts/retry_kaikki_fr_content.py --prod --delay 2.0
"""

import sys
import json
import time
import os
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

parser = argparse.ArgumentParser(description="Génère le contenu FR pour les expressions kaikki")
parser.add_argument("--prod", action="store_true", help="Utilise la base production (.env.prod)")
parser.add_argument("--dry-run", action="store_true", help="Affiche sans appeler l'API")
parser.add_argument("--limit", type=int, default=None, help="Nombre max d'expressions")
parser.add_argument("--delay", type=float, default=1.0, help="Délai entre appels API (défaut: 1.0s)")
args = parser.parse_args()

env_file = ".env.prod" if args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / env_file)
if args.prod:
    print(f"Using PRODUCTION database ({env_file})")

from sqlalchemy import text
from config import engine
from mistralai.client import Mistral

MODEL = "mistral-small-latest"

SYSTEM_PROMPT = """You are a specialist in French idiomatic expressions and cultural linguistics.
For each French expression provided, generate an explanation for a French-speaking reader.

Return ONLY a valid JSON object with exactly these 5 fields (all values must be in French):
- "meaning": clear explanation of what the expression means (1-2 sentences)
- "literal": mot-à-mot en français (même si maladroit)
- "idiomatic": expression ou locution française équivalente la plus proche (null si aucune)
- "origin": origine ou étymologie expliquée en français (null si inconnue)
- "example": phrase naturelle en français utilisant l'expression

No markdown, no extra text — only the JSON object."""

USER_TEMPLATE = """French expression: "{text}"

English meaning (from Wiktionary): {meaning_en}
Etymology: {origin}
Example sentence (FR): {example_fr}"""


def get_fr_without_fr_content(limit):
    sql = """
        SELECT e.id, e.text,
               ec_en.meaning AS meaning_en,
               ec_en.origin  AS origin,
               ec_en.example AS example_fr
        FROM expressions e
        JOIN expression_content ec_en
            ON ec_en.expression_id = e.id AND ec_en.locale = 'en'
        LEFT JOIN expression_content ec_fr
            ON ec_fr.expression_id = e.id AND ec_fr.locale = 'fr'
        LEFT JOIN content_translations ct_fr
            ON ct_fr.expression_id = e.id AND ct_fr.target_lang = 'fr'
        WHERE e.language = 'fr'
          AND ec_fr.expression_id IS NULL
          AND ct_fr.expression_id IS NULL
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
            "meaning_en": r.meaning_en or "(no meaning available)",
            "origin": r.origin or "(unknown)",
            "example_fr": r.example_fr or "(no example)",
        }
        for r in rows
    ]


def call_mistral(client, expr):
    user_msg = USER_TEMPLATE.format(
        text=expr["text"],
        meaning_en=expr["meaning_en"],
        origin=expr["origin"],
        example_fr=expr["example_fr"],
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
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    return json.loads(raw)


def insert_fr_translation(expression_id, t):
    sql = """
        INSERT INTO content_translations
            (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
        VALUES
            (:id, 'fr', :meaning, :literal, :idiomatic, :origin, :example)
        ON CONFLICT (expression_id, target_lang) DO UPDATE SET
            meaning   = EXCLUDED.meaning,
            literal   = EXCLUDED.literal,
            idiomatic = EXCLUDED.idiomatic,
            origin    = EXCLUDED.origin,
            example   = EXCLUDED.example
    """
    with engine.connect() as conn:
        conn.execute(text(sql), {
            "id": expression_id,
            "meaning": t.get("meaning"),
            "literal": t.get("literal"),
            "idiomatic": t.get("idiomatic"),
            "origin": t.get("origin"),
            "example": t.get("example"),
        })
        conn.commit()


def main():
    expressions = get_fr_without_fr_content(args.limit)
    total = len(expressions)

    if total == 0:
        print("Toutes les expressions kaikki ont déjà un contenu FR.")
        return

    print(f"{total} expression(s) FR sans contenu FR à générer.")

    if args.dry_run:
        print("Mode dry-run — aucun appel API.\n")
        for i, e in enumerate(expressions, 1):
            print(f"  [{i:3}/{total}] {e['id']}")
            print(f"         EN: {e['meaning_en'][:80]}")
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
            insert_fr_translation(expr["id"], translation)
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
                    insert_fr_translation(expr["id"], translation)
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

    print(f"\nTerminé : {ok} généré(s), {errors} erreur(s).")
    if errors:
        print("Relancez le script pour réessayer les ratés (idempotent).")


if __name__ == "__main__":
    main()

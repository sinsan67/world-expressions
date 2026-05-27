#!/usr/bin/env python3
"""
Génère les traductions pour toutes les expressions d'une langue source
vers une langue cible, et les insère dans content_translations.

Idempotent : les expressions déjà traduites sont ignorées.
Relancez librement si une exécution est interrompue.

Usage :
    python3 scripts/populate_translations.py --source fr --target es
    python3 scripts/populate_translations.py --source en --target fr
    python3 scripts/populate_translations.py --source en --target fr --limit 5
    python3 scripts/populate_translations.py --source en --target fr --dry-run

Langues supportées : fr, en, es, it, tr
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

import argparse as _argparse_early
_early = _argparse_early.ArgumentParser(add_help=False)
_early.add_argument("--staging", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.staging" if _early_args.staging else ".env"
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"

# Noms des langues pour construire les prompts
LANG_NAMES = {
    "fr": {"en": "French", "fr": "français", "es": "francés", "it": "francese", "tr": "Fransızca"},
    "en": {"en": "English", "fr": "anglais", "es": "inglés", "it": "inglese", "tr": "İngilizce"},
    "es": {"en": "Spanish", "fr": "espagnol", "es": "español", "it": "spagnolo", "tr": "İspanyolca"},
    "it": {"en": "Italian", "fr": "italien", "es": "italiano", "it": "italiano", "tr": "İtalyanca"},
    "tr": {"en": "Turkish", "fr": "turc", "es": "turco", "it": "turco", "tr": "Türkçe"},
}

# Langue dans laquelle répondre (nom complet pour Mistral)
TARGET_LANG_FULL = {
    "fr": "French",
    "en": "English",
    "es": "Spanish",
    "it": "Italian",
    "tr": "Turkish",
}


def build_system_prompt(source_lang: str, target_lang: str) -> str:
    source_name = LANG_NAMES[source_lang]["en"]
    target_name = TARGET_LANG_FULL[target_lang]
    return f"""You are a specialist in {source_name} idiomatic expressions and cultural linguistics.
For each {source_name} expression provided, generate an explanation for a {target_name}-speaking reader.

Return ONLY a valid JSON object with exactly these 5 fields (all values must be in {target_name}):
- "meaning": clear explanation of what the expression means (1-2 sentences)
- "literal": word-for-word {target_name} translation of the original text (even if awkward)
- "idiomatic": closest natural {target_name} equivalent idiom or phrase (null if none exists)
- "origin": origin or etymology explained in {target_name} (null if unknown)
- "example": natural {target_name} sentence using the expression or its {target_name} equivalent

No markdown, no extra text — only the JSON object."""


def build_user_message(expr: dict, source_lang: str) -> str:
    source_name = LANG_NAMES[source_lang]["en"]
    return f"""{source_name} expression: "{expr['text']}"

Original {source_name} meaning: {expr['meaning']}
Original {source_name} origin: {expr['origin']}
Original {source_name} example: {expr['example']}"""


def get_untranslated(source_lang: str, target_lang: str, limit: int | None = None) -> list[dict]:
    """Retourne les expressions de source_lang sans traduction vers target_lang."""
    sql = """
        SELECT e.id, e.text, ec.meaning, ec.origin, ec.example
        FROM expressions e
        LEFT JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = :source_lang
        WHERE e.language = :source_lang
          AND e.id NOT IN (
              SELECT expression_id FROM content_translations WHERE target_lang = :target_lang
          )
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"source_lang": source_lang, "target_lang": target_lang}).fetchall()
    return [
        {
            "id": r.id,
            "text": r.text,
            "meaning": r.meaning or "(meaning not available)",
            "origin": r.origin or "(origin unknown)",
            "example": r.example or "(no example)",
        }
        for r in rows
    ]


def call_mistral(client: Mistral, expr: dict, source_lang: str, target_lang: str) -> dict:
    system_prompt = build_system_prompt(source_lang, target_lang)
    user_msg = build_user_message(expr, source_lang)
    response = client.chat.complete(
        model=MODEL,
        max_tokens=600,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    return json.loads(raw)


def insert_translation(expression_id: str, target_lang: str, t: dict) -> None:
    sql = """
        INSERT INTO content_translations
            (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
        VALUES
            (:id, :target_lang, :meaning, :literal, :idiomatic, :origin, :example)
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
            "target_lang": target_lang,
            "meaning":   t.get("meaning"),
            "literal":   t.get("literal"),
            "idiomatic": t.get("idiomatic"),
            "origin":    t.get("origin"),
            "example":   t.get("example"),
        })


def main():
    supported = list(LANG_NAMES.keys())

    parser = argparse.ArgumentParser(
        description="Génère les traductions pour une paire de langues source→target"
    )
    parser.add_argument("--source", required=True, choices=supported,
                        help=f"Langue source : {supported}")
    parser.add_argument("--target", required=True, choices=supported,
                        help=f"Langue cible : {supported}")
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre max d'expressions à traiter (test)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche les expressions sans appeler l'API ni écrire en base")
    parser.add_argument("--delay", type=float, default=0.3,
                        help="Délai entre appels API en secondes (défaut: 0.3)")
    parser.add_argument("--staging", action="store_true",
                        help="Utilise la base staging (.env.staging)")
    args = parser.parse_args()

    if args.source == args.target:
        print("Erreur : source et target doivent être différents.")
        sys.exit(1)

    source_name = LANG_NAMES[args.source]["en"]
    target_name = TARGET_LANG_FULL[args.target]
    print(f"Traduction {args.source.upper()} → {args.target.upper()} ({source_name} → {target_name})")

    expressions = get_untranslated(args.source, args.target, limit=args.limit)
    total = len(expressions)

    if total == 0:
        print(f"Toutes les expressions {args.source.upper()} ont déjà une traduction {args.target.upper()}.")
        return

    print(f"{total} expression(s) {args.source.upper()} sans traduction {args.target.upper()}.")

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
            translation = call_mistral(client, expr, args.source, args.target)
            insert_translation(expr["id"], args.target, translation)
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
                    translation = call_mistral(client, expr, args.source, args.target)
                    insert_translation(expr["id"], args.target, translation)
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

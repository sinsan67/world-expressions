#!/usr/bin/env python3
"""
Génère le contenu natif (expression_content) pour les expressions qui en manquent.

Pour chaque expression sans contenu dans sa langue native, appelle Mistral
pour générer le sens, l'origine et un exemple, puis insère dans expression_content.

Idempotent : les expressions déjà renseignées sont ignorées.
Relancez librement si une exécution est interrompue.

Usage :
    python3 scripts/populate_expression_content.py --lang tr
    python3 scripts/populate_expression_content.py --lang es --dry-run --limit 5
    python3 scripts/populate_expression_content.py --lang en --prod
    python3 scripts/populate_expression_content.py --lang all --prod

Langues supportées : fr, en, es, it, tr (ou 'all' pour tout traiter)
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
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"

LANG_NAMES = {
    "fr": "French",
    "en": "English",
    "es": "Spanish",
    "it": "Italian",
    "tr": "Turkish",
}

# Pour construire le prompt dans la bonne langue
LANG_INSTRUCTIONS = {
    "fr": "in French",
    "en": "in English",
    "es": "in Spanish",
    "it": "in Italian",
    "tr": "in Turkish",
}


def build_system_prompt(lang: str) -> str:
    lang_name = LANG_NAMES[lang]
    lang_instr = LANG_INSTRUCTIONS[lang]
    return f"""You are a specialist in {lang_name} idiomatic expressions and cultural linguistics.
For each {lang_name} expression provided, generate an explanation for a {lang_name}-speaking reader.

Return ONLY a valid JSON object with exactly these 3 fields (all values must be {lang_instr}):
- "meaning": clear explanation of what the expression means (1-2 sentences)
- "example": a natural {lang_name} sentence using the expression in context
- "origin": origin or etymology {lang_instr} (null if unknown)

No markdown, no extra text — only the JSON object."""


def build_user_message(expr: dict, lang: str) -> str:
    lang_name = LANG_NAMES[lang]
    lines = [f'{lang_name} expression: "{expr["text"]}"']
    if expr.get("literal_fr"):
        lines.append(f'Literal meaning (French): "{expr["literal_fr"]}"')
    if expr.get("kind") and expr["kind"] != "idiom":
        lines.append(f'Type: {expr["kind"]}')
    if expr.get("tags"):
        lines.append(f'Themes: {expr["tags"]}')
    return "\n".join(lines)


def get_missing(lang: str, limit: int | None = None) -> list[dict]:
    sql = """
        SELECT e.id, e.text, e.kind, e.register, e.literal_fr,
               COALESCE(
                   (SELECT STRING_AGG(t.slug, ', ')
                    FROM expression_tags et
                    JOIN tags t ON t.id = et.tag_id
                    WHERE et.expression_id = e.id),
                   ''
               ) AS tags
        FROM expressions e
        LEFT JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = :lang
        WHERE e.language = :lang
          AND ec.expression_id IS NULL
          AND e.kind != 'word'
          AND NOT EXISTS (
              SELECT 1 FROM expression_tags et
              JOIN tags t ON t.id = et.tag_id
              WHERE et.expression_id = e.id AND t.slug = 'phrasebook'
          )
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"lang": lang}).fetchall()
    return [
        {
            "id":        r.id,
            "text":      r.text,
            "kind":      r.kind,
            "register":  r.register,
            "literal_fr": r.literal_fr,
            "tags":      r.tags,
        }
        for r in rows
    ]


def call_mistral(client: Mistral, expr: dict, lang: str) -> dict:
    system_prompt = build_system_prompt(lang)
    user_msg = build_user_message(expr, lang)
    response = client.chat.complete(
        model=MODEL,
        max_tokens=500,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_msg},
        ],
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    return json.loads(raw)


def insert_content(expression_id: str, lang: str, content: dict) -> None:
    sql = """
        INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
        VALUES (:id, :locale, :meaning, :origin, :example)
        ON CONFLICT (expression_id, locale) DO UPDATE SET
            meaning = EXCLUDED.meaning,
            origin  = EXCLUDED.origin,
            example = EXCLUDED.example
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {
            "id":      expression_id,
            "locale":  lang,
            "meaning": content.get("meaning"),
            "origin":  content.get("origin"),
            "example": content.get("example"),
        })


def process_lang(client: Mistral, lang: str, limit: int | None, dry_run: bool, delay: float) -> None:
    print(f"\n=== {LANG_NAMES[lang]} ({lang}) ===")
    expressions = get_missing(lang, limit)
    total = len(expressions)
    if total == 0:
        print("  Rien à faire — expression_content complet pour cette langue.")
        return
    print(f"  {total} expressions à traiter")
    if dry_run:
        for i, expr in enumerate(expressions[:5], 1):
            print(f"  [{i}] {expr['id']} — {expr['text'][:60]}")
        if total > 5:
            print(f"  ... et {total - 5} autres")
        return

    ok = 0
    errors = 0
    for i, expr in enumerate(expressions, 1):
        try:
            content = call_mistral(client, expr, lang)
            insert_content(expr["id"], lang, content)
            ok += 1
            print(f"  [{i}/{total}] {expr['id']} ... OK")
        except Exception as e:
            errors += 1
            print(f"  [{i}/{total}] {expr['id']} ... ERREUR: {e}")
        if i < total:
            time.sleep(delay)

    print(f"\n  Terminé {lang}: {ok} OK, {errors} erreurs sur {total}")


def main():
    supported = list(LANG_NAMES.keys())

    parser = argparse.ArgumentParser(
        description="Génère le contenu natif manquant dans expression_content"
    )
    parser.add_argument("--lang", required=True, choices=supported + ["all"],
                        help=f"Langue à traiter : {supported} ou 'all'")
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre max d'expressions par langue (test)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche sans appeler l'API ni écrire en base")
    parser.add_argument("--delay", type=float, default=0.3,
                        help="Délai entre appels API en secondes (défaut: 0.3)")
    parser.add_argument("--prod", action="store_true",
                        help="Utilise la base production (.env.prod)")
    args = parser.parse_args()

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key and not args.dry_run:
        print("Erreur : MISTRAL_API_KEY non trouvée dans l'environnement.")
        sys.exit(1)

    client = Mistral(api_key=api_key) if not args.dry_run else None

    langs = supported if args.lang == "all" else [args.lang]

    for lang in langs:
        process_lang(client, lang, args.limit, args.dry_run, args.delay)

    print("\nScript terminé.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Generates French expression_content for kaikki-imported expressions.

These expressions are French (language='fr') but only have English content
in expression_content (locale='en') from the Wiktionary import.
This script generates the French-language explanation using Mistral.

Usage:
    python3 scripts/generate_fr_content.py --dry-run --limit 5
    python3 scripts/generate_fr_content.py --limit 50
    DATABASE_URL=<staging-url> python3 scripts/generate_fr_content.py

Idempotent: expressions already having locale='fr' content are skipped.
"""

import sys
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_file = Path(__file__).parent.parent / ".env.dev"
if not os.environ.get("DATABASE_URL"):
    load_dotenv(env_file)

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)

from mistralai.client import Mistral

MODEL = "mistral-small-latest"

SYSTEM_PROMPT = """You are a specialist in French idiomatic expressions and cultural linguistics.
For each French expression provided, generate an explanation for a French-speaking reader.

Return ONLY a valid JSON object with exactly these 3 fields (all values in French):
- "meaning": clear explanation of what the expression means (1-2 sentences in French)
- "example": a natural French sentence using the expression (do not reuse the expression as the entire sentence)
- "origin": origin or etymology explained in French (null if unknown)

No markdown, no extra text — only the JSON object."""


def get_expressions_missing_fr_content(limit: int | None) -> list[dict]:
    sql = """
        SELECT e.id, e.text, ec.meaning AS meaning_en, ec.origin AS origin_en
        FROM expressions e
        JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = 'en'
        WHERE e.language = 'fr'
          AND e.source = 'https://kaikki.org/dictionary/French/'
          AND e.id NOT IN (
              SELECT expression_id FROM expression_content WHERE locale = 'fr'
          )
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql)).fetchall()
    return [{"id": r.id, "text": r.text, "meaning_en": r.meaning_en, "origin_en": r.origin_en} for r in rows]


def call_mistral(client: Mistral, expr: dict) -> dict | None:
    user_msg = f"""French expression: "{expr['text']}"
English meaning: {expr['meaning_en']}
English origin: {expr['origin_en'] or 'unknown'}"""

    try:
        resp = client.chat.complete(
            model=MODEL,
            max_tokens=400,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
        )
        raw = resp.choices[0].message.content.strip()
        return json.loads(raw)
    except Exception as e:
        print(f"  ERROR for '{expr['text']}': {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated, without writing to DB")
    parser.add_argument("--limit", type=int, default=None, help="Max expressions to process")
    args = parser.parse_args()

    exprs = get_expressions_missing_fr_content(args.limit)
    print(f"Expressions missing FR content: {len(exprs)}")

    if args.dry_run:
        print("(dry-run — first 3 will be generated and shown, nothing written)\n")
        exprs = exprs[:3]

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        load_dotenv(Path(__file__).parent.parent / ".env.dev")
        api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("ERROR: MISTRAL_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    client = Mistral(api_key=api_key)
    ok = 0
    errors = 0

    with engine.connect() as conn:
        for i, expr in enumerate(exprs):
            result = call_mistral(client, expr)
            if result is None:
                errors += 1
                continue

            meaning = result.get("meaning", "").strip()
            example = result.get("example", "").strip() or None
            origin = result.get("origin") or None
            if isinstance(origin, str) and not origin.strip():
                origin = None

            if args.dry_run:
                print(f"[{expr['text']}]")
                print(f"  meaning: {meaning}")
                print(f"  example: {example}")
                print(f"  origin : {origin}")
                print()
            else:
                conn.execute(text("""
                    INSERT INTO expression_content (expression_id, locale, meaning, example, origin)
                    VALUES (:id, 'fr', :meaning, :example, :origin)
                    ON CONFLICT (expression_id, locale) DO NOTHING
                """), {"id": expr["id"], "meaning": meaning, "example": example, "origin": origin})
                conn.commit()
                ok += 1

            if (i + 1) % 50 == 0:
                print(f"  {i + 1}/{len(exprs)} done...")

            time.sleep(0.3)

    if not args.dry_run:
        print(f"\nDone: {ok} generated, {errors} errors")


if __name__ == "__main__":
    main()

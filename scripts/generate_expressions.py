#!/usr/bin/env python3
"""
Generate new expressions for a given language/region using Mistral API,
then insert them into the Neon database.

Idempotent: expressions whose ID already exists in the database are skipped.
Restart freely if interrupted.

Usage:
    python3 scripts/generate_expressions.py --language it --count 60
    python3 scripts/generate_expressions.py --language tr --count 200 --batch-size 5
    python3 scripts/generate_expressions.py --language it --count 5 --dry-run

Supported languages: it, tr, es, de
"""

import sys
import json
import time
import re
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv
from sqlalchemy import text

_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"

LANGUAGE_CONFIG = {
    "it": {
        "name": "Italian",
        "region": "it",
        "source_label": "Treccani",
        "source_url": "https://www.treccani.it/vocabolario/",
        "themes": [
            "food and cooking", "family and relationships", "money and wealth",
            "the human body", "love and romance", "death and fate",
            "luck and fortune", "time and patience", "work and laziness",
            "animals", "weather and nature", "travel and homesickness",
            "friendship and trust", "wisdom and foolishness", "anger and conflict",
            "fear and courage", "pride and humility", "honesty and deception",
            "hope and despair", "old age and youth",
        ],
        "system_prompt": """You are an expert in Italian idiomatic expressions, proverbs, and sayings.
Generate authentic Italian expressions (idiomatic phrases, proverbs, locutions) that are:
- Actually used by native Italian speakers
- Culturally rooted in Italian life and history

For each expression return ONLY a valid JSON object with these exact fields:
- "id": kebab-case slug in Italian (e.g. "avere-il-cuore-in-gola")
- "expression": the expression text in Italian
- "meaning": what it means in Italian (1-2 sentences)
- "origin": etymology or cultural origin in Italian (1-2 sentences, null if unknown)
- "example": natural Italian sentence using the expression
- "register": one of "standard", "informal", "slang", "formal"
- "tags": array of 2-5 English thematic slug tags (e.g. ["body", "fear", "surprise"])
- "kind": one of "idiom" (idiomatic phrase), "proverb" (proverb/saying), "locution" (fixed locution), "word" (single word with idiomatic meaning)

No markdown, no extra text — only the JSON object.""",
    },
    "tr": {
        "name": "Turkish",
        "region": "tr",
        "source_label": "TDK",
        "source_url": "https://sozluk.gov.tr/",
        "themes": [
            "food and cooking", "family and hospitality", "money and poverty",
            "the human body", "love and marriage", "destiny and fate",
            "luck and misfortune", "time and patience", "work and effort",
            "animals and nature", "weather", "village life and Anatolian tradition",
            "friendship and betrayal", "wisdom from elders", "anger and conflict",
            "fear and courage", "pride and shame", "honesty and lies",
            "hope and resignation", "religion and spirituality",
        ],
        "system_prompt": """You are an expert in Turkish idiomatic expressions, proverbs (atasözü), and sayings (deyim).
Generate authentic Turkish expressions that are:
- Actually used by native Turkish speakers
- Culturally rooted in Turkish life, history, and Anatolian traditions

For each expression return ONLY a valid JSON object with these exact fields:
- "id": kebab-case romanized Turkish slug (replace ş→s, ğ→g, ı→i, ö→o, ü→u, ç→c, e.g. "ayagini-yorganina-gore-uzat")
- "expression": the expression text in Turkish (using Turkish characters)
- "meaning": what it means in Turkish (1-2 sentences)
- "origin": etymology or cultural origin in Turkish (1-2 sentences, null if unknown)
- "example": natural Turkish sentence using the expression
- "register": one of "standard", "informal", "slang", "formal"
- "tags": array of 2-5 English thematic slug tags (e.g. ["money", "frugality", "advice"])
- "kind": one of "idiom" (deyim), "proverb" (atasözü/proverb), "locution" (fixed locution), "word" (single word with idiomatic meaning)

No markdown, no extra text — only the JSON object.""",
    },
    "es": {
        "name": "Spanish",
        "region": "es",
        "source_label": "RAE",
        "source_url": "https://dle.rae.es/",
        "themes": [],
        "system_prompt": """You are an expert in Spanish idiomatic expressions, proverbs (refranes), and sayings (dichos) from ALL Spanish-speaking countries.
Generate authentic Spanish expressions that are:
- Actually used by native speakers — cover the full Hispanic world: Spain, Mexico, Argentina, Colombia, Chile, Peru, Venezuela, Cuba, and other countries
- Culturally rooted in the specific country or region where the expression originates
- Diverse in topic: food, family, work, body, animals, love, time, money, luck, character...
- Mix of pan-Hispanic expressions AND country-specific ones (Argentine lunfardo, Mexican slang, Rioplatense idioms, Andalusian sayings, etc.)

For each expression return ONLY a valid JSON object with these exact fields:
- "id": kebab-case slug in Spanish (replace á→a, é→e, í→i, ó→o, ú→u, ñ→n, ü→u, e.g. "no-hay-mal-que-por-bien-no-venga")
- "expression": the expression text in Spanish (using correct Spanish characters)
- "meaning": what it means in Spanish (1-2 sentences)
- "origin": etymology or cultural origin in Spanish, mentioning the country/region if specific (1-2 sentences, null if unknown)
- "example": natural Spanish sentence using the expression
- "register": one of "standard", "informal", "slang", "formal"
- "tags": array of 2-5 English thematic slug tags (e.g. ["luck", "optimism", "proverb"])
- "kind": one of "idiom" (idiom/dicho), "proverb" (refrán/proverb), "locution" (fixed locution), "word" (single word with idiomatic meaning)
- "region": ISO 3166-1 alpha-2 country code for the primary country of origin — use "es" for Spain, "ar" for Argentina, "mx" for Mexico, "co" for Colombia, "cl" for Chile, "pe" for Peru, "cu" for Cuba, "ve" for Venezuela; use "es" if pan-Hispanic or origin unknown

No markdown, no extra text — only the JSON object.""",
    },
    "de": {
        "name": "German",
        "region": "de",
        "source_label": "Duden / Redensarten-Index",
        "source_url": "https://www.redensarten-index.de/",
        "themes": [
            "food, beer and drinking culture", "family and relationships",
            "money and frugality", "the human body", "love and heartbreak",
            "fate and destiny", "work, diligence and laziness",
            "animals", "weather and nature", "wisdom and folly",
            "time and patience", "friendship and trust",
            "anger and conflict", "fear and courage",
            "honesty and deception", "luck and misfortune",
            "pride and humility", "travel and homesickness",
            "order, rules and discipline", "learning and knowledge",
        ],
        "system_prompt": """You are an expert in German idiomatic expressions, proverbs (Sprichwörter), sayings (Redewendungen), and fixed phrases (feste Wendungen).
Generate authentic German expressions that are:
- Actually used by native German speakers
- Culturally rooted in German, Austrian, or Swiss life and history
- Diverse in register and topic

For each expression return ONLY a valid JSON object with these exact fields:
- "id": kebab-case slug using German transliteration (ä→ae, ö→oe, ü→ue, ß→ss), e.g. "den-nagel-auf-den-kopf-treffen"
- "expression": the expression text in German (using correct German characters)
- "meaning": what it means in German (1-2 sentences)
- "origin": etymology or cultural origin in German (1-2 sentences, null if unknown)
- "example": natural German sentence using the expression
- "register": one of "standard", "informal", "slang", "formal"
- "tags": array of 2-5 English thematic slug tags (e.g. ["precision", "success", "communication"])
- "kind": one of "idiom" (Redewendung), "proverb" (Sprichwort), "locution" (feste Wendung), "word" (single word with idiomatic meaning)

No markdown, no extra text — only the JSON object.""",
    },
    "ja": {
        "name": "Japanese",
        "region": "jp",
        "source_label": "大辞泉 / Jisho.org",
        "source_url": "https://dictionary.goo.ne.jp/",
        "themes": [
            "food and Japanese cuisine", "family and relationships",
            "money and frugality", "the human body", "love and romance",
            "fate and destiny", "work and diligence",
            "nature and seasons", "animals", "wisdom and foolishness",
            "time and patience", "friendship and loyalty",
            "anger and conflict", "fear and courage",
            "honesty and deception", "luck and misfortune",
            "pride and humility", "tradition and change",
            "silence and communication", "Buddhist and Shinto wisdom",
        ],
        "system_prompt": """You are an expert in Japanese idiomatic expressions (慣用句 kan'yōku), proverbs (諺 kotowaza), four-character idioms (四字熟語 yojijukugo), and fixed phrases.
Generate authentic Japanese expressions that are:
- Actually used by native Japanese speakers
- Culturally rooted in Japanese life, history, and tradition
- Sourced from: Jisho.org, Japanese Wiktionary (ja.wiktionary.org), dictionary.goo.ne.jp

For each expression return ONLY a valid JSON object with these exact fields:
- "id": romaji kebab-case slug (e.g. "hana-yori-dango" for 花より団子, "isogaba-maware" for 急がば回れ, "me-kara-uroko" for 目から鱗)
- "expression": the expression text in Japanese (kanji + kana as used in standard Japanese)
- "meaning": what it means in Japanese (1-2 sentences)
- "origin": etymology or cultural origin in Japanese (1-2 sentences, null if unknown)
- "example": natural Japanese sentence using the expression
- "register": one of "standard", "informal", "slang", "formal"
- "tags": array of 2-5 English thematic slug tags (e.g. ["patience", "wisdom", "food"])
- "kind": one of "idiom" (慣用句), "proverb" (諺), "locution" (固定表現), "word" (単語)

No markdown, no extra text — only the JSON object.""",
    },
}

VALID_REGISTERS = {"standard", "informal", "slang", "formal", "vulgar"}
VALID_KINDS = {"idiom", "word", "proverb", "locution"}
# Map legacy 'type' values Mistral might still return to valid 'kind' values
KIND_ALIASES = {"expression": "idiom", "phrase": "idiom", "saying": "proverb"}


def slugify(text: str) -> str:
    """Convert Turkish/Italian/Spanish/German text to kebab-case ASCII slug."""
    replacements = {
        # German — must come before the generic ö→o / ü→u rules below
        "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
        "Ä": "ae", "Ö": "oe", "Ü": "ue",
        # Turkish
        "ş": "s", "ğ": "g", "ı": "i", "ç": "c",
        # Italian / French / Spanish
        "à": "a", "è": "e", "é": "e", "ì": "i", "ò": "o", "ù": "u",
        "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u",
        "á": "a", "í": "i", "ó": "o", "ú": "u", "ñ": "n",
    }
    s = text.lower()
    for orig, repl in replacements.items():
        s = s.replace(orig, repl)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s


def get_existing(language: str) -> tuple[set[str], list[str]]:
    """Fetch existing expression IDs and texts from the database for this language."""
    sql = "SELECT id, text FROM expressions WHERE language = :lang"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"lang": language}).fetchall()
    ids = {r.id for r in rows}
    texts = [r.text for r in rows]
    return ids, texts


def get_or_create_tag(conn, slug: str) -> str:
    """Ensure a tag exists in the tags table, return its slug (used as id)."""
    conn.execute(
        text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT (id) DO NOTHING"),
        {"id": slug, "slug": slug},
    )
    return slug


def insert_expression(expr: dict, language: str, config: dict) -> None:
    """Insert one expression into expressions + expression_content + expression_tags."""
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO expressions (id, text, language, region, register, kind, source)
                VALUES (:id, :text, :language, :region, :register, :kind, :source)
                ON CONFLICT (id) DO NOTHING
            """),
            {
                "id": expr["id"],
                "text": expr["expression"],
                "language": language,
                "region": expr.get("region") or config["region"],
                "register": expr.get("register", "standard"),
                "kind": expr["kind"],
                "source": None,
            },
        )

        conn.execute(
            text("""
                INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
                VALUES (:id, :locale, :meaning, :origin, :example)
                ON CONFLICT (expression_id, locale) DO NOTHING
            """),
            {
                "id": expr["id"],
                "locale": language,
                "meaning": expr.get("meaning", ""),
                "origin": expr.get("origin"),
                "example": expr.get("example", ""),
            },
        )

        for tag_slug in expr.get("tags", []):
            slug = slugify(tag_slug)
            if not slug:
                continue
            get_or_create_tag(conn, slug)
            conn.execute(
                text("""
                    INSERT INTO expression_tags (expression_id, tag_id)
                    VALUES (:expr_id, :tag_id)
                    ON CONFLICT DO NOTHING
                """),
                {"expr_id": expr["id"], "tag_id": slug},
            )


def build_user_message(existing_expressions: list[str], language: str, batch_size: int, theme: str | None) -> str:
    """Build a prompt asking Mistral to generate one batch of expressions."""
    avoid = "\n".join(f"- {e}" for e in existing_expressions[-60:]) if existing_expressions else "(none yet)"
    theme_line = f"\nFocus this batch on the theme: **{theme}**\n" if theme else ""

    if batch_size == 1:
        return f"""Generate 1 authentic {LANGUAGE_CONFIG[language]['name']} idiomatic expression or proverb.
{theme_line}
Already in database (avoid duplicates):
{avoid}

Return a single JSON object for one new expression."""
    else:
        return f"""Generate {batch_size} authentic {LANGUAGE_CONFIG[language]['name']} idiomatic expressions or proverbs.
{theme_line}
Rules:
- Each expression in this batch must be distinct from the others
- Do NOT repeat any expression from the list below
- Vary the register across the batch (mix standard, informal, formal)

Already in database — do NOT generate any of these:
{avoid}

Return a JSON array of exactly {batch_size} objects:
[
  {{"id": "...", "expression": "...", "meaning": "...", "origin": "...", "example": "...", "register": "...", "tags": [...], "type": "..."}},
  ...
]

No markdown, no extra text — only the JSON array."""


def call_mistral(client: Mistral, language: str, existing_in_session: list[str], batch_size: int, theme: str | None) -> list[dict]:
    """Call Mistral and return a list of expression dicts (1 or more)."""
    config = LANGUAGE_CONFIG[language]
    response = client.chat.complete(
        model=MODEL,
        max_tokens=600 * batch_size,
        messages=[
            {"role": "system", "content": config["system_prompt"]},
            {"role": "user", "content": build_user_message(existing_in_session, language, batch_size, theme)},
        ],
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw

    parsed = json.loads(raw)
    if isinstance(parsed, dict):
        return [parsed]
    elif isinstance(parsed, list):
        return parsed
    else:
        raise ValueError(f"Unexpected response type: {type(parsed)}")


def validate_expression(expr: dict, language: str) -> tuple[bool, str]:
    """Basic validation of a generated expression."""
    required = ["id", "expression", "meaning", "example", "register", "tags"]
    for field in required:
        if field not in expr:
            return False, f"missing field '{field}'"
    if expr["register"] not in VALID_REGISTERS:
        expr["register"] = "standard"
    if not isinstance(expr["tags"], list) or len(expr["tags"]) == 0:
        return False, "tags must be a non-empty list"
    # Normalise kind: accept both 'kind' and legacy 'type' keys, map aliases
    raw_kind = expr.get("kind") or expr.get("type", "idiom")
    expr["kind"] = KIND_ALIASES.get(raw_kind, raw_kind) if raw_kind not in VALID_KINDS else raw_kind
    if expr["kind"] not in VALID_KINDS:
        expr["kind"] = "idiom"
    expr["id"] = slugify(expr.get("id") or expr["expression"])
    return True, "ok"


def main():
    supported = list(LANGUAGE_CONFIG.keys())
    parser = argparse.ArgumentParser(description="Generate new expressions via Mistral and insert into Neon")
    parser.add_argument("--language", required=True, choices=supported, help=f"Target language: {supported}")
    parser.add_argument("--count", type=int, default=60, help="Number of expressions to generate (default: 60)")
    parser.add_argument("--batch-size", type=int, default=5, help="Expressions per API call (default: 5)")
    parser.add_argument("--dry-run", action="store_true", help="Print generated JSON without inserting into DB")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between API calls in seconds (default: 1.0)")
    parser.add_argument("--prod", action="store_true", help="Use production database (.env.prod)")
    args = parser.parse_args()

    language = args.language
    batch_size = max(1, min(args.batch_size, 10))
    config = LANGUAGE_CONFIG[language]
    db_language = config.get("db_language", language)
    themes = config.get("themes", [])

    print(f"Generating {args.count} {config['name']} expressions (batch={batch_size})")
    if themes:
        print(f"Thematic rotation: {len(themes)} themes")
    print(f"Fetching existing {db_language.upper()} expressions from database...")
    existing_ids, existing_texts = get_existing(db_language)
    print(f"  → {len(existing_ids)} already in database\n")

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("ERROR: MISTRAL_API_KEY not set in .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)

    generated_this_session: list[str] = list(existing_texts)
    ok = skipped = errors = 0
    batch_num = 0
    max_batch_attempts = (args.count // batch_size + 10) * 4

    while ok < args.count and batch_num < max_batch_attempts:
        theme = themes[batch_num % len(themes)] if themes else None
        remaining = args.count - ok
        current_batch = min(batch_size, remaining)
        theme_label = f" [{theme}]" if theme else ""
        print(f"\n[Batch {batch_num + 1}{theme_label}] Requesting {current_batch} expressions...", flush=True)

        try:
            batch = call_mistral(client, language, generated_this_session, current_batch, theme)
        except json.JSONDecodeError as e:
            print(f"  JSON ERROR: {e}")
            errors += 1
            batch_num += 1
            time.sleep(args.delay)
            continue
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("  RATE LIMIT — waiting 60s")
                time.sleep(60)
            else:
                print(f"  API ERROR: {e}")
                errors += 1
                time.sleep(args.delay)
            batch_num += 1
            continue

        batch_num += 1

        for expr in batch:
            if ok >= args.count:
                break

            valid, reason = validate_expression(expr, language)
            if not valid:
                print(f"  INVALID ({reason}): {expr.get('expression', '?')}")
                errors += 1
                continue

            expr_id = expr["id"]
            expr_text = expr["expression"]

            if expr_id in existing_ids:
                print(f"  SKIP (already in DB): {expr_id}")
                skipped += 1
                continue

            if expr_text in generated_this_session:
                print(f"  SKIP (duplicate): {expr_text}")
                skipped += 1
                continue

            print(f"  [{ok + 1:3}/{args.count}] {expr_text}")

            if args.dry_run:
                print(f"    [dry-run] {json.dumps(expr, ensure_ascii=False, indent=2)}")
            else:
                try:
                    insert_expression(expr, db_language, config)
                except Exception as e:
                    print(f"    DB ERROR: {e}")
                    errors += 1
                    continue

            existing_ids.add(expr_id)
            generated_this_session.append(expr_text)
            ok += 1

        if ok < args.count:
            time.sleep(args.delay)

    print(f"\nDone: {ok} inserted, {skipped} skipped (duplicates), {errors} errors.")
    if errors:
        print("Re-run the script to retry — it is idempotent.")


if __name__ == "__main__":
    main()

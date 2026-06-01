"""
Import French expressions from kaikki.org (Wiktionary dump).

Usage:
  python3 scripts/import_kaikki_fr.py --dry-run          # inspect 30 entries
  python3 scripts/import_kaikki_fr.py --dry-run --limit 100
  python3 scripts/import_kaikki_fr.py --apply            # import to DB (staging first!)
  python3 scripts/import_kaikki_fr.py --apply --staging  # import to Neon staging branch

Source: https://kaikki.org/dictionary/French/
File:   data/raw/fr-extract.jsonl.gz

Notes:
  - Glosses from enwiktionary are in English — stored as expression_content(language='en')
  - French content (meaning/example/origin) must be generated later via populate_translations.py
  - Deduplicates against existing expressions by normalized text
"""

import gzip
import json
import re
import sys
import os
import argparse
from pathlib import Path

# Adjust path so we can import project modules
sys.path.insert(0, str(Path(__file__).parent.parent))

TARGET_POS = {"phrase", "proverb", "prep_phrase"}
DATA_FILE = Path(__file__).parent.parent / "data" / "raw" / "fr-extract.jsonl.gz"

# Tags linguistiques kaikki → nos slugs
TAG_MAP = {
    "proverb": "proverb",
    "idiom": "idiom",
    "colloquial": "informal",
    "slang": "slang",
    "vulgar": "vulgar",
    "formal": "formal",
    "archaic": "archaic",
    "figurative": "figurative",
    "humorous": "humorous",
    "ironic": "ironic",
    "literary": "literary",
    "rare": "rare",
    "regional": "regional",
}

POS_TO_TAG = {
    "proverb": "proverb",
    "phrase": None,      # tag depends on senses tags
    "prep_phrase": "locution",
}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def slug_from_text(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[àâä]", "a", slug)
    slug = re.sub(r"[éèêë]", "e", slug)
    slug = re.sub(r"[îï]", "i", slug)
    slug = re.sub(r"[ôö]", "o", slug)
    slug = re.sub(r"[ùûü]", "u", slug)
    slug = re.sub(r"[ç]", "c", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:80]


# Patterns signaling a phrasebook-style entry (basic conversational phrases)
# These are imported but tagged 'phrasebook' and excluded from default results
PHRASEBOOK_PATTERNS = [
    r"^(my name is|i (am|love|don'?t|think|want|have)|do you speak|how (old|are)|what (is|are))",
    r"^(please|thank you|you'?re welcome|see you|good (morning|evening|night|bye|luck|appetite))",
    r"^(yes|no|hello|goodbye|excuse me|sorry|help)",
    r"^(how do you say|i don'?t understand|i don'?t speak)",
]
PHRASEBOOK_RE = re.compile("|".join(PHRASEBOOK_PATTERNS), re.IGNORECASE)

MEANING_SKIP_PREFIXES = (
    "alternative form of",
    "alternative letter-case form of",
    "initialism of",
    "abbreviation of",
    "acronym of",
    "synonym of",
    "eye dialect of",
    "dated form of",
    "obsolete form of",
    "misspelling of",
    "compound of",
)


def is_abbreviation(word: str) -> bool:
    # All-caps (3+ chars) or contains dots between single chars like R.S.V.P.
    if re.match(r"^[A-Z0-9]{2,}$", word):
        return True
    if re.match(r"^([A-Z]\.){2,}", word):
        return True
    return False


def extract_entry(entry: dict) -> dict | None:
    pos = entry.get("pos")
    if pos not in TARGET_POS:
        return None

    word = entry.get("word", "").strip()
    if not word or len(word) < 3:
        return None

    # Skip abbreviations and single-word entries
    if is_abbreviation(word):
        return None
    if len(word.split()) < 2:
        return None

    senses = entry.get("senses", [])
    if not senses:
        return None

    # Pick first non-empty sense
    sense = next((s for s in senses if s.get("glosses")), None)
    if not sense:
        return None

    glosses = sense.get("glosses", [])
    meaning_en = glosses[0].strip() if glosses else ""
    if not meaning_en:
        return None

    # Skip non-definitions (redirects, cross-references)
    if any(meaning_en.lower().startswith(p) for p in MEANING_SKIP_PREFIXES):
        return None

    # Example sentence (prefer FR text, use translation as english)
    example_fr = ""
    example_en = ""
    for ex in sense.get("examples", []):
        text = ex.get("text", "").strip()
        # Skip if example is just the word itself
        if text and text.lower() != word.lower():
            example_fr = text
            example_en = ex.get("translation", "").strip()
            break

    # Etymology
    origin = entry.get("etymology_text", "").strip()

    # Tags from sense
    sense_tags = sense.get("tags") or []
    mapped_tags = set()
    for t in sense_tags:
        if t in TAG_MAP:
            mapped_tags.add(TAG_MAP[t])
    # POS-level default tag
    pos_tag = POS_TO_TAG.get(pos)
    if pos_tag:
        mapped_tags.add(pos_tag)
    # Detect phrasebook entries (basic conversational phrases)
    if PHRASEBOOK_RE.match(meaning_en):
        mapped_tags.add("phrasebook")

    return {
        "text": word,
        "id": slug_from_text(word),
        "language": "fr",
        "region": "fr",
        "register": "standard",
        "pos": pos,
        "meaning_en": meaning_en,
        "example_fr": example_fr,
        "example_en": example_en,
        "origin": origin,
        "tags": sorted(mapped_tags),
        "source": "https://kaikki.org/dictionary/French/",
    }


def load_existing_texts(db_url: str) -> set[str]:
    from sqlalchemy import create_engine, text
    engine = create_engine(db_url)
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT text FROM expressions WHERE language = 'fr'"))
        return {normalize_text(r[0]) for r in rows}


def stream_entries(limit: int | None = None):
    seen_slugs: set[str] = set()
    count = 0
    skipped_dup = 0

    with gzip.open(DATA_FILE, "rt", encoding="utf-8") as f:
        for line in f:
            if limit and count >= limit:
                break
            try:
                raw = json.loads(line)
            except json.JSONDecodeError:
                continue

            result = extract_entry(raw)
            if result is None:
                continue

            # Deduplicate within the file itself
            slug = result["id"]
            if slug in seen_slugs:
                skipped_dup += 1
                continue
            seen_slugs.add(slug)

            count += 1
            yield result

    if skipped_dup:
        print(f"  (skipped {skipped_dup} in-file duplicates)", file=sys.stderr)


def dry_run(limit: int = 30):
    print(f"=== DRY RUN — first {limit} entries ===\n")
    entries = []
    stats = {"has_example": 0, "has_origin": 0, "has_tags": 0}

    for entry in stream_entries(limit=limit):
        entries.append(entry)
        if entry["example_fr"]:
            stats["has_example"] += 1
        if entry["origin"]:
            stats["has_origin"] += 1
        if entry["tags"]:
            stats["has_tags"] += 1

    for e in entries:
        print(f"[{e['pos']}] {e['text']}")
        print(f"  meaning_en : {e['meaning_en'][:120]}")
        if e["example_fr"]:
            print(f"  example_fr : {e['example_fr'][:100]}")
        if e["origin"]:
            print(f"  origin     : {e['origin'][:100]}")
        if e["tags"]:
            print(f"  tags       : {e['tags']}")
        print()

    total = len(entries)
    print(f"--- Stats ({total} entries) ---")
    print(f"  Has example FR  : {stats['has_example']}/{total} ({100*stats['has_example']//total}%)")
    print(f"  Has origin/etym : {stats['has_origin']}/{total} ({100*stats['has_origin']//total}%)")
    print(f"  Has tags        : {stats['has_tags']}/{total} ({100*stats['has_tags']//total}%)")


def apply_import(staging: bool = False):
    from dotenv import load_dotenv
    env_file = Path(__file__).parent.parent / (".env.prod" if staging else ".env.dev")
    load_dotenv(env_file)

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print(f"ERROR: DATABASE_URL not set in {env_file}", file=sys.stderr)
        sys.exit(1)

    if staging:
        print(f"Using STAGING database ({env_file})")

    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import Session
    import models

    engine = create_engine(db_url)
    existing = load_existing_texts(db_url)
    print(f"Existing FR expressions in DB: {len(existing)}")

    entries = list(stream_entries())
    new_entries = [e for e in entries if normalize_text(e["text"]) not in existing]
    print(f"Entries from kaikki (after in-file dedup): {len(entries)}")
    print(f"New entries (not in DB): {len(new_entries)}")

    if not new_entries:
        print("Nothing to import.")
        return

    print(f"\nImporting {len(new_entries)} expressions...")

    with Session(engine) as session:
        imported = 0
        skipped = 0

        for e in new_entries:
            # Check slug uniqueness
            existing_id = session.execute(
                text("SELECT id FROM expressions WHERE id = :id"), {"id": e["id"]}
            ).fetchone()

            expr_id = e["id"]
            if existing_id:
                expr_id = f"{e['id']}-{e['language']}"

            try:
                # Insert expression
                session.execute(text("""
                    INSERT INTO expressions (id, text, language, region, register, source)
                    VALUES (:id, :text, :language, :region, :register, :source)
                    ON CONFLICT (id) DO NOTHING
                """), {
                    "id": expr_id,
                    "text": e["text"],
                    "language": e["language"],
                    "region": e["region"],
                    "register": e["register"],
                    "source": e["source"],
                })

                # Insert English content (from enwiktionary)
                if e["meaning_en"]:
                    session.execute(text("""
                        INSERT INTO expression_content (expression_id, locale, meaning, example, origin)
                        VALUES (:expr_id, 'en', :meaning, :example, :origin)
                        ON CONFLICT (expression_id, locale) DO NOTHING
                    """), {
                        "expr_id": expr_id,
                        "meaning": e["meaning_en"],
                        "example": e["example_en"] or None,
                        "origin": e["origin"] or None,
                    })

                # Insert tags
                for tag_slug in e["tags"]:
                    # In this schema, tags.id = tags.slug (both varchar)
                    session.execute(text("""
                        INSERT INTO tags (id, slug) VALUES (:slug, :slug)
                        ON CONFLICT (id) DO NOTHING
                    """), {"slug": tag_slug})

                    session.execute(text("""
                        INSERT INTO expression_tags (expression_id, tag_id)
                        VALUES (:expr_id, :tag_id)
                        ON CONFLICT DO NOTHING
                    """), {"expr_id": expr_id, "tag_id": tag_slug})

                imported += 1

            except Exception as ex:
                print(f"  ERROR on '{e['text']}': {ex}")
                skipped += 1

        session.commit()

    print(f"\nDone: {imported} imported, {skipped} errors")
    print("\nNext step: run populate_translations.py --source en --target fr to generate French content")


def main():
    parser = argparse.ArgumentParser(description="Import kaikki.org FR expressions")
    parser.add_argument("--dry-run", action="store_true", help="Preview entries without importing")
    parser.add_argument("--apply", action="store_true", help="Actually import to database")
    parser.add_argument("--staging", action="store_true", help="Use staging DB (with --apply)")
    parser.add_argument("--limit", type=int, default=30, help="Limit for dry-run (default: 30)")
    args = parser.parse_args()

    if not DATA_FILE.exists():
        print(f"ERROR: {DATA_FILE} not found. Download it first:", file=sys.stderr)
        print("  curl -L 'https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl.gz'", file=sys.stderr)
        print("       -o data/raw/fr-extract.jsonl.gz", file=sys.stderr)
        sys.exit(1)

    if args.dry_run:
        dry_run(limit=args.limit)
    elif args.apply:
        apply_import(staging=args.staging)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

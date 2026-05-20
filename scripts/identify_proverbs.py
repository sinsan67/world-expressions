"""
Heuristic analysis: identify potential proverbs and tag them via expression_tags.

Scans all expressions and applies the 'proverb' tag to those that match
known proverb patterns (full sentence, universal subject, wisdom formula).

Run AFTER scripts/add_type_tags.py has created the 'proverb' tag.

Usage:
    python3 scripts/identify_proverbs.py            # dry-run: shows candidates
    python3 scripts/identify_proverbs.py --apply    # applies proverb tag in DB

Review the printed list before applying — false positives are possible.
"""

import sys
import re
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DRY_RUN = "--apply" not in sys.argv

# Patterns that strongly suggest a proverb.
# Format: (language, regex_pattern)
PROVERB_PATTERNS: list[tuple[str, str]] = [
    # French
    ("fr", r"^(Quand |Il (faut|ne faut pas)|Mieux vaut |À bon |On ne |Qui (ne |sème|aime)|Tel |Nul )"),
    ("fr", r"^(Plus on |Chaque |Aide-toi|Vouloir c'est|L'habit ne fait|Rien ne sert de|Tout vient à)"),
    ("fr", r"^(Dis-moi qui|À chaque jour|Les absents|Pierre qui roule|La nuit, tous)"),
    # English
    ("en", r"^(When |A bird |A stitch |A rolling |Actions speak|All that glitters|An apple )"),
    ("en", r"^(Better safe|Birds of a|Curiosity killed|Don't count|Don't bite|Every cloud)"),
    ("en", r"^(He who |If you want|It takes |Let sleeping|Make hay |No pain |Once bitten)"),
    ("en", r"^(Rome wasn't|Strike while|The early bird|Time flies|Too many cooks|Two wrongs)"),
    ("en", r"^(You can't |You reap |Necessity is|Practice makes|The pen is|Great minds)"),
    # Spanish
    ("es", r"^(Cuando |Más vale |No hay |A mal tiempo|Camarón que |Dime con quién)"),
    ("es", r"^(El que |En boca cerrada|No por mucho|A caballo regalado|Al mal tiempo)"),
    ("es", r"^(Barriga llena|Del dicho al hecho|En casa del herrero|No dejes para)"),
]


def is_proverb_candidate(expr_text: str, language: str) -> bool:
    for lang, pattern in PROVERB_PATTERNS:
        if lang == language and re.search(pattern, expr_text):
            return True
    return False


def main() -> None:
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("ERROR: DATABASE_URL not set.")
    engine = create_engine(url)

    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, text, language FROM expressions ORDER BY language, text")
        ).fetchall()

        # Expressions already tagged as proverb
        already_tagged = {
            r.expression_id
            for r in conn.execute(
                text("SELECT expression_id FROM expression_tags WHERE tag_id = 'proverb'")
            ).fetchall()
        }

    candidates = [
        r for r in rows
        if is_proverb_candidate(r.text, r.language) and r.id not in already_tagged
    ]

    print(f"\nTotal expressions scanned : {len(rows)}")
    print(f"Already tagged 'proverb'  : {len(already_tagged)}")
    print(f"New candidates found      : {len(candidates)}")
    print()

    by_lang: dict[str, list] = {}
    for r in candidates:
        by_lang.setdefault(r.language, []).append(r)

    for lang, items in sorted(by_lang.items()):
        print(f"--- {lang.upper()} ({len(items)}) ---")
        for r in items:
            print(f"  [{r.id}] {r.text}")
        print()

    if DRY_RUN:
        print("Dry-run mode. Run with --apply to tag these expressions as proverbs.")
        return

    with engine.begin() as conn:
        for r in candidates:
            conn.execute(
                text("""
                    INSERT INTO expression_tags (expression_id, tag_id)
                    VALUES (:eid, 'proverb')
                    ON CONFLICT DO NOTHING
                """),
                {"eid": r.id},
            )

    print(f"Tagged {len(candidates)} expressions with 'proverb'.")


if __name__ == "__main__":
    main()

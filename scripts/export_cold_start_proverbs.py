"""
Exporte un pool statique de proverbes (un par jour de l'année) vers
web/lib/coldStartProverbs.json, pour alimenter ColdStartCard sans appel API.

Pourquoi en dur : ColdStartCard s'affiche justement quand le backend/DB
est injoignable (Render se réveille) — impossible de fetcher /daily à ce
moment-là. On gèle donc une sélection de proverbes réels, avec leur
traduction (sens + littéral) dans les 7 langues UI, dans un fichier statique
bundlé côté frontend.

Usage :
  python3 scripts/export_cold_start_proverbs.py               # dry-run, affiche le compte
  python3 scripts/export_cold_start_proverbs.py --write        # écrit web/lib/coldStartProverbs.json
  python3 scripts/export_cold_start_proverbs.py --write --prod # cible .env.prod (par défaut)
"""

import argparse
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

parser = argparse.ArgumentParser()
parser.add_argument("--write", action="store_true", help="écrit le fichier JSON (sinon dry-run)")
parser.add_argument("--prod", action="store_true", default=True, help="cible .env.prod (défaut)")
parser.add_argument("--dev", dest="prod", action="store_false", help="cible .env.dev à la place")
parser.add_argument("--target-count", type=int, default=365, help="nombre de proverbes à sélectionner")
args = parser.parse_args()

from dotenv import load_dotenv
import os

env_file = ".env.prod" if args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / env_file)

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/expressions_dev")
engine = create_engine(DATABASE_URL)

UI_LANGS = ["fr", "en", "es", "it", "tr", "de", "ja"]
OUTPUT_PATH = Path(__file__).parent.parent / "web" / "lib" / "coldStartProverbs.json"

MIN_LEN = 4  # filtre les traductions vides/quasi-vides ("-", ".", etc.)


def fetch_candidates(conn, language: str, limit: int) -> list[dict]:
    """Proverbes de `language` dont la traduction (sens + littéral) existe
    et est non-vide dans les 6 AUTRES langues UI — sinon la carte serait
    cassée pour une partie des visiteurs selon leur uiLang."""
    other_langs = [l for l in UI_LANGS if l != language]
    rows = conn.execute(
        text("""
            SELECT e.id, e.text, e.language, e.country
            FROM expressions e
            JOIN expression_content ec
              ON ec.expression_id = e.id AND ec.locale = e.language
            WHERE e.kind = 'proverb'
              AND e.language = :language
              AND length(trim(ec.meaning)) >= :min_len
              AND (
                SELECT COUNT(DISTINCT ct.target_lang)
                FROM content_translations ct
                WHERE ct.expression_id = e.id
                  AND ct.target_lang = ANY(:other_langs)
                  AND length(trim(ct.meaning)) >= :min_len
                  AND length(trim(ct.literal)) >= :min_len
              ) = :n_others
            ORDER BY random()
            LIMIT :limit
        """),
        {
            "language": language,
            "other_langs": other_langs,
            "min_len": MIN_LEN,
            "n_others": len(other_langs),
            "limit": limit,
        },
    ).fetchall()
    return [dict(r._mapping) for r in rows]


def fetch_translations(conn, expression_id: str, source_lang: str) -> dict:
    """{ lang: {meaning, literal} } pour les 7 langues UI — literal=None pour source_lang."""
    out: dict = {}

    native = conn.execute(
        text("SELECT meaning FROM expression_content WHERE expression_id = :id AND locale = :lang"),
        {"id": expression_id, "lang": source_lang},
    ).fetchone()
    out[source_lang] = {"meaning": native.meaning if native else None, "literal": None}

    rows = conn.execute(
        text("""
            SELECT target_lang, meaning, literal FROM content_translations
            WHERE expression_id = :id AND target_lang = ANY(:langs)
        """),
        {"id": expression_id, "langs": [l for l in UI_LANGS if l != source_lang]},
    ).fetchall()
    for row in rows:
        out[row.target_lang] = {"meaning": row.meaning, "literal": row.literal}

    return out


def main() -> None:
    per_lang_target = -(-args.target_count // len(UI_LANGS))  # ceil

    entries = []
    with engine.connect() as conn:
        for lang in UI_LANGS:
            candidates = fetch_candidates(conn, lang, per_lang_target)
            print(f"  {lang}: {len(candidates)} candidats éligibles (objectif {per_lang_target})")
            for row in candidates:
                translations = fetch_translations(conn, row["id"], lang)
                entries.append({
                    "id": row["id"],
                    "expression": row["text"],
                    "sourceLang": row["language"],
                    "country": row["country"],
                    "translations": translations,
                })

    random.seed(42)
    random.shuffle(entries)
    entries = entries[: args.target_count]

    for i, entry in enumerate(entries):
        entry["day"] = i

    print(f"\nTotal sélectionné : {len(entries)} / {args.target_count} demandés")
    by_lang: dict = {}
    for e in entries:
        by_lang[e["sourceLang"]] = by_lang.get(e["sourceLang"], 0) + 1
    print("Répartition par langue source :", by_lang)

    if args.write:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
        size_kb = OUTPUT_PATH.stat().st_size / 1024
        print(f"\n✅ Écrit : {OUTPUT_PATH} ({size_kb:.0f} Ko)")
    else:
        print("\n(dry-run — relancer avec --write pour générer le fichier)")


if __name__ == "__main__":
    main()

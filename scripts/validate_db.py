"""
Validation de la base de données expressions.

Vérifie la cohérence entre expressions.json et expressions.db,
et détecte les problèmes de qualité des données.

Usage :
    python3 scripts/validate_db.py
"""

import json
import sqlite3
from collections import Counter
from pathlib import Path

JSON_PATH = Path(__file__).parent.parent / "data" / "expressions.json"
DB_PATH   = Path(__file__).parent.parent / "data" / "expressions.db"

VALID_REGISTERS = {"standard", "informal", "slang", "vulgar", "formal"}
VALID_LANGUAGES = {"fr", "en"}

errors:   list[str] = []
warnings: list[str] = []


def check(condition: bool, message: str, is_warning: bool = False) -> None:
    if not condition:
        (warnings if is_warning else errors).append(message)


# ── Chargement ────────────────────────────────────────────────────────────────

print("Chargement des données…")

with open(JSON_PATH, encoding="utf-8") as f:
    json_data: list[dict] = json.load(f)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
db_rows = conn.execute("SELECT * FROM expressions").fetchall()
conn.close()

json_ids = [e["id"] for e in json_data]
db_ids   = [r["id"] for r in db_rows]

print(f"  JSON : {len(json_data)} expressions")
print(f"  SQLite : {len(db_rows)} expressions")
print()

# ── 1. Synchronisation JSON ↔ SQLite ─────────────────────────────────────────

check(
    len(json_data) == len(db_rows),
    f"Désynchronisation : {len(json_data)} entrées en JSON vs {len(db_rows)} en SQLite. "
    f"Relancer python3 scripts/migrate_json_to_sqlite.py"
)

only_in_json = set(json_ids) - set(db_ids)
only_in_db   = set(db_ids) - set(json_ids)
if only_in_json:
    errors.append(f"{len(only_in_json)} IDs présents en JSON mais absents de SQLite : {sorted(only_in_json)[:5]}…")
if only_in_db:
    errors.append(f"{len(only_in_db)} IDs présents en SQLite mais absents du JSON : {sorted(only_in_db)[:5]}…")

# ── 2. Doublons d'ID ──────────────────────────────────────────────────────────

id_counts = Counter(json_ids)
duplicates = {id_: n for id_, n in id_counts.items() if n > 1}
if duplicates:
    for id_, n in list(duplicates.items())[:5]:
        errors.append(f"ID dupliqué '{id_}' ({n} fois)")

# ── 3. Champs obligatoires ────────────────────────────────────────────────────

required = ["id", "expression", "meaning"]
for expr in json_data:
    for field in required:
        check(
            bool(expr.get(field, "").strip()),
            f"Champ '{field}' vide ou absent sur l'expression '{expr.get('id', '?')}'"
        )

# ── 4. Valeurs de register ────────────────────────────────────────────────────

invalid_registers = [
    f"'{e['id']}' a register='{e.get('register')}'"
    for e in json_data
    if e.get("register") not in VALID_REGISTERS
]
if invalid_registers:
    errors.append(
        f"{len(invalid_registers)} register(s) invalide(s) "
        f"(valeurs attendues : {VALID_REGISTERS}) :\n    "
        + "\n    ".join(invalid_registers[:5])
    )

# ── 5. Valeurs de language ────────────────────────────────────────────────────

invalid_languages = [
    f"'{e['id']}' a language='{e.get('language')}'"
    for e in json_data
    if e.get("language") not in VALID_LANGUAGES
]
if invalid_languages:
    errors.append(
        f"{len(invalid_languages)} language(s) invalide(s) "
        f"(valeurs attendues : {VALID_LANGUAGES}) :\n    "
        + "\n    ".join(invalid_languages[:5])
    )

# ── 6. Tags ───────────────────────────────────────────────────────────────────

no_tags = [e["id"] for e in json_data if not e.get("tags")]
if no_tags:
    warnings.append(f"{len(no_tags)} expression(s) sans tags : {no_tags[:5]}")

# ── Rapport ───────────────────────────────────────────────────────────────────

print("=" * 52)
if errors:
    print(f"ERREURS ({len(errors)})")
    for e in errors:
        print(f"  [ERR] {e}")
    print()
else:
    print("  Aucune erreur détectée.")

if warnings:
    print(f"AVERTISSEMENTS ({len(warnings)})")
    for w in warnings:
        print(f"  [WARN] {w}")
    print()

# ── Statistiques ──────────────────────────────────────────────────────────────

print("=" * 52)
print("STATISTIQUES")

by_lang = Counter(e.get("language") for e in json_data)
print(f"  Par langue     : {dict(by_lang)}")

by_register = Counter(e.get("register") for e in json_data)
print(f"  Par register   : {dict(by_register)}")

all_tags = [tag for e in json_data for tag in e.get("tags", [])]
top_tags = Counter(all_tags).most_common(10)
print(f"  Top 10 tags    : {[f'{t}({n})' for t, n in top_tags]}")

print("=" * 52)
if not errors:
    print("Base de données valide.")
else:
    print(f"{len(errors)} erreur(s) à corriger.")

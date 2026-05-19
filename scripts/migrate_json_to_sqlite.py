"""
Migrate expressions.json → expressions.db (SQLite).

Run once from the project root:
    python scripts/migrate_json_to_sqlite.py
"""

import json
import sqlite3
from pathlib import Path

JSON_PATH = Path(__file__).parent.parent / "data" / "expressions.json"
DB_PATH   = Path(__file__).parent.parent / "data" / "expressions.db"


CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS expressions (
    id          TEXT PRIMARY KEY,
    expression  TEXT NOT NULL,
    meaning     TEXT NOT NULL,
    origin      TEXT,
    example     TEXT,
    register    TEXT,
    language    TEXT,
    region      TEXT,
    illustration TEXT,
    tags        TEXT  -- JSON array, e.g. '["animaux", "tristesse"]'
);
"""

INSERT_EXPRESSION = """
INSERT OR REPLACE INTO expressions
    (id, expression, meaning, origin, example, register, language, region, illustration, tags)
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
"""


def migrate() -> None:
    print(f"Source : {JSON_PATH}")
    print(f"Cible  : {DB_PATH}")

    with open(JSON_PATH, encoding="utf-8") as f:
        data: list[dict] = json.load(f)

    print(f"{len(data)} expressions à importer…")

    conn = sqlite3.connect(DB_PATH)
    conn.execute(CREATE_TABLE)

    for expr in data:
        conn.execute(INSERT_EXPRESSION, (
            expr["id"],
            expr["expression"],
            expr["meaning"],
            expr.get("origin"),
            expr.get("example"),
            expr.get("register"),
            expr.get("language"),
            expr.get("region"),
            expr.get("illustration"),
            json.dumps(expr.get("tags", []), ensure_ascii=False),
        ))

    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM expressions").fetchone()[0]
    print(f"Migration terminée : {count} expressions dans la base.")
    conn.close()


if __name__ == "__main__":
    migrate()

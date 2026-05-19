"""
Couche d'accès aux données — SQLite.

Ce fichier est le seul endroit qui "parle" à la base.
main.py appelle ces fonctions sans savoir comment les données sont stockées.
→ Quand on migrera vers PostgreSQL, seul ce fichier changera.
"""

import json
import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "data" / "expressions.db"


def _connect() -> sqlite3.Connection:
    """Ouvre une connexion SQLite avec row_factory pour obtenir des dicts."""
    conn = sqlite3.connect(DB_PATH)
    # row_factory permet de lire les résultats comme des dicts : row["id"] au lieu de row[0]
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convertit une ligne SQLite en dict Python, en désérialisant les tags JSON."""
    d = dict(row)
    # Les tags sont stockés en JSON texte dans SQLite, on les repasse en liste Python
    d["tags"] = json.loads(d["tags"]) if d.get("tags") else []
    return d


# ── Requêtes ──────────────────────────────────────────────────────────────────

def count_expressions() -> dict[str, int]:
    """Retourne le nombre total d'expressions et le décompte par langue."""
    with _connect() as conn:
        total = conn.execute("SELECT COUNT(*) FROM expressions").fetchone()[0]
        rows  = conn.execute(
            "SELECT language, COUNT(*) as n FROM expressions GROUP BY language"
        ).fetchall()
    return {"total": total, "by_language": {r["language"]: r["n"] for r in rows}}


def search_expressions(query: str, regions: Optional[set[str]] = None) -> list[dict]:
    """
    Cherche des expressions par mot-clé.

    Deux types de correspondance, dans cet ordre :
    - "exact"    : le mot apparaît dans le texte de l'expression elle-même
    - "semantic" : le mot apparaît dans le sens, les tags, l'exemple ou l'origine

    regions : ensemble de codes région à inclure (ex: {"fr", "uk"}).
              None ou vide = toutes les régions.
    """
    q = f"%{query.lower().strip()}%"

    # Filtre région : si des régions sont demandées, on ajoute une clause WHERE
    if regions:
        placeholders = ",".join("?" * len(regions))
        region_clause = f"AND region IN ({placeholders})"
        region_params = list(regions)
    else:
        region_clause = ""
        region_params = []

    # Requête "exact" : le mot est dans le texte de l'expression
    exact_sql = f"""
        SELECT * FROM expressions
        WHERE lower(expression) LIKE ?
        {region_clause}
    """

    # Requête "semantic" : le mot est ailleurs, mais PAS dans l'expression (pour éviter les doublons)
    semantic_sql = f"""
        SELECT * FROM expressions
        WHERE lower(expression) NOT LIKE ?
          AND (
              lower(meaning)  LIKE ?
           OR lower(tags)     LIKE ?
           OR lower(example)  LIKE ?
           OR lower(origin)   LIKE ?
          )
        {region_clause}
    """

    with _connect() as conn:
        exact_rows = conn.execute(exact_sql, [q] + region_params).fetchall()
        semantic_rows = conn.execute(
            semantic_sql, [q, q, q, q, q] + region_params
        ).fetchall()

    exact    = [{**_row_to_dict(r), "match_type": "exact"}    for r in exact_rows]
    semantic = [{**_row_to_dict(r), "match_type": "semantic"} for r in semantic_rows]

    return exact + semantic


def get_expression_by_id(expression_id: str) -> Optional[dict]:
    """Retourne une expression par son id, ou None si elle n'existe pas."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM expressions WHERE id = ?", (expression_id,)
        ).fetchone()
    return _row_to_dict(row) if row else None

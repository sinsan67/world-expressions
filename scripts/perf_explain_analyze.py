"""
Audit de performance moteur de recherche — S145
Connexion : .env.prod (Neon PostgreSQL)

Lance EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) sur les 3 requêtes principales :
  1. search_expressions  — 4 passes (exact + semantic + translation + concept)
  2. search_by_concept   — browse par tag
  3. browse_by_region    — browse par pays + filtre type
Identifie les Seq Scan et les nœuds lents (> 10ms).
"""

import os
import sys
import time
from pathlib import Path

# Charge .env.prod AVANT tout import de config
from dotenv import load_dotenv
env_prod = Path(__file__).parent.parent / ".env.prod"
load_dotenv(env_prod, override=True)

from sqlalchemy import create_engine, text  # noqa: E402

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)

# ── Requêtes à mesurer ────────────────────────────────────────────────────────

# 1. search_expressions — requête réaliste : mot commun, locale=fr, sans filtre pays
SEARCH_EXPR_SQL = """
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH base AS (
    SELECT
        e.id, e.text, e.language, e.region, e.country, e.register,
        e.illustration, e.kind, e.source,
        ec.meaning, ec.origin, ec.example,
        STRING_AGG(t.slug, ' ') AS tags_text,
        STRING_AGG(t.slug, ',') AS tags
    FROM expressions e
    LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
    LEFT JOIN expression_tags et ON et.expression_id = e.id
    LEFT JOIN tags t ON t.id = et.tag_id
    WHERE 1=1
      AND NOT EXISTS (
          SELECT 1 FROM expression_tags et_pb
          JOIN tags t_pb ON t_pb.id = et_pb.tag_id
          WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
      )
    GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
             e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
),
exact_pass AS (
    SELECT id, text, language, region, country, register, illustration, kind, source,
           meaning, origin, example, tags_text, tags,
           ts_rank(to_tsvector('french', coalesce(text,'')), plainto_tsquery('french', 'argent')) AS rank,
           1 AS pass_order, 'exact'::text AS match_type
    FROM base
    WHERE to_tsvector('french', coalesce(text,'')) @@ plainto_tsquery('french', 'argent')
),
semantic_pass AS (
    SELECT id, text, language, region, country, register, illustration, kind, source,
           meaning, origin, example, tags_text, tags,
           ts_rank(
             to_tsvector('french', coalesce(meaning,'') || ' ' || coalesce(tags_text,'') || ' ' || coalesce(example,'') || ' ' || coalesce(origin,'')),
             plainto_tsquery('french', 'argent')
           ) AS rank,
           2 AS pass_order, 'semantic'::text AS match_type
    FROM base
    WHERE NOT (to_tsvector('french', coalesce(text,'')) @@ plainto_tsquery('french', 'argent'))
      AND to_tsvector('french', coalesce(meaning,'') || ' ' || coalesce(tags_text,'') || ' ' || coalesce(example,'') || ' ' || coalesce(origin,'')) @@ plainto_tsquery('french', 'argent')
),
translation_pass AS (
    SELECT e.id, e.text, e.language, e.region, e.country, e.register,
           e.illustration, e.kind, e.source,
           ec.meaning, ec.origin, ec.example,
           NULL::text AS tags_text,
           STRING_AGG(t.slug, ',') AS tags,
           0.0::float AS rank, 3 AS pass_order, 'translation'::text AS match_type
    FROM expressions e
    LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
    LEFT JOIN expression_tags et2 ON et2.expression_id = e.id
    LEFT JOIN tags t ON t.id = et2.tag_id
    WHERE EXISTS (
        SELECT 1 FROM content_translations ct
        WHERE ct.expression_id = e.id
          AND to_tsvector('french', coalesce(ct.meaning,'') || ' ' || coalesce(ct.origin,'') || ' ' || coalesce(ct.example,'')) @@ plainto_tsquery('french', 'argent')
    )
      AND NOT EXISTS (
          SELECT 1 FROM expression_tags et_pb
          JOIN tags t_pb ON t_pb.id = et_pb.tag_id
          WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
      )
    AND e.id NOT IN (SELECT id FROM exact_pass)
    AND e.id NOT IN (SELECT id FROM semantic_pass)
    GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
             e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
),
all_results AS (
    SELECT id, text, language, region, country, register, illustration, kind, source,
           meaning, origin, example, tags_text, tags, rank, pass_order, match_type
    FROM exact_pass
    UNION ALL
    SELECT id, text, language, region, country, register, illustration, kind, source,
           meaning, origin, example, tags_text, tags, rank, pass_order, match_type
    FROM semantic_pass
    UNION ALL
    SELECT id, text, language, region, country, register, illustration, kind, source,
           meaning, origin, example, tags_text, tags, rank, pass_order, match_type
    FROM translation_pass
),
counted AS (
    SELECT *, COUNT(*) OVER() AS total_count
    FROM all_results
)
SELECT * FROM counted
ORDER BY pass_order, rank DESC, CASE WHEN kind = 'word' THEN 1 ELSE 0 END, text
LIMIT 20 OFFSET 0
"""

# 2. search_by_concept — tag browse, filtre type=proverb
CONCEPT_SQL = """
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    e.id, e.text, e.language, e.region, e.country, e.register,
    e.illustration, e.kind, e.source,
    ec.meaning, ec.origin, ec.example,
    (SELECT STRING_AGG(t2.slug, ',')
     FROM expression_tags et2
     JOIN tags t2 ON t2.id = et2.tag_id
     WHERE et2.expression_id = e.id) AS tags,
    COUNT(*) OVER() AS total_count
FROM expressions e
LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
WHERE EXISTS (
    SELECT 1 FROM expression_tags et
    JOIN tags t ON t.id = et.tag_id
    WHERE et.expression_id = e.id AND t.slug = ANY(ARRAY['money','argent','wealth','richesse'])
)
  AND e.kind = 'proverb'
  AND NOT EXISTS (
      SELECT 1 FROM expression_tags et_pb
      JOIN tags t_pb ON t_pb.id = et_pb.tag_id
      WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
  )
ORDER BY e.language, CASE WHEN e.kind = 'word' THEN 1 ELSE 0 END, e.text
LIMIT 20 OFFSET 0
"""

# 3. browse_by_region — pays=fr + filtre type=idiom
BROWSE_SQL = """
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    e.id, e.text, e.language, e.region, e.country, e.register,
    e.illustration, e.kind, e.source,
    ec.meaning, ec.origin, ec.example,
    STRING_AGG(t.slug, ',') AS tags
FROM expressions e
LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
LEFT JOIN expression_tags et ON et.expression_id = e.id
LEFT JOIN tags t ON t.id = et.tag_id
WHERE 1=1
  AND e.country = ANY(ARRAY['fr'])
  AND e.kind = 'idiom'
  AND NOT EXISTS (
      SELECT 1 FROM expression_tags et_pb
      JOIN tags t_pb ON t_pb.id = et_pb.tag_id
      WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
  )
GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
         e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
ORDER BY RANDOM()
LIMIT 20 OFFSET 0
"""

# 4. Vérification des index existants sur les colonnes critiques
INDEX_SQL = """
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('expressions', 'expression_content', 'expression_tags', 'tags', 'content_translations', 'tag_names')
ORDER BY tablename, indexname;
"""

# ── Exécution ─────────────────────────────────────────────────────────────────

def run_explain(conn, name: str, sql: str) -> str:
    print(f"\n{'='*70}")
    print(f"  {name}")
    print('='*70)
    t0 = time.perf_counter()
    rows = conn.execute(text(sql)).fetchall()
    elapsed = time.perf_counter() - t0
    plan = "\n".join(r[0] for r in rows)
    print(plan)
    # Extraire le temps d'exécution depuis le plan
    for line in plan.splitlines():
        if "Execution Time" in line or "Planning Time" in line:
            print(f"  [{name}] {line.strip()}")
    # Détecter les Seq Scan
    seq_scans = [l.strip() for l in plan.splitlines() if "Seq Scan" in l]
    if seq_scans:
        print(f"\n  ⚠️  Seq Scan détecté ({len(seq_scans)} occurrence(s)):")
        for s in seq_scans:
            print(f"    → {s}")
    else:
        print(f"\n  ✅ Aucun Seq Scan")
    print(f"  [round-trip Python] {elapsed*1000:.1f} ms")
    return plan


def show_indexes(conn):
    print(f"\n{'='*70}")
    print("  INDEX EXISTANTS (tables critiques)")
    print('='*70)
    rows = conn.execute(text(INDEX_SQL)).fetchall()
    current_table = None
    for r in rows:
        if r.tablename != current_table:
            current_table = r.tablename
            print(f"\n  [{r.tablename}]")
        print(f"    {r.indexname}")
        print(f"      {r.indexdef}")


def main():
    print(f"Connexion à Neon prod...")
    with engine.connect() as conn:
        show_indexes(conn)
        run_explain(conn, "1. search_expressions (query='argent', no filter)", SEARCH_EXPR_SQL)
        run_explain(conn, "2. search_by_concept (tags money/argent, type=proverb)", CONCEPT_SQL)
        run_explain(conn, "3. browse_by_region (country=fr, type=idiom)", BROWSE_SQL)
    print(f"\n{'='*70}")
    print("  Audit terminé.")
    print('='*70)


if __name__ == "__main__":
    main()

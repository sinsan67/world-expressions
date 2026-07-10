"""
Couche d'accès aux données — PostgreSQL via SQLAlchemy.

Ce fichier est le seul endroit qui "parle" à la base.
main.py appelle ces fonctions sans savoir comment les données sont stockées.

Le schéma PostgreSQL a 5 tables (expressions, expression_content, tags, tag_names, expression_tags).
Ce fichier les assemble et retourne des dicts au même format qu'avant,
pour que main.py et le frontend n'aient pas besoin de changer.
"""

import hashlib
import json
import os
import random
import re
import secrets
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Optional

import bcrypt
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from config import engine


def _build_expression_dict(row, match_type: str) -> dict:
    """
    Construit un dict standard depuis une ligne de résultat SQL.
    Les tags sont retournés en liste Python.
    Le champ 'expression' (nom historique) correspond à 'text' dans la nouvelle table.
    """
    tags_raw = row.tags or ""
    # Les tags sont agrégés en une chaîne "tag1,tag2,tag3" par la requête SQL
    tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]

    return {
        "id":           row.id,
        "expression":   row.text,       # renommé 'text' en base, mais 'expression' dans l'API
        "meaning":      row.meaning or "",
        "origin":       row.origin or "",
        "example":      row.example or "",
        "register":     row.register or "",
        "tags":         tags_list,
        "region":       row.region or "",
        "country":      getattr(row, "country", None) or row.language or "",
        "illustration": row.illustration,
        "language":     row.language or "",
        "type":         getattr(row, "kind", "idiom") or "idiom",
        "source":       getattr(row, "source", None),
        "match_type":   match_type,
    }


def _get_preferred_content(ids: list, locale: str, conn) -> dict:
    """
    Batch-fetches meaning/origin/example/literal in the preferred locale for a list of expression IDs.
    expression_content takes priority over content_translations.
    Returns {expression_id: {meaning, origin, example, literal}}.
    """
    if not ids or not locale:
        return {}
    result: dict = {}
    for row in conn.execute(text("""
        SELECT expression_id, meaning, origin, example, literal FROM content_translations
        WHERE expression_id = ANY(:ids) AND target_lang = :locale
    """), {"ids": ids, "locale": locale}).fetchall():
        result[row.expression_id] = {"meaning": row.meaning, "origin": row.origin, "example": row.example, "literal": row.literal}
    for row in conn.execute(text("""
        SELECT expression_id, meaning, origin, example FROM expression_content
        WHERE expression_id = ANY(:ids) AND locale = :locale
    """), {"ids": ids, "locale": locale}).fetchall():
        # expression_content rows: same language, no literal needed
        result[row.expression_id] = {"meaning": row.meaning, "origin": row.origin, "example": row.example, "literal": None}
    return result


def _region_clause(regions: Optional[set[str]]) -> tuple[str, dict]:
    """Filtre par sous-région (alsace, bretagne). Filtre sur la colonne `region`."""
    if regions:
        return "AND e.region = ANY(:regions)", {"regions": list(regions)}
    return "", {}


def _country_clause(countries: Optional[set[str]]) -> tuple[str, dict]:
    """Filtre par pays d'origine. Filtre sur la colonne `country`."""
    if countries:
        return "AND e.country = ANY(:countries)", {"countries": list(countries)}
    return "", {}


def _language_clause(languages: Optional[set[str]]) -> tuple[str, dict]:
    """Filtre par langue source (e.language)."""
    if languages:
        return "AND e.language = ANY(:languages)", {"languages": list(languages)}
    return "", {}


def _type_clause(type_filter: Optional[str]) -> tuple[str, dict]:
    """Retourne un fragment SQL pour filtrer par type d'expression (idiom, proverb, locution, word)."""
    if type_filter:
        return ' AND e.kind = :type_filter', {"type_filter": type_filter}
    return "", {}


_EXCLUDE_PHRASEBOOK = """
    AND NOT EXISTS (
        SELECT 1 FROM expression_tags et_pb
        JOIN tags t_pb ON t_pb.id = et_pb.tag_id
        WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
    )"""


# ── Requêtes ──────────────────────────────────────────────────────────────────

META_TAGS = {"australian", "british", "slang", "proverb", "communication"}

def get_top_tags(limit: int = 30, language: Optional[str] = None, locale: Optional[str] = None) -> list[dict]:
    """
    Retourne les tags les plus représentés, hors méta-tags.
    Si `language` est fourni (fr/en/es), filtre sur les expressions de cette langue.
    Si `locale` est fourni, retourne le nom localisé du tag (via tag_names) ; sinon retourne le slug.
    """
    lang_clause = "AND e.language = :language" if language else ""
    sql = f"""
        SELECT t.slug, COUNT(et.expression_id) AS n,
               COALESCE(tn.name, t.slug) AS display_name
        FROM tags t
        JOIN expression_tags et ON et.tag_id = t.id
        JOIN expressions e ON e.id = et.expression_id
        LEFT JOIN tag_names tn ON tn.tag_id = t.id AND tn.locale = :locale
        WHERE NOT (t.slug = ANY(:meta_tags))
          {lang_clause}
          AND NOT EXISTS (
              SELECT 1 FROM expression_tags et_pb
              JOIN tags t_pb ON t_pb.id = et_pb.tag_id
              WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
          )
        GROUP BY t.slug, tn.name
        ORDER BY n DESC
        LIMIT :limit
    """
    params: dict = {"meta_tags": list(META_TAGS), "limit": limit, "locale": locale or "en"}
    if language:
        params["language"] = language
    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()
    return [{"slug": r.slug, "count": r.n, "name": r.display_name} for r in rows]


# Filtres partagés entre le tirage aléatoire et son comptage : les deux requêtes
# DOIVENT rester identiques pour que le compteur affiché corresponde au pool réel.
_RANDOM_POOL_WHERE = """
        WHERE e.kind != 'word'
          AND (:country = '' OR COALESCE(e.country, e.language) = :country)
          AND (:kind = '' OR e.kind = :kind)
          AND (:language = '' OR e.language = :language)
          AND (:domain = '' OR EXISTS (
              SELECT 1 FROM expression_tags et_d
              JOIN concept_domains cd ON cd.tag_id = et_d.tag_id
              WHERE et_d.expression_id = e.id AND cd.domain_slug = :domain
          ))
          AND NOT EXISTS (
              SELECT 1 FROM expression_tags et_pb
              JOIN tags t_pb ON t_pb.id = et_pb.tag_id
              WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
          )
"""


def count_random_pool(country: str = "", kind: str = "", domain: str = "", language: str = "") -> int:
    """Compte les expressions éligibles au tirage /random pour ces filtres.
    Alimente le compteur « N cartes » du Random mode. `language` (pivot S196) sert le
    compteur « 31 / 2 438 » de la collection et le compteur de pool du setup Voyage."""
    sql = f"SELECT COUNT(*) FROM expressions e {_RANDOM_POOL_WHERE}"
    with engine.connect() as conn:
        row = conn.execute(text(sql), {"country": country, "kind": kind, "domain": domain, "language": language}).fetchone()
    return int(row[0]) if row else 0


# Chargement d'une expression complète par PK — pas d'ORDER BY, lookup direct.
# Double LEFT JOIN : ec_orig = contenu dans la langue de l'expression,
# ec_pref = contenu dans la locale demandée (peut être NULL si pas encore traduit).
# COALESCE prend ec_pref en priorité, sinon ec_orig.
# Partagé par get_random_expression et get_daily_expression (même shape de réponse).
_EXPRESSION_BY_ID_SQL = """
    SELECT
        e.id,
        e.text,
        e.language,
        e.region,
        e.country,
        e.register,
        e.illustration,
        e.kind,
        e.source,
        COALESCE(ec_pref.meaning, ct_pref.meaning, ec_orig.meaning)   AS meaning,
        COALESCE(ec_pref.origin,  ct_pref.origin,  ec_orig.origin)    AS origin,
        COALESCE(ec_pref.example, ct_pref.example, ec_orig.example)   AS example,
        CASE WHEN ec_pref.meaning IS NOT NULL OR ct_pref.meaning IS NOT NULL
             THEN :locale ELSE e.language END         AS meaning_locale,
        ct_pref.literal                              AS literal,
        STRING_AGG(t.slug, ',') AS tags
    FROM expressions e
    LEFT JOIN expression_content ec_orig
        ON ec_orig.expression_id = e.id AND ec_orig.locale = e.language
    LEFT JOIN expression_content ec_pref
        ON ec_pref.expression_id = e.id AND ec_pref.locale = :locale
    LEFT JOIN content_translations ct_pref
        ON ct_pref.expression_id = e.id AND ct_pref.target_lang = :locale
    LEFT JOIN expression_tags et ON et.expression_id = e.id
    LEFT JOIN tags t ON t.id = et.tag_id
    WHERE e.id = :expr_id
    GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
             e.illustration, e.kind, e.source,
             ec_orig.meaning, ec_orig.origin, ec_orig.example,
             ec_pref.meaning, ec_pref.origin, ec_pref.example,
             ct_pref.meaning, ct_pref.origin, ct_pref.example, ct_pref.literal
"""


def _fetch_expression_by_id(conn, expr_id: str, locale: str, match_type: str) -> Optional[dict]:
    """Loads one expression by PK, localized to `locale` when available. Shared helper for
    /random and /daily (identical response shape, contract §3)."""
    row = conn.execute(text(_EXPRESSION_BY_ID_SQL), {"locale": locale, "expr_id": expr_id}).fetchone()
    if not row:
        return None
    result = _build_expression_dict(row, match_type)
    result["meaning_locale"] = row.meaning_locale
    result["literal"] = getattr(row, "literal", None)
    return result


def get_random_expression(
    locale: Optional[str] = None,
    country: str = "",
    kind: str = "",
    domain: str = "",
) -> Optional[dict]:
    """
    Retourne une expression au hasard (toutes langues).
    Si `locale` est fourni, essaie de servir le sens dans cette locale.
    `country` restreint le tirage à un pays (même convention COALESCE que /neighbors),
    `kind` à un type d'expression (idiom/proverb/locution),
    `domain` à un domaine thématique (slug de concept_domains). Vides = pas de filtre.
    Retourne aussi `meaning_locale` pour que le frontend sache dans quelle langue est le sens.

    Optimisation perf : ORDER BY RANDOM() en deux étapes.
    Étape 1 — trie uniquement la colonne id (table légère, pas de JOIN).
    Étape 2 — charge l'expression complète par PK (lookup direct, pas de tri).
    Évite de trier des milliers de lignes multi-colonnes jointes à chaque appel.
    """
    effective_locale = locale or ""

    # Étape 1 : ID aléatoire sur la table légère, sans JOINs
    id_sql = f"""
        SELECT e.id FROM expressions e
        {_RANDOM_POOL_WHERE}
        ORDER BY RANDOM()
        LIMIT 1
    """

    with engine.connect() as conn:
        id_row = conn.execute(text(id_sql), {"country": country, "kind": kind, "domain": domain, "language": ""}).fetchone()
        if not id_row:
            return None
        return _fetch_expression_by_id(conn, id_row.id, effective_locale, "direct")


def get_daily_expression(locale: Optional[str] = None) -> Optional[dict]:
    """
    Expression du jour — pivot games hub (contract §3, lot A).
    Tirage déterministe : seedé par la date UTC (même résultat pour tout le monde,
    toute la journée). Pool : tous kinds/pays, SAUF langue 'ja' (JA cassé — Luke L3).
    Retourne la même forme que /random, plus `date` (YYYY-MM-DD).
    """
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    effective_locale = locale or ""

    with engine.connect() as conn:
        ids = [r[0] for r in conn.execute(text(
            "SELECT id FROM expressions WHERE language != 'ja' ORDER BY id"
        )).fetchall()]
        if not ids:
            return None
        seed = int(hashlib.sha256(date_str.encode("utf-8")).hexdigest(), 16)
        expr_id = ids[seed % len(ids)]
        result = _fetch_expression_by_id(conn, expr_id, effective_locale, "daily")

    if result is None:
        return None
    result["date"] = date_str
    return result


def count_expressions() -> dict[str, int]:
    """Retourne le nombre total d'expressions et le décompte par langue."""
    with engine.connect() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM expressions")).scalar()
        rows = conn.execute(
            text("SELECT language, COUNT(*) AS n FROM expressions GROUP BY language ORDER BY n DESC")
        ).fetchall()
    return {
        "total": total,
        "by_language": {r.language: r.n for r in rows}
    }


def get_regions() -> list[dict]:
    """Retourne les sous-régions (alsace, bretagne) avec leur nombre d'expressions."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT region, COUNT(*) AS n FROM expressions WHERE region IS NOT NULL GROUP BY region ORDER BY n DESC")
        ).fetchall()
    return [{"code": r.region, "count": r.n} for r in rows]


def get_countries() -> list[dict]:
    """Retourne les pays réels avec au moins 10 expressions, triés par count desc.
    Joints avec country_languages pour retourner la liste des langues par pays."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT e.country, COUNT(*) AS n,
                       array_agg(DISTINCT cl.language_code ORDER BY cl.language_code) AS languages
                FROM expressions e
                LEFT JOIN country_languages cl ON cl.country_code = e.country
                WHERE e.country IS NOT NULL
                GROUP BY e.country
                HAVING COUNT(*) >= 10
                ORDER BY n DESC
            """)
        ).fetchall()
    return [{"code": r.country, "count": r.n, "languages": r.languages or []} for r in rows]


# Language code → PostgreSQL stemming dictionary (Snowball).
# 'simple' = no stemming (lowercase only). Used as fallback and for CJK (handled by trgm).
_PG_DICT: dict[str, str] = {
    "fr": "french",
    "en": "english",
    "es": "spanish",
    "it": "italian",
    "de": "german",
    "tr": "turkish",
}


def _pg_dict(locale: Optional[str]) -> str:
    return _PG_DICT.get(locale or "", "simple")


def _build_fts_fragments(pg_dict: str) -> tuple[str, str, str]:
    """Returns (tsq, text_vec, content_vec) SQL fragments for the given PG dictionary."""
    tsq = f"websearch_to_tsquery('{pg_dict}', :q)"
    text_vec = f"to_tsvector('{pg_dict}', text)"
    content_vec = f"""to_tsvector('{pg_dict}',
            coalesce(meaning, '') || ' ' || coalesce(origin, '') || ' ' ||
            coalesce(example, '') || ' ' || coalesce(tags_text, ''))"""
    return tsq, text_vec, content_vec


# CJK Unicode blocks: CJK Unified Ideographs, Hiragana, Katakana, Hangul, etc.
_CJK_RE = re.compile(r'[　-鿿ꀀ-꒏가-힯豈-﫿゠-ヿ぀-ゟ]')


def _is_cjk_query(query: str) -> bool:
    """Returns True if query contains Japanese/Chinese/Korean characters."""
    return bool(_CJK_RE.search(query))


def _find_matching_tag_slugs(query: str) -> set[str]:
    """
    Returns tag slugs where the slug or any localized tag name matches the query (case-insensitive exact).
    Also matches multi-word slugs when the query uses spaces instead of hyphens
    (e.g. "village life" matches slug "village-life").
    """
    sql = """
        SELECT DISTINCT t.slug FROM tags t
        LEFT JOIN tag_names tn ON tn.tag_id = t.id
        WHERE LOWER(t.slug) = LOWER(:q)
           OR LOWER(tn.name) = LOWER(:q)
           OR LOWER(REPLACE(t.slug, '-', ' ')) = LOWER(:q)
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"q": query.strip()}).fetchall()
    return {r.slug for r in rows}


def search_expressions(query: str, regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None, locale: Optional[str] = None, languages: Optional[set[str]] = None, countries: Optional[set[str]] = None) -> tuple[list[dict], int]:
    """
    Cherche des expressions par mot-clé.

    Quatre types de correspondance, retournés dans cet ordre :
    1. "exact"       : le mot apparaît dans le texte de l'expression (FTS sur expressions.text)
    2. "semantic"    : le mot apparaît dans le sens/tags/exemple/origine (FTS sur expression_content)
    3. "translation" : le mot apparaît dans une traduction (content_translations, toutes langues cibles)
    4. "concept"     : le mot correspond à un tag slug ou un nom de tag localisé (tag_names)

    LIMIT/OFFSET appliqués en SQL via CTE unifiée + COUNT(*) OVER() — pas de slice Python.
    """
    region_sql, region_params = _region_clause(regions)
    country_sql, country_params = _country_clause(countries)
    lang_sql, lang_params = _language_clause(languages)
    type_sql, type_params = _type_clause(type_filter)

    # Python lookup first: needed to conditionally build the concept CTE
    matching_tags = _find_matching_tag_slugs(query)

    # For CJK queries (Japanese etc.) tsvector/tsquery doesn't tokenise properly —
    # use pg_trgm ILIKE instead, backed by GIN trgm indexes.
    cjk = _is_cjk_query(query)
    if cjk:
        _exact_rank = "1.0::float"
        _exact_where = "text ILIKE :q_trgm"
        _sem_rank = "0.8::float"
        _sem_where = ("text NOT ILIKE :q_trgm AND ("
                      "coalesce(meaning,'') ILIKE :q_trgm OR "
                      "coalesce(origin,'') ILIKE :q_trgm OR "
                      "coalesce(example,'') ILIKE :q_trgm OR "
                      "coalesce(tags_text,'') ILIKE :q_trgm)")
        _trans_where = ("ct.meaning ILIKE :q_trgm OR "
                        "coalesce(ct.origin,'') ILIKE :q_trgm OR "
                        "coalesce(ct.example,'') ILIKE :q_trgm")
        cjk_params: dict = {"q_trgm": f"%{query.strip()}%"}
        _semantic_cte = f"""semantic_pass AS (
            SELECT
                id, text, language, region, country, register, illustration, kind, source,
                meaning, origin, example, tags_text, tags,
                {_sem_rank} AS rank,
                2 AS pass_order, 'semantic'::text AS match_type
            FROM base
            WHERE {_sem_where}
        )"""
    else:
        _dict = _pg_dict(locale)
        _tsq, _text_vec, _content_vec = _build_fts_fragments(_dict)
        _exact_rank = f"ts_rank({_text_vec}, {_tsq})"
        _exact_where = f"{_text_vec} @@ {_tsq}"
        _trans_where = ("to_tsvector('simple', coalesce(ct.meaning,'') || ' ' || "
                        "coalesce(ct.origin,'') || ' ' || coalesce(ct.example,'')) "
                        "@@ websearch_to_tsquery('simple', :q)")
        cjk_params = {}
        # Semantic pass queries expression_content directly via idx_expression_content_fts ('simple'),
        # bypassing the materialized base CTE to avoid an on-the-fly tsvector on 14K rows.
        _semantic_cte = f"""semantic_pass AS (
            SELECT
                e.id, e.text, e.language, e.region, e.country, e.register,
                e.illustration, e.kind, e.source,
                ec.meaning, ec.origin, ec.example,
                NULL::text AS tags_text,
                (SELECT STRING_AGG(t2.slug, ',')
                 FROM expression_tags et2 JOIN tags t2 ON t2.id = et2.tag_id
                 WHERE et2.expression_id = e.id) AS tags,
                ts_rank(
                    to_tsvector('simple', coalesce(ec.meaning,'') || ' ' || coalesce(ec.origin,'') || ' ' || coalesce(ec.example,'')),
                    websearch_to_tsquery('simple', :q)
                ) AS rank,
                2 AS pass_order, 'semantic'::text AS match_type
            FROM expression_content ec
            JOIN expressions e ON e.id = ec.expression_id AND e.language = ec.locale
            WHERE to_tsvector('simple', coalesce(ec.meaning,'') || ' ' || coalesce(ec.origin,'') || ' ' || coalesce(ec.example,''))
                  @@ websearch_to_tsquery('simple', :q)
              AND NOT (to_tsvector('simple', e.text) @@ websearch_to_tsquery('simple', :q))
              {region_sql}{country_sql}{lang_sql}{_EXCLUDE_PHRASEBOOK}{type_sql}
              AND e.id NOT IN (SELECT id FROM exact_pass)
        )"""

    concept_cte_sql = ""
    concept_union_sql = ""
    concept_params: dict = {}
    if matching_tags:
        concept_cte_sql = """
        , concept_pass AS (
            SELECT
                e.id, e.text, e.language, e.region, e.country, e.register,
                e.illustration, e.kind, e.source,
                ec.meaning, ec.origin, ec.example,
                NULL::text AS tags_text,
                (SELECT STRING_AGG(t2.slug, ',')
                 FROM expression_tags et2 JOIN tags t2 ON t2.id = et2.tag_id
                 WHERE et2.expression_id = e.id) AS tags,
                0.0::float AS rank, 4 AS pass_order, 'concept'::text AS match_type
            FROM expressions e
            LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
            WHERE EXISTS (
                SELECT 1 FROM expression_tags et JOIN tags t ON t.id = et.tag_id
                WHERE et.expression_id = e.id AND t.slug = ANY(:tag_set)
            )
            {region_clause}{country_clause}{lang_clause}{exclude_phrasebook}{type_clause}
            AND e.id NOT IN (SELECT id FROM exact_pass)
            AND e.id NOT IN (SELECT id FROM semantic_pass)
            AND e.id NOT IN (SELECT id FROM translation_pass)
        )""".format(region_clause=region_sql, country_clause=country_sql, lang_clause=lang_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)
        concept_union_sql = """
            UNION ALL
            SELECT id, text, language, region, country, register, illustration, kind, source,
                   meaning, origin, example, tags_text, tags, rank, pass_order, match_type
            FROM concept_pass"""
        concept_params = {"tag_set": list(matching_tags)}

    sql = f"""
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
            WHERE 1=1 {region_sql}{country_sql}{lang_sql}{_EXCLUDE_PHRASEBOOK}{type_sql}
            GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                     e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ),
        exact_pass AS (
            SELECT
                id, text, language, region, country, register, illustration, kind, source,
                meaning, origin, example, tags_text, tags,
                {_exact_rank} AS rank,
                1 AS pass_order, 'exact'::text AS match_type
            FROM base
            WHERE {_exact_where}
        ),
        {_semantic_cte},
        translation_pass AS (
            SELECT
                e.id, e.text, e.language, e.region, e.country, e.register,
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
                  AND ({_trans_where})
            )
            {region_sql}{country_sql}{lang_sql}{_EXCLUDE_PHRASEBOOK}{type_sql}
            AND e.id NOT IN (SELECT id FROM exact_pass)
            AND e.id NOT IN (SELECT id FROM semantic_pass)
            GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                     e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ){concept_cte_sql},
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
            {concept_union_sql}
        ),
        counted AS (
            SELECT *, COUNT(*) OVER() AS total_count
            FROM all_results
        )
        SELECT * FROM counted
        ORDER BY pass_order, rank DESC, CASE WHEN kind = 'word' THEN 1 ELSE 0 END, text
        LIMIT :limit OFFSET :offset
    """

    params = {"q": query.strip(), "limit": limit, "offset": offset,
              **region_params, **country_params, **lang_params, **type_params, **concept_params, **cjk_params}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    if not rows:
        return [], 0, matching_tags

    total = rows[0].total_count
    results = [_build_expression_dict(r, r.match_type) for r in rows]

    if locale and locale.strip():
        with engine.connect() as conn:
            preferred = _get_preferred_content([r["id"] for r in results], locale, conn)
        for r in results:
            if r["id"] in preferred:
                p = preferred[r["id"]]
                if p["meaning"]: r["meaning"] = p["meaning"]
                if p["origin"]:  r["origin"]  = p["origin"]
                if p["example"]: r["example"] = p["example"]
                r["literal"] = p.get("literal")

    return results, total, matching_tags


def search_by_concept(tag_set: set[str], regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None, locale: Optional[str] = None, languages: Optional[set[str]] = None, countries: Optional[set[str]] = None, random_order: bool = False) -> tuple[list[dict], int]:
    """
    Retourne toutes les expressions ayant au moins un tag parmi tag_set (logique OR).
    Utilisé pour la recherche cross-lingue par concept (argent + money + wealth...).
    LIMIT/OFFSET appliqués en SQL + COUNT(*) OVER() pour le total — pas de slice Python.
    """
    region_sql, region_params = _region_clause(regions)
    country_sql, country_params = _country_clause(countries)
    lang_sql, lang_params = _language_clause(languages)
    type_sql, type_params = _type_clause(type_filter)

    sql = """
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
            WHERE et.expression_id = e.id AND t.slug = ANY(:tag_set)
        )
        {region_clause}{country_clause}{lang_clause}{exclude_phrasebook}{type_clause}
        ORDER BY {order_clause}
        LIMIT :limit OFFSET :offset
    """.format(region_clause=region_sql, country_clause=country_sql, lang_clause=lang_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql, order_clause="RANDOM()" if random_order else "e.language, CASE WHEN e.kind = 'word' THEN 1 ELSE 0 END, e.text")

    params = {"tag_set": list(tag_set), **region_params, **country_params, **lang_params, **type_params, "limit": limit, "offset": offset}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    total = rows[0].total_count if rows else 0
    results = [_build_expression_dict(r, "tag") for r in rows]

    if locale and locale.strip():
        with engine.connect() as conn:
            preferred = _get_preferred_content([r["id"] for r in results], locale, conn)
        for r in results:
            if r["id"] in preferred:
                p = preferred[r["id"]]
                if p["meaning"]: r["meaning"] = p["meaning"]
                if p["origin"]:  r["origin"]  = p["origin"]
                if p["example"]: r["example"] = p["example"]
                r["literal"] = p.get("literal")

    return results, total


def browse_by_region(regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None, locale: Optional[str] = None, languages: Optional[set[str]] = None, countries: Optional[set[str]] = None) -> tuple[list[dict], int]:
    """Retourne toutes les expressions d'une ou plusieurs régions/pays, dans un ordre aléatoire."""
    region_sql, region_params = _region_clause(regions)
    country_sql, country_params = _country_clause(countries)
    lang_sql, lang_params = _language_clause(languages)
    type_sql, type_params = _type_clause(type_filter)

    sql = """
        SELECT
            e.id, e.text, e.language, e.region, e.country, e.register,
            e.illustration, e.kind, e.source,
            ec.meaning, ec.origin, ec.example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE 1=1 {region_clause}{country_clause}{lang_clause}{exclude_phrasebook}{type_clause}
        GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                 e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ORDER BY RANDOM()
        LIMIT :limit OFFSET :offset
    """.format(region_clause=region_sql, country_clause=country_sql, lang_clause=lang_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)

    count_sql = """
        SELECT COUNT(*) FROM expressions e WHERE 1=1 {region_clause}{country_clause}{lang_clause}{exclude_phrasebook}{type_clause}
    """.format(region_clause=region_sql, country_clause=country_sql, lang_clause=lang_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)

    params = {**region_params, **country_params, **lang_params, **type_params, "limit": limit, "offset": offset}
    count_params = {**region_params, **country_params, **lang_params, **type_params}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()
        total = conn.execute(text(count_sql), count_params).scalar() or 0

    results = [_build_expression_dict(r, "browse") for r in rows]

    if locale and locale.strip():
        with engine.connect() as conn:
            preferred = _get_preferred_content([r["id"] for r in results], locale, conn)
        for r in results:
            if r["id"] in preferred:
                p = preferred[r["id"]]
                if p["meaning"]: r["meaning"] = p["meaning"]
                if p["origin"]:  r["origin"]  = p["origin"]
                if p["example"]: r["example"] = p["example"]
                r["literal"] = p.get("literal")

    return results, total


def browse_by_ids(ids: list[str], locale: Optional[str] = None) -> list[dict]:
    """
    Hydrate une liste précise d'ids (contract §3 — /browse?ids=). Bypasse pagination et
    filtres : sert à charger en un seul appel les cartes d'une session de jeu ou les lignes
    de la collection (❤️ favoris). Ordre de retour = ordre des ids en entrée ; les ids
    inconnus sont silencieusement ignorés.
    """
    if not ids:
        return []
    sql = """
        SELECT
            e.id, e.text, e.language, e.region, e.country, e.register,
            e.illustration, e.kind, e.source,
            ec.meaning, ec.origin, ec.example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE e.id = ANY(:ids)
        GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                 e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"ids": ids}).fetchall()
    by_id = {r.id: _build_expression_dict(r, "browse") for r in rows}

    if locale and locale.strip():
        with engine.connect() as conn:
            preferred = _get_preferred_content(list(by_id.keys()), locale, conn)
        for eid, r in by_id.items():
            if eid in preferred:
                p = preferred[eid]
                if p["meaning"]: r["meaning"] = p["meaning"]
                if p["origin"]:  r["origin"]  = p["origin"]
                if p["example"]: r["example"] = p["example"]
                r["literal"] = p.get("literal")

    return [by_id[i] for i in ids if i in by_id]


def get_facets(
    countries: Optional[set[str]] = None,
    query: Optional[str] = None,
    type_filter: Optional[str] = None,
    domain: Optional[str] = None,
    locale: Optional[str] = None,
    concept: Optional[str] = None,
) -> dict:
    """
    Retourne les comptages par pays et par type pour les filtres facettés.
    - country: tous pays, type_filter appliqué, sans filtre pays
    - kind: tous types, filtre pays appliqué, sans filtre type
    Chaque facette est calculée en excluant son propre filtre (comportement standard faceted search).
    Si query est fourni, les comptages sont filtrés par FTS approximatif (text + meaning).
    Si domain est fourni, seules les expressions du domaine sont comptées.
    """
    country_sql = "AND e.country = ANY(:countries_f)" if countries else ""
    type_sql = "AND e.kind = :type_filter_f" if type_filter else ""
    domain_sql = """AND EXISTS (
            SELECT 1 FROM expression_tags et_d
            JOIN concept_domains cd ON cd.tag_id = et_d.tag_id
            WHERE et_d.expression_id = e.id AND cd.domain_slug = :domain_f
        )""" if domain else ""

    concept_sql = """AND EXISTS (
            SELECT 1 FROM expression_tags et_c
            JOIN tags t_c ON t_c.id = et_c.tag_id
            WHERE et_c.expression_id = e.id AND t_c.slug = :concept_f
        )""" if concept else ""

    fts_join = ""
    fts_cond = ""
    fts_params: dict = {}
    if query and query.strip():
        fts_join = "\n        LEFT JOIN expression_content ec_f ON ec_f.expression_id = e.id AND ec_f.locale = e.language"
        if _is_cjk_query(query):
            fts_cond = """ AND (
                e.text ILIKE :q_trgm_f
                OR coalesce(ec_f.meaning,'') ILIKE :q_trgm_f
                OR coalesce(ec_f.example,'') ILIKE :q_trgm_f
            )"""
            fts_params = {"q_trgm_f": f"%{query.strip()}%"}
        else:
            _dict_f = _pg_dict(locale)
            fts_cond = f""" AND (
                to_tsvector('{_dict_f}', e.text) @@ websearch_to_tsquery('{_dict_f}', :q_f)
                OR to_tsvector('{_dict_f}', coalesce(ec_f.meaning,'') || ' ' || coalesce(ec_f.example,''))
                   @@ websearch_to_tsquery('{_dict_f}', :q_f)
            )"""
            fts_params = {"q_f": query.strip()}

    sql_country = f"""
        SELECT e.country, COUNT(DISTINCT e.id) AS n
        FROM expressions e {fts_join}
        WHERE 1=1 {_EXCLUDE_PHRASEBOOK} {type_sql} {domain_sql} {concept_sql} {fts_cond}
        GROUP BY e.country
    """

    sql_kind = f"""
        SELECT e.kind, COUNT(DISTINCT e.id) AS n
        FROM expressions e {fts_join}
        WHERE 1=1 {_EXCLUDE_PHRASEBOOK} {country_sql} {domain_sql} {concept_sql} {fts_cond}
        GROUP BY e.kind
    """

    # Comptages par sous-région (bretagne, alsace…), filtrés par type/domaine/requête
    # comme la facette pays. Permet d'afficher des chiffres dynamiques sur le filtre
    # imbriqué pays → région. Clé "subregion" additive : un client qui l'ignore n'est
    # pas affecté.
    sql_subregion = f"""
        SELECT e.region, COUNT(DISTINCT e.id) AS n
        FROM expressions e {fts_join}
        WHERE 1=1 {_EXCLUDE_PHRASEBOOK} {type_sql} {domain_sql} {concept_sql} {fts_cond}
          AND e.region IS NOT NULL
        GROUP BY e.region
    """

    domain_params = {"domain_f": domain} if domain else {}
    concept_params = {"concept_f": concept} if concept else {}

    params_country = ({**{"type_filter_f": type_filter}} if type_filter else {})
    params_country.update(fts_params)
    params_country.update(domain_params)
    params_country.update(concept_params)

    params_kind = ({**{"countries_f": list(countries)}} if countries else {})
    params_kind.update(fts_params)
    params_kind.update(domain_params)
    params_kind.update(concept_params)

    # même filtrage que la facette pays (type + domaine + requête)
    params_subregion = dict(params_country)

    with engine.connect() as conn:
        country_rows = conn.execute(text(sql_country), params_country).fetchall()
        kind_rows = conn.execute(text(sql_kind), params_kind).fetchall()
        subregion_rows = conn.execute(text(sql_subregion), params_subregion).fetchall()

    return {
        "region": {r.country: r.n for r in country_rows if r.country},
        "kind": {r.kind: r.n for r in kind_rows if r.kind},
        "subregion": {r.region: r.n for r in subregion_rows if r.region},
    }


def get_translation(expression_id: str, target_lang: str) -> Optional[dict]:
    """Retourne la traduction d'une expression dans target_lang, ou None si elle n'existe pas encore."""
    sql = """
        SELECT meaning, literal, idiomatic, origin, example
        FROM content_translations
        WHERE expression_id = :id AND target_lang = :lang
    """
    with engine.connect() as conn:
        row = conn.execute(text(sql), {"id": expression_id, "lang": target_lang}).fetchone()
    if not row:
        return None
    return {
        "meaning":  row.meaning,
        "literal":  row.literal,
        "idiomatic": row.idiomatic,
        "origin":   row.origin,
        "example":  row.example,
    }


def get_expression_neighbors(
    expression_id: str,
    mode: str,
    country: str = "",
    tag: str = "",
    kind: str = "",
) -> dict:
    """
    Returns two random neighbor expressions for ‹/› floating navigation.
    mode: 'country_type' | 'random' | 'country' | 'tag'
    Falls back: country_type → country → random.
    """

    def _row_to_neighbor(row) -> dict:
        return {
            "id": row.id,
            "expression": row.expression,
            "language": row.language,
            "country": row.country or row.language,
        }

    with engine.connect() as conn:
        # Country+type mode: same country AND same kind
        if mode == "country_type" and country and kind:
            rows = conn.execute(
                text("""
                    SELECT e.id, e.text AS expression, e.language, e.country
                    FROM expressions e
                    WHERE COALESCE(e.country, e.language) = :country AND e.kind = :kind AND e.id != :id
                    ORDER BY RANDOM() LIMIT 2
                """),
                {"country": country, "kind": kind, "id": expression_id},
            ).fetchall()
            if rows:
                ns = [_row_to_neighbor(r) for r in rows]
                return {"prev": ns[0], "next": ns[-1], "mode_used": "country_type"}
            mode = "country"  # fallback

        # Tag mode: expressions sharing the given tag
        if mode == "tag" and tag:
            rows = conn.execute(
                text("""
                    SELECT e.id, e.text AS expression, e.language, e.country
                    FROM expressions e
                    JOIN expression_tags et ON et.expression_id = e.id
                    JOIN tags t ON t.id = et.tag_id
                    WHERE t.slug = :tag AND e.id != :id AND e.kind != 'word'
                    ORDER BY RANDOM() LIMIT 2
                """),
                {"tag": tag, "id": expression_id},
            ).fetchall()
            if rows:
                ns = [_row_to_neighbor(r) for r in rows]
                return {"prev": ns[0], "next": ns[-1], "mode_used": "tag"}
            mode = "country"  # fallback

        # Country mode: expressions from the same country/language
        if mode == "country" and country:
            rows = conn.execute(
                text("""
                    SELECT e.id, e.text AS expression, e.language, e.country
                    FROM expressions e
                    WHERE COALESCE(e.country, e.language) = :country AND e.id != :id AND e.kind != 'word'
                    ORDER BY RANDOM() LIMIT 2
                """),
                {"country": country, "id": expression_id},
            ).fetchall()
            if rows:
                ns = [_row_to_neighbor(r) for r in rows]
                return {"prev": ns[0], "next": ns[-1], "mode_used": "country"}

        # Random (default / fallback)
        rows = conn.execute(
            text("""
                SELECT e.id, e.text AS expression, e.language, e.country
                FROM expressions e
                WHERE e.id != :id AND e.kind != 'word'
                ORDER BY RANDOM() LIMIT 2
            """),
            {"id": expression_id},
        ).fetchall()
        if not rows:
            return {"prev": None, "next": None, "mode_used": "random"}
        ns = [_row_to_neighbor(r) for r in rows]
        return {"prev": ns[0], "next": ns[-1], "mode_used": "random"}


def get_expression_by_id(expression_id: str) -> Optional[dict]:
    """Retourne une expression par son id (avec contenu et tags), ou None si elle n'existe pas."""
    # Triple LEFT JOIN :
    # ec_orig   = expression_content dans la langue de l'expression (source primaire)
    # ct_native = content_translations avec target_lang = langue de l'expression
    #             (ex. expressions kaikki dont le contenu FR a été généré par Mistral)
    # ec_en     = expression_content EN en dernier recours (ex. kaikki sans contenu FR généré)
    sql = """
        SELECT
            e.id,
            e.text,
            e.language,
            e.region,
            e.country,
            e.register,
            e.illustration,
            e.source,
            e.kind,
            e.literal_fr,
            COALESCE(ec_orig.meaning, ct_native.meaning, ec_en.meaning) AS meaning,
            COALESCE(ec_orig.origin,  ct_native.origin,  ec_en.origin)  AS origin,
            COALESCE(ec_orig.example, ct_native.example, ec_en.example) AS example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec_orig
            ON ec_orig.expression_id = e.id AND ec_orig.locale = e.language
        LEFT JOIN content_translations ct_native
            ON ct_native.expression_id = e.id AND ct_native.target_lang = e.language
        LEFT JOIN expression_content ec_en
            ON ec_en.expression_id = e.id AND ec_en.locale = 'en'
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE e.id = :id
        GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                 e.illustration, e.source, e.kind, e.literal_fr,
                 ec_orig.meaning, ec_orig.origin, ec_orig.example,
                 ct_native.meaning, ct_native.origin, ct_native.example,
                 ec_en.meaning, ec_en.origin, ec_en.example
    """

    with engine.connect() as conn:
        row = conn.execute(text(sql), {"id": expression_id}).fetchone()

    if not row:
        return None
    result = _build_expression_dict(row, "direct")
    result["literal_fr"] = row.literal_fr
    return result


def get_expression_by_id_localized(expression_id: str, locale: str) -> Optional[dict]:
    """Comme get_expression_by_id, mais sert meaning/origin/example/literal dans `locale`
    avec la MÊME logique COALESCE que get_random_expression :
    expression_content(locale) → content_translations(locale) → langue d'origine → en.
    Garantit que l'expression du jour reste cohérente quand l'utilisateur change de langue.
    Renvoie aussi `meaning_locale` (la langue réelle du sens servi)."""
    sql = """
        SELECT
            e.id,
            e.text,
            e.language,
            e.region,
            e.country,
            e.register,
            e.illustration,
            e.source,
            e.kind,
            e.literal_fr,
            COALESCE(ec_pref.meaning, ct_pref.meaning, ec_orig.meaning, ec_en.meaning) AS meaning,
            COALESCE(ec_pref.origin,  ct_pref.origin,  ec_orig.origin,  ec_en.origin)  AS origin,
            COALESCE(ec_pref.example, ct_pref.example, ec_orig.example, ec_en.example) AS example,
            CASE WHEN ec_pref.meaning IS NOT NULL OR ct_pref.meaning IS NOT NULL
                 THEN :locale ELSE e.language END         AS meaning_locale,
            ct_pref.literal                              AS literal,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec_orig
            ON ec_orig.expression_id = e.id AND ec_orig.locale = e.language
        LEFT JOIN expression_content ec_pref
            ON ec_pref.expression_id = e.id AND ec_pref.locale = :locale
        LEFT JOIN content_translations ct_pref
            ON ct_pref.expression_id = e.id AND ct_pref.target_lang = :locale
        LEFT JOIN expression_content ec_en
            ON ec_en.expression_id = e.id AND ec_en.locale = 'en'
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE e.id = :id
        GROUP BY e.id, e.text, e.language, e.region, e.country, e.register,
                 e.illustration, e.source, e.kind, e.literal_fr,
                 ec_orig.meaning, ec_orig.origin, ec_orig.example,
                 ec_pref.meaning, ec_pref.origin, ec_pref.example,
                 ct_pref.meaning, ct_pref.origin, ct_pref.example, ct_pref.literal,
                 ec_en.meaning, ec_en.origin, ec_en.example
    """
    with engine.connect() as conn:
        row = conn.execute(text(sql), {"locale": locale, "id": expression_id}).fetchone()
    if not row:
        return None
    result = _build_expression_dict(row, "direct")
    result["literal_fr"] = row.literal_fr
    result["meaning_locale"] = row.meaning_locale
    result["literal"] = getattr(row, "literal", None)
    return result


def get_concept_equivalents(expression_id: str) -> list[dict]:
    """Return expressions sharing the same concept, in other languages, ordered by confidence."""
    sql = """
        WITH source AS (
            SELECT concept_id, language FROM expressions WHERE id = :id
        )
        SELECT
            e.id, e.text, e.language, e.region, e.country, e.literal_fr, e.concept_confidence,
            COALESCE(ec_fr.meaning, ct_fr.meaning) AS meaning_fr
        FROM expressions e
        JOIN source ON e.concept_id = source.concept_id AND source.concept_id IS NOT NULL
        LEFT JOIN expression_content ec_fr ON ec_fr.expression_id = e.id AND ec_fr.locale = 'fr'
        LEFT JOIN content_translations ct_fr ON ct_fr.expression_id = e.id AND ct_fr.target_lang = 'fr'
        WHERE e.language != source.language
          AND e.concept_confidence >= 0.65
        ORDER BY e.concept_confidence DESC
    """
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {"id": expression_id}).fetchall()
        return [
            {
                "id": r.id,
                "text": r.text,
                "language": r.language,
                "region": r.region or "",
                "country": r.country or r.language,
                "literal_fr": r.literal_fr,
                "concept_confidence": r.concept_confidence,
                "meaning_fr": r.meaning_fr,
            }
            for r in rows
        ]
    except Exception:
        # Migration not yet applied on this environment — return empty list gracefully
        return []


def get_type_counts(regions: Optional[set[str]] = None, tag_set: Optional[set[str]] = None, query: Optional[str] = None, languages: Optional[set[str]] = None, countries: Optional[set[str]] = None) -> dict:
    """Retourne le nombre d'expressions par type (idiom/proverb/locution/word), avec filtres optionnels."""
    region_sql, region_params = _region_clause(regions)
    country_sql, country_params = _country_clause(countries)
    lang_sql, lang_params = _language_clause(languages)
    params: dict = {**region_params, **country_params, **lang_params}

    tag_join = ""
    tag_where = ""
    if tag_set:
        tag_join = """
            JOIN expression_tags et_f ON et_f.expression_id = e.id
            JOIN tags t_f ON t_f.id = et_f.tag_id"""
        tag_where = " AND t_f.slug = ANY(:tag_set_f)"
        params["tag_set_f"] = list(tag_set)

    query_join = ""
    query_where = ""
    if query:
        query_join = "\n            LEFT JOIN expression_content ec_tc ON ec_tc.expression_id = e.id AND ec_tc.locale = e.language"
        query_where = """ AND (
            to_tsvector('simple', e.text) @@ websearch_to_tsquery('simple', :q_tc)
            OR to_tsvector('simple',
                coalesce(ec_tc.meaning,'') || ' ' || coalesce(ec_tc.example,'') || ' ' || coalesce(ec_tc.origin,''))
               @@ websearch_to_tsquery('simple', :q_tc)
        )"""
        params["q_tc"] = query.strip()

    sql = f"""
        SELECT e.kind, COUNT(DISTINCT e.id) AS n
        FROM expressions e
        {tag_join}
        {query_join}
        WHERE 1=1 {region_sql}{country_sql}{lang_sql}{_EXCLUDE_PHRASEBOOK}{tag_where}{query_where}
        GROUP BY e.kind
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()
    counts = {r.kind: r.n for r in rows}
    return {
        "idiom":    counts.get("idiom", 0),
        "proverb":  counts.get("proverb", 0),
        "locution": counts.get("locution", 0),
        "word":     counts.get("word", 0),
    }


def get_all_slugs() -> list[str]:
    """Retourne tous les IDs d'expressions (sauf les mots) — pour le sitemap."""
    sql = text("SELECT id FROM expressions WHERE kind != 'word' ORDER BY id")
    with engine.connect() as conn:
        return [row.id for row in conn.execute(sql)]


def upsert_user(google_id: str, email: str, name: Optional[str], avatar_url: Optional[str]) -> dict:
    """Crée ou met à jour un utilisateur via Google OAuth. Retourne le profil complet."""
    sql = text("""
        INSERT INTO users (id, google_id, email, name, avatar_url, created_at)
        VALUES (gen_random_uuid(), :google_id, :email, :name, :avatar_url, NOW())
        ON CONFLICT (google_id) DO UPDATE
            SET email = EXCLUDED.email,
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url
        RETURNING id::text, google_id, email, name, avatar_url, ui_lang, created_at
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"google_id": google_id, "email": email, "name": name, "avatar_url": avatar_url}).fetchone()
    return {"id": row.id, "email": row.email, "name": row.name, "avatar_url": row.avatar_url, "ui_lang": row.ui_lang}


def get_user_preferences(user_id: str) -> Optional[dict]:
    """Retourne les préférences d'un utilisateur."""
    # CAST(...AS uuid) — pas `:param::uuid` (SQLAlchemy text() ne reconnaît pas un bindparam
    # collé à un cast Postgres "::" ; cf. commentaire sur create_email_token plus bas).
    sql = text("""
        SELECT id::text, ui_lang, explore_mode, learning_langs, content_type,
               email_verified, native_lang, user_goal, language_modes
        FROM users WHERE id = CAST(:user_id AS uuid)
    """)
    with engine.connect() as conn:
        row = conn.execute(sql, {"user_id": user_id}).fetchone()
    if row is None:
        return None
    return {
        "id": row.id,
        "ui_lang": row.ui_lang,
        "explore_mode": row.explore_mode,
        "learning_langs": list(row.learning_langs) if row.learning_langs else [],
        "content_type": row.content_type,
        "email_verified": row.email_verified,
        "native_lang": row.native_lang,
        "user_goal": row.user_goal,
        "language_modes": row.language_modes or {},
    }


def update_user_preferences(
    user_id: str,
    ui_lang: str,
    explore_mode: str = "multilingual",
    learning_langs: list[str] | None = None,
    content_type: str = "all",
    native_lang: str | None = None,
    user_goal: str | None = None,
    language_modes: dict | None = None,
) -> Optional[dict]:
    """Met à jour les préférences d'un utilisateur. Retourne les nouvelles valeurs."""
    sql = text("""
        UPDATE users
        SET ui_lang = :ui_lang,
            explore_mode = :explore_mode,
            learning_langs = :learning_langs,
            content_type = :content_type,
            native_lang = :native_lang,
            user_goal = :user_goal,
            language_modes = CAST(:language_modes AS JSONB)
        WHERE id = CAST(:user_id AS uuid)
        RETURNING id::text, ui_lang, explore_mode, learning_langs, content_type, native_lang, user_goal, language_modes
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {
            "user_id": user_id,
            "ui_lang": ui_lang,
            "explore_mode": explore_mode,
            "learning_langs": learning_langs or [],
            "content_type": content_type,
            "native_lang": native_lang,
            "user_goal": user_goal,
            "language_modes": json.dumps(language_modes or {}),
        }).fetchone()
    if row is None:
        return None
    return {
        "id": row.id,
        "ui_lang": row.ui_lang,
        "explore_mode": row.explore_mode,
        "learning_langs": list(row.learning_langs) if row.learning_langs else [],
        "content_type": row.content_type,
        "native_lang": row.native_lang,
        "user_goal": row.user_goal,
        "language_modes": row.language_modes or {},
    }


def get_user_favorites(user_id: str) -> list[dict]:
    """Retourne les favoris d'un utilisateur, du plus récent au plus ancien.
    Inclut review_box/reviewed_at/game_session_id (pivot Révision, contract §3)."""
    sql = text("""
        SELECT expression_id, saved_at, review_box, reviewed_at, game_session_id::text
        FROM user_favorites
        WHERE user_id = CAST(:user_id AS uuid)
        ORDER BY saved_at DESC
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"user_id": user_id}).fetchall()
    return [{
        "expression_id": r.expression_id,
        "saved_at": r.saved_at.isoformat(),
        "review_box": r.review_box,
        "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
        "game_session_id": r.game_session_id,
    } for r in rows]


def toggle_user_favorite(user_id: str, expression_id: str, game_session_id: str | None = None) -> dict:
    """Ajoute ou retire un favori. Retourne {"action": "added"} ou {"action": "removed"}.
    `game_session_id` (pivot S196, contract §3) : la partie où l'expression a été gardée ❤️,
    attaché uniquement à l'ajout (le retrait ne le lit pas)."""
    check_sql = text("SELECT 1 FROM user_favorites WHERE user_id = CAST(:uid AS uuid) AND expression_id = :eid")
    with engine.begin() as conn:
        exists = conn.execute(check_sql, {"uid": user_id, "eid": expression_id}).fetchone()
        if exists:
            conn.execute(
                text("DELETE FROM user_favorites WHERE user_id = CAST(:uid AS uuid) AND expression_id = :eid"),
                {"uid": user_id, "eid": expression_id}
            )
            return {"action": "removed"}
        else:
            conn.execute(
                text("""
                    INSERT INTO user_favorites (user_id, expression_id, saved_at, game_session_id)
                    VALUES (CAST(:uid AS uuid), :eid, NOW(), CAST(:gsid AS uuid))
                """),
                {"uid": user_id, "eid": expression_id, "gsid": game_session_id}
            )
            return {"action": "added"}


# ── Pivot "games hub" (S196) — game_sessions, reports, review ──────────────────

_VALID_GAMES = {"voyage", "revision"}
_VALID_REPORT_REASONS = {"fabricated", "wrong-translation", "duplicate", "other"}


def create_game_session(
    game: str,
    client_id: str,
    user_id: Optional[str] = None,
    filters: Optional[dict] = None,
    cards: Optional[list[str]] = None,
) -> dict:
    """
    Crée une partie (contract §3 — POST /game-sessions).
    - voyage : le serveur tire 10 expressions uniques honorant `filters`
      {country, kind, domain, locale, quick} — JA exclu, kind='word' exclu (même pool
      que /random), au plus une carte 'rare' (register slang/vulgar).
    - revision : le client fournit `cards` (favoris côté client) ; le serveur se contente
      d'enregistrer et d'hydrater.
    Retourne {id, cards: [expression...]} — cards toujours hydratées (même forme que /random),
    avec un champ 'rare' bool sur chaque carte (voyage uniquement, False sinon).
    """
    if game not in _VALID_GAMES:
        raise ValueError(f"unknown game type: {game}")

    filters = filters or {}
    locale = (filters.get("locale") or "").strip() or None
    rare_id: Optional[str] = None

    if game == "voyage":
        country = (filters.get("country") or "").strip()
        kind = (filters.get("kind") or "").strip()
        domain = (filters.get("domain") or "").strip()
        # Same pool as /random (kind='word' + 'phrasebook' tag excluded, via
        # _RANDOM_POOL_WHERE) plus the game-only rule: JA excluded from all game pools
        # (contract §0 — JA content broken, Luke L3) until that content is fixed.
        draw_sql = f"""
            SELECT e.id, e.register FROM expressions e
            {_RANDOM_POOL_WHERE}
              AND e.language != 'ja'
            ORDER BY RANDOM()
            LIMIT 10
        """
        with engine.connect() as conn:
            rows = conn.execute(text(draw_sql), {
                "country": country, "kind": kind, "domain": domain, "language": "",
            }).fetchall()
        card_ids = [r.id for r in rows]
        rare_candidates = [r.id for r in rows if r.register in ("slang", "vulgar")]
        rare_id = random.choice(rare_candidates) if rare_candidates else None
    else:  # revision
        card_ids = list(cards or [])

    session_id = str(uuid.uuid4())
    insert_sql = text("""
        INSERT INTO game_sessions (id, user_id, client_id, game, filters, cards, kept_ids, started_at)
        VALUES (CAST(:id AS uuid), CAST(:user_id AS uuid), :client_id, :game,
                CAST(:filters AS JSONB), CAST(:cards AS JSONB), '[]'::jsonb, NOW())
    """)
    with engine.begin() as conn:
        conn.execute(insert_sql, {
            "id": session_id,
            "user_id": user_id,
            "client_id": client_id,
            "game": game,
            "filters": json.dumps(filters),
            "cards": json.dumps(card_ids),
        })

    hydrated = browse_by_ids(card_ids, locale)
    for card in hydrated:
        card["rare"] = card["id"] == rare_id

    return {"id": session_id, "cards": hydrated}


def close_game_session(session_id: str, ended_at: Optional[str], kept_ids: list[str]) -> bool:
    """Clôture une partie (contract §3 — PATCH /game-sessions/{id}). `ended_at` est un
    timestamp ISO fourni par le client ; NOW() si absent. Retourne False si la partie
    n'existe pas (id inconnu ou malformé)."""
    try:
        uuid.UUID(str(session_id))
    except (ValueError, AttributeError):
        return False
    sql = text("""
        UPDATE game_sessions
        SET ended_at = COALESCE(CAST(:ended_at AS TIMESTAMPTZ), NOW()),
            kept_ids = CAST(:kept_ids AS JSONB)
        WHERE id = CAST(:id AS uuid)
    """)
    with engine.begin() as conn:
        result = conn.execute(sql, {
            "id": session_id,
            "ended_at": ended_at,
            "kept_ids": json.dumps(kept_ids or []),
        })
    return result.rowcount > 0


def create_report(
    expression_id: str,
    reason: Optional[str] = None,
    comment: Optional[str] = None,
    client_id: Optional[str] = None,
    ui_lang: Optional[str] = None,
) -> None:
    """
    Enregistre un signalement 🚩 (contract §2/§3). Idempotent : un seul report 'open' par
    (client_id, expression_id) — index unique partiel, ON CONFLICT DO NOTHING (silencieux,
    la répétition d'un tap ne doit ni échouer ni dupliquer). Lève ValueError si
    `expression_id` n'existe pas (→ 404 côté endpoint).
    """
    with engine.begin() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM expressions WHERE id = :id"), {"id": expression_id}
        ).fetchone()
        if not exists:
            raise ValueError(f"unknown expression_id: {expression_id}")
        conn.execute(text("""
            INSERT INTO expression_reports
                (id, expression_id, reason, comment, user_id, client_id, ui_lang, status, created_at)
            VALUES
                (gen_random_uuid(), :expression_id, :reason, :comment, NULL, :client_id, :ui_lang, 'open', NOW())
            ON CONFLICT (client_id, expression_id) WHERE status = 'open' AND client_id IS NOT NULL
            DO NOTHING
        """), {
            "expression_id": expression_id,
            "reason": reason,
            "comment": comment,
            "client_id": client_id,
            "ui_lang": ui_lang,
        })


def set_favorite_review(user_id: str, expression_id: str, result: str) -> Optional[dict]:
    """
    Enregistre une réponse de révision sur un favori (contract §2/§3 — v1 semantics).
    'knew' → review_box=1, 'not_yet' → review_box=0 ; les deux posent reviewed_at=NOW().
    Retourne None si le favori n'existe pas (l'utilisateur doit avoir déjà gardé cette
    expression ❤️ avant de pouvoir la réviser).
    """
    box = 1 if result == "knew" else 0
    sql = text("""
        UPDATE user_favorites
        SET review_box = :box, reviewed_at = NOW()
        WHERE user_id = CAST(:user_id AS uuid) AND expression_id = :expression_id
        RETURNING review_box, reviewed_at
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"box": box, "user_id": user_id, "expression_id": expression_id}).fetchone()
    if row is None:
        return None
    return {"review_box": row.review_box, "reviewed_at": row.reviewed_at.isoformat()}


def get_concepts(
    locale: str = "en",
    lang: Optional[str] = None,
    domain: Optional[str] = None,
    min_count: int = 5,
    kind: Optional[str] = None,
) -> dict:
    """
    Retourne les tags ayant un domaine assigné (concept_domains) et ≥ min_count expressions.

    Params :
      locale  — langue d'affichage du nom du tag (tag_names)
      lang    — filtre sur la langue des expressions pour les compteurs
      domain  — ne retourner que les tags de ce domaine
      min_count — nb minimum d'expressions (défaut 5)

    Retourne :
      {
        "domain_counts": {"emotions": 45, ...},
        "concepts": [{"slug": ..., "name": ..., "count": ..., "domains": [...]}, ...]
      }
    """
    lang_clause = "AND e.language = :lang" if lang else ""
    kind_clause = "AND e.kind = :kind" if kind else ""
    domain_clause = """AND EXISTS (
        SELECT 1 FROM concept_domains cd2
        WHERE cd2.tag_id = t.id AND cd2.domain_slug = :domain
    )""" if domain else ""

    concepts_sql = f"""
        WITH eligible AS (
            SELECT DISTINCT
                t.id         AS tag_id,
                t.slug,
                COALESCE(tn.name, t.slug) AS tag_name,
                e.id         AS expr_id
            FROM tags t
            JOIN concept_domains cd ON cd.tag_id = t.id
            JOIN expression_tags et ON et.tag_id = t.id
            JOIN expressions e ON e.id = et.expression_id
            LEFT JOIN tag_names tn ON tn.tag_id = t.id AND tn.locale = :locale
            WHERE NOT (t.slug = ANY(:meta_tags))
              {domain_clause}
              {lang_clause}
              {kind_clause}
              AND NOT EXISTS (
                  SELECT 1 FROM expression_tags et_pb
                  JOIN tags t_pb ON t_pb.id = et_pb.tag_id
                  WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
              )
        ),
        counts AS (
            SELECT tag_id, slug, tag_name, COUNT(*) AS cnt
            FROM eligible
            GROUP BY tag_id, slug, tag_name
            HAVING COUNT(*) >= :min_count
        )
        SELECT
            c.slug,
            c.tag_name                                        AS name,
            c.cnt                                             AS count,
            ARRAY_AGG(DISTINCT cd.domain_slug ORDER BY cd.domain_slug) AS domains
        FROM counts c
        JOIN concept_domains cd ON cd.tag_id = c.tag_id
        GROUP BY c.slug, c.tag_name, c.cnt
        ORDER BY c.cnt DESC
    """

    domain_counts_sql = f"""
        SELECT cd.domain_slug, COUNT(DISTINCT cd.tag_id) AS cnt
        FROM concept_domains cd
        JOIN (
            SELECT DISTINCT t.id AS tag_id
            FROM tags t
            JOIN expression_tags et ON et.tag_id = t.id
            JOIN expressions e ON e.id = et.expression_id
            WHERE NOT (t.slug = ANY(:meta_tags))
              {lang_clause}
              {kind_clause}
              AND NOT EXISTS (
                  SELECT 1 FROM expression_tags et_pb
                  JOIN tags t_pb ON t_pb.id = et_pb.tag_id
                  WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
              )
            GROUP BY t.id
            HAVING COUNT(DISTINCT e.id) >= :min_count
        ) eligible ON eligible.tag_id = cd.tag_id
        GROUP BY cd.domain_slug
    """

    # Distinct expression count per domain (deduplicated — avoids double-counting
    # expressions tagged with multiple concepts in the same domain).
    domain_expr_counts_sql = f"""
        SELECT cd.domain_slug, COUNT(DISTINCT e.id) AS cnt
        FROM concept_domains cd
        JOIN expression_tags et ON et.tag_id = cd.tag_id
        JOIN expressions e ON e.id = et.expression_id
        WHERE NOT EXISTS (
            SELECT 1 FROM expression_tags et_pb
            JOIN tags t_pb ON t_pb.id = et_pb.tag_id
            WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
        )
        {lang_clause}
        {kind_clause}
        GROUP BY cd.domain_slug
    """

    params: dict = {
        "locale": locale,
        "meta_tags": list(META_TAGS),
        "min_count": min_count,
    }
    if lang:
        params["lang"] = lang
    if kind:
        params["kind"] = kind
    if domain:
        params["domain"] = domain

    with engine.connect() as conn:
        concept_rows = conn.execute(text(concepts_sql), params).fetchall()
        # domain_counts and domain_expr_counts use same params minus domain filter
        dc_params = {k: v for k, v in params.items() if k != "domain"}
        dc_rows = conn.execute(text(domain_counts_sql), dc_params).fetchall()
        dec_rows = conn.execute(text(domain_expr_counts_sql), dc_params).fetchall()

    return {
        "domain_counts": {r.domain_slug: r.cnt for r in dc_rows},
        "domain_expr_counts": {r.domain_slug: r.cnt for r in dec_rows},
        "concepts": [
            {"slug": r.slug, "name": r.name, "count": r.count, "domains": list(r.domains)}
            for r in concept_rows
        ],
    }


def get_domain_tags(domain: str) -> set[str]:
    """Return all tag IDs assigned to a domain (used for domain-level search)."""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT DISTINCT tag_id FROM concept_domains WHERE domain_slug = :domain"),
            {"domain": domain},
        )
        return {r.tag_id for r in result.fetchall()}


def subscribe_newsletter(email: str, language: str) -> dict:
    """
    Enregistre un abonné à la newsletter.
    Retourne {"status": "created"} ou {"status": "already_subscribed"}.
    """
    sql_insert = text("""
        INSERT INTO newsletter_subscribers (id, email, language, created_at)
        VALUES (gen_random_uuid(), :email, :language, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """)
    with engine.begin() as conn:
        row = conn.execute(sql_insert, {"email": email, "language": language}).fetchone()
    return {"status": "created" if row else "already_subscribed"}


# ---------------------------------------------------------------------------
# Email / password auth
# ---------------------------------------------------------------------------

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def _check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def register_email_user(email: str, password: str, name: Optional[str]) -> Optional[dict]:
    """
    Crée un utilisateur avec email + mot de passe.
    Retourne le profil si créé, None si l'email est déjà utilisé.
    """
    password_hash = _hash_password(password)
    sql = text("""
        INSERT INTO users (id, email, name, password_hash, email_verified, created_at)
        VALUES (gen_random_uuid(), :email, :name, :password_hash, false, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id::text, email, name, avatar_url, ui_lang
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"email": email, "name": name, "password_hash": password_hash}).fetchone()
    if row is None:
        return None  # email already taken
    return {"id": row.id, "email": row.email, "name": row.name, "avatar_url": row.avatar_url, "ui_lang": row.ui_lang}


def get_user_by_email(email: str) -> Optional[dict]:
    """Retourne le profil + password_hash + email_verified pour la connexion email."""
    sql = text("""
        SELECT id::text, email, name, avatar_url, ui_lang, password_hash, email_verified
        FROM users WHERE email = :email
    """)
    with engine.connect() as conn:
        row = conn.execute(sql, {"email": email}).fetchone()
    if row is None:
        return None
    return {
        "id": row.id,
        "email": row.email,
        "name": row.name,
        "avatar_url": row.avatar_url,
        "ui_lang": row.ui_lang,
        "password_hash": row.password_hash,
        "email_verified": row.email_verified,
    }


def login_email_user(email: str, password: str) -> Optional[dict]:
    """
    Vérifie email + mot de passe.
    Retourne le profil public si valide, None sinon.
    """
    user = get_user_by_email(email)
    if user is None or not user["password_hash"]:
        return None
    if not _check_password(password, user["password_hash"]):
        return None
    return {k: v for k, v in user.items() if k not in ("password_hash",)}


def create_email_token(user_id: str, purpose: str, expires_hours: int = 48) -> str:
    """
    Génère et persiste un token à usage unique.
    purpose: 'verify' | 'reset'
    """
    token = secrets.token_urlsafe(32)
    # CAST(...AS uuid) avoids psycopg2 confusion with :param::uuid syntax
    sql = text("""
        INSERT INTO email_tokens (id, user_id, token, purpose, created_at, expires_at, used)
        VALUES (
            gen_random_uuid(),
            CAST(:user_id AS uuid),
            :token,
            :purpose,
            NOW(),
            NOW() + CAST(:hours || ' hours' AS INTERVAL),
            false
        )
    """)
    with engine.begin() as conn:
        conn.execute(sql, {"user_id": user_id, "token": token, "purpose": purpose, "hours": expires_hours})
    return token


def consume_email_token(token: str, purpose: str) -> Optional[str]:
    """
    Valide un token (non expiré, non utilisé, bon purpose) et le marque comme utilisé.
    Retourne l'user_id (str) si valide, None sinon.
    Opération atomique — CTE UPDATE + RETURNING.
    """
    sql = text("""
        WITH updated AS (
            UPDATE email_tokens
            SET used = true
            WHERE token = :token
              AND purpose = :purpose
              AND used = false
              AND expires_at > NOW()
            RETURNING user_id::text
        )
        SELECT user_id FROM updated
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"token": token, "purpose": purpose}).fetchone()
    return row.user_id if row else None


def set_email_verified(user_id: str) -> None:
    """Marque l'adresse email d'un utilisateur comme vérifiée."""
    sql = text("""
        UPDATE users SET email_verified = true WHERE id = CAST(:uid AS uuid)
    """)
    with engine.begin() as conn:
        conn.execute(sql, {"uid": user_id})


def update_user_name(user_id: str, name: str) -> dict:
    """Met à jour le nom affiché d'un utilisateur."""
    sql = text("""
        UPDATE users SET name = :name WHERE id = CAST(:uid AS uuid)
        RETURNING id::text, email, name, avatar_url
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"name": name.strip() or None, "uid": user_id}).fetchone()
    if not row:
        raise ValueError("User not found")
    return {"id": row.id, "email": row.email, "name": row.name, "avatar_url": row.avatar_url}


def update_password_hash(user_id: str, new_password: str) -> None:
    """Remplace le mot de passe d'un utilisateur (flow reset)."""
    password_hash = _hash_password(new_password)
    sql = text("""
        UPDATE users SET password_hash = :ph WHERE id = CAST(:uid AS uuid)
    """)
    with engine.begin() as conn:
        conn.execute(sql, {"ph": password_hash, "uid": user_id})


def send_transactional_email(to: str, subject: str, html_body: str) -> None:
    """
    Envoie un email via l'API Resend (urllib — pas de dépendance externe).
    Nécessite RESEND_API_KEY et APP_URL dans les variables d'environnement.
    En l'absence de clé API, log vers stdout (mode dev).
    RESEND_SUPPRESS_EMAILS : liste d'adresses email (virgule) pour lesquelles
    l'envoi est silencieusement ignoré — utile pour les comptes de test CI.
    """
    suppress = os.getenv("RESEND_SUPPRESS_EMAILS", "")
    suppressed = {e.strip().lower() for e in suppress.split(",") if e.strip()}
    if to.lower() in suppressed:
        print(f"[email suppressed] To: {to} | Subject: {subject}")
        return

    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        print(f"[email dev] To: {to} | Subject: {subject}\n{html_body}")
        return

    from_address = os.getenv("RESEND_FROM", "World Expressions <noreply@worldexpressions.app>")
    payload = json.dumps({
        "from": from_address,
        "to": [to],
        "subject": subject,
        "html": html_body,
    }).encode()

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "World Expressions/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
            print(f"[email sent] To: {to} | Subject: {subject}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"Resend API error {e.code}: {body}") from e

"""
Couche d'accès aux données — PostgreSQL via SQLAlchemy.

Ce fichier est le seul endroit qui "parle" à la base.
main.py appelle ces fonctions sans savoir comment les données sont stockées.

Le schéma PostgreSQL a 5 tables (expressions, expression_content, tags, tag_names, expression_tags).
Ce fichier les assemble et retourne des dicts au même format qu'avant,
pour que main.py et le frontend n'aient pas besoin de changer.
"""

from typing import Optional
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
        "illustration": row.illustration,
        "language":     row.language or "",
        "type":         getattr(row, "kind", "expression") or "expression",
        "source":       getattr(row, "source", None),
        "match_type":   match_type,
    }


def _get_preferred_content(ids: list, locale: str, conn) -> dict:
    """
    Batch-fetches meaning/origin/example in the preferred locale for a list of expression IDs.
    expression_content takes priority over content_translations.
    Returns {expression_id: {meaning, origin, example}}.
    """
    if not ids or not locale:
        return {}
    result: dict = {}
    for row in conn.execute(text("""
        SELECT expression_id, meaning, origin, example FROM content_translations
        WHERE expression_id = ANY(:ids) AND target_lang = :locale
    """), {"ids": ids, "locale": locale}).fetchall():
        result[row.expression_id] = {"meaning": row.meaning, "origin": row.origin, "example": row.example}
    for row in conn.execute(text("""
        SELECT expression_id, meaning, origin, example FROM expression_content
        WHERE expression_id = ANY(:ids) AND locale = :locale
    """), {"ids": ids, "locale": locale}).fetchall():
        result[row.expression_id] = {"meaning": row.meaning, "origin": row.origin, "example": row.example}
    return result


def _region_clause(regions: Optional[set[str]]) -> tuple[str, dict]:
    """
    Retourne un fragment SQL et ses paramètres pour filtrer par région.
    Utilise ANY(:regions) — syntaxe PostgreSQL pour tester l'appartenance à un tableau.
    """
    if regions:
        return "AND e.region = ANY(:regions)", {"regions": list(regions)}
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


def get_random_expression(locale: Optional[str] = None) -> Optional[dict]:
    """
    Retourne une expression au hasard (toutes langues).
    Si `locale` est fourni, essaie de servir le sens dans cette locale.
    Retourne aussi `meaning_locale` pour que le frontend sache dans quelle langue est le sens.

    Optimisation perf : ORDER BY RANDOM() en deux étapes.
    Étape 1 — trie uniquement la colonne id (table légère, pas de JOIN).
    Étape 2 — charge l'expression complète par PK (lookup direct, pas de tri).
    Évite de trier des milliers de lignes multi-colonnes jointes à chaque appel.
    """
    effective_locale = locale or ""

    # Étape 1 : ID aléatoire sur la table légère, sans JOINs
    id_sql = """
        SELECT e.id FROM expressions e
        WHERE e.kind != 'word'
          AND NOT EXISTS (
              SELECT 1 FROM expression_tags et_pb
              JOIN tags t_pb ON t_pb.id = et_pb.tag_id
              WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
          )
        ORDER BY RANDOM()
        LIMIT 1
    """

    # Étape 2 : chargement complet par PK — pas d'ORDER BY, lookup direct
    # Double LEFT JOIN : ec_orig = contenu dans la langue de l'expression,
    # ec_pref = contenu dans la locale demandée (peut être NULL si pas encore traduit).
    # COALESCE prend ec_pref en priorité, sinon ec_orig.
    full_sql = """
        SELECT
            e.id,
            e.text,
            e.language,
            e.region,
            e.register,
            e.illustration,
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
        GROUP BY e.id, e.text, e.language, e.region, e.register,
                 e.illustration, e.source,
                 ec_orig.meaning, ec_orig.origin, ec_orig.example,
                 ec_pref.meaning, ec_pref.origin, ec_pref.example,
                 ct_pref.meaning, ct_pref.origin, ct_pref.example, ct_pref.literal
    """
    with engine.connect() as conn:
        id_row = conn.execute(text(id_sql)).fetchone()
        if not id_row:
            return None
        row = conn.execute(text(full_sql), {"locale": effective_locale, "expr_id": id_row.id}).fetchone()
    if not row:
        return None
    result = _build_expression_dict(row, "direct")
    result["meaning_locale"] = row.meaning_locale
    result["literal"] = getattr(row, "literal", None)
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
    """Retourne toutes les régions présentes en base avec leur nombre d'expressions, triées par count desc."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT region, COUNT(*) AS n FROM expressions WHERE region IS NOT NULL GROUP BY region ORDER BY n DESC")
        ).fetchall()
    return [{"code": r.region, "count": r.n} for r in rows]


_TSQ = "websearch_to_tsquery('simple', :q)"
_TEXT_VEC = "to_tsvector('simple', text)"
_CONTENT_VEC = """to_tsvector('simple',
            coalesce(meaning, '') || ' ' || coalesce(origin, '') || ' ' ||
            coalesce(example, '') || ' ' || coalesce(tags_text, ''))"""


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


def search_expressions(query: str, regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None, locale: Optional[str] = None) -> tuple[list[dict], int]:
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
    type_sql, type_params = _type_clause(type_filter)

    # Python lookup first: needed to conditionally build the concept CTE
    matching_tags = _find_matching_tag_slugs(query)

    concept_cte_sql = ""
    concept_union_sql = ""
    concept_params: dict = {}
    if matching_tags:
        concept_cte_sql = """
        , concept_pass AS (
            SELECT
                e.id, e.text, e.language, e.region, e.register,
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
            {region_clause}{exclude_phrasebook}{type_clause}
            AND e.id NOT IN (SELECT id FROM exact_pass)
            AND e.id NOT IN (SELECT id FROM semantic_pass)
            AND e.id NOT IN (SELECT id FROM translation_pass)
        )""".format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)
        concept_union_sql = """
            UNION ALL
            SELECT id, text, language, region, register, illustration, kind, source,
                   meaning, origin, example, tags_text, tags, rank, pass_order, match_type
            FROM concept_pass"""
        concept_params = {"tag_set": list(matching_tags)}

    sql = f"""
        WITH base AS (
            SELECT
                e.id, e.text, e.language, e.region, e.register,
                e.illustration, e.kind, e.source,
                ec.meaning, ec.origin, ec.example,
                STRING_AGG(t.slug, ' ') AS tags_text,
                STRING_AGG(t.slug, ',') AS tags
            FROM expressions e
            LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
            LEFT JOIN expression_tags et ON et.expression_id = e.id
            LEFT JOIN tags t ON t.id = et.tag_id
            WHERE 1=1 {region_sql}{_EXCLUDE_PHRASEBOOK}{type_sql}
            GROUP BY e.id, e.text, e.language, e.region, e.register,
                     e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ),
        exact_pass AS (
            SELECT
                id, text, language, region, register, illustration, kind, source,
                meaning, origin, example, tags_text, tags,
                ts_rank({_TEXT_VEC}, {_TSQ}) AS rank,
                1 AS pass_order, 'exact'::text AS match_type
            FROM base
            WHERE {_TEXT_VEC} @@ {_TSQ}
        ),
        semantic_pass AS (
            SELECT
                id, text, language, region, register, illustration, kind, source,
                meaning, origin, example, tags_text, tags,
                ts_rank({_CONTENT_VEC}, {_TSQ}) AS rank,
                2 AS pass_order, 'semantic'::text AS match_type
            FROM base
            WHERE NOT ({_TEXT_VEC} @@ {_TSQ})
              AND {_CONTENT_VEC} @@ {_TSQ}
        ),
        translation_pass AS (
            SELECT
                e.id, e.text, e.language, e.region, e.register,
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
                  AND to_tsvector('simple',
                          coalesce(ct.meaning,'') || ' ' ||
                          coalesce(ct.origin,'') || ' ' ||
                          coalesce(ct.example,''))
                      @@ {_TSQ}
            )
            {region_sql}{_EXCLUDE_PHRASEBOOK}{type_sql}
            AND e.id NOT IN (SELECT id FROM exact_pass)
            AND e.id NOT IN (SELECT id FROM semantic_pass)
            GROUP BY e.id, e.text, e.language, e.region, e.register,
                     e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ){concept_cte_sql},
        all_results AS (
            SELECT id, text, language, region, register, illustration, kind, source,
                   meaning, origin, example, tags_text, tags, rank, pass_order, match_type
            FROM exact_pass
            UNION ALL
            SELECT id, text, language, region, register, illustration, kind, source,
                   meaning, origin, example, tags_text, tags, rank, pass_order, match_type
            FROM semantic_pass
            UNION ALL
            SELECT id, text, language, region, register, illustration, kind, source,
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
              **region_params, **type_params, **concept_params}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    if not rows:
        return [], 0

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

    return results, total


def search_by_concept(tag_set: set[str], regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None) -> tuple[list[dict], int]:
    """
    Retourne toutes les expressions ayant au moins un tag parmi tag_set (logique OR).
    Utilisé pour la recherche cross-lingue par concept (argent + money + wealth...).
    LIMIT/OFFSET appliqués en SQL + COUNT(*) OVER() pour le total — pas de slice Python.
    """
    region_sql, region_params = _region_clause(regions)
    type_sql, type_params = _type_clause(type_filter)

    sql = """
        SELECT
            e.id, e.text, e.language, e.region, e.register,
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
        {region_clause}{exclude_phrasebook}{type_clause}
        ORDER BY e.language, CASE WHEN e.kind = 'word' THEN 1 ELSE 0 END, e.text
        LIMIT :limit OFFSET :offset
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)

    params = {"tag_set": list(tag_set), **region_params, **type_params, "limit": limit, "offset": offset}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    total = rows[0].total_count if rows else 0
    results = [_build_expression_dict(r, "tag") for r in rows]
    return results, total


def browse_by_region(regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0, type_filter: Optional[str] = None) -> tuple[list[dict], int]:
    """Retourne toutes les expressions d'une ou plusieurs régions, dans un ordre aléatoire."""
    region_sql, region_params = _region_clause(regions)
    type_sql, type_params = _type_clause(type_filter)

    sql = """
        SELECT
            e.id, e.text, e.language, e.region, e.register,
            e.illustration, e.kind, e.source,
            ec.meaning, ec.origin, ec.example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE 1=1 {region_clause}{exclude_phrasebook}{type_clause}
        GROUP BY e.id, e.text, e.language, e.region, e.register,
                 e.illustration, e.kind, e.source, ec.meaning, ec.origin, ec.example
        ORDER BY RANDOM()
        LIMIT :limit OFFSET :offset
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)

    count_sql = """
        SELECT COUNT(*) FROM expressions e WHERE 1=1 {region_clause}{exclude_phrasebook}{type_clause}
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK, type_clause=type_sql)

    params = {**region_params, **type_params, "limit": limit, "offset": offset}
    count_params = {**region_params, **type_params}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()
        total = conn.execute(text(count_sql), count_params).scalar() or 0

    results = [_build_expression_dict(r, "browse") for r in rows]
    return results, total


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
        GROUP BY e.id, e.text, e.language, e.region, e.register,
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


def get_concept_equivalents(expression_id: str) -> list[dict]:
    """Return expressions sharing the same concept, in other languages, ordered by confidence."""
    sql = """
        WITH source AS (
            SELECT concept_id, language FROM expressions WHERE id = :id
        )
        SELECT
            e.id, e.text, e.language, e.region, e.literal_fr, e.concept_confidence,
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
                "region": r.region or r.language,
                "literal_fr": r.literal_fr,
                "concept_confidence": r.concept_confidence,
                "meaning_fr": r.meaning_fr,
            }
            for r in rows
        ]
    except Exception:
        # Migration not yet applied on this environment — return empty list gracefully
        return []


def get_type_counts(regions: Optional[set[str]] = None, tag_set: Optional[set[str]] = None, query: Optional[str] = None) -> dict:
    """Retourne le nombre d'expressions par type (idiom/proverb/locution/word), avec filtres optionnels."""
    region_sql, region_params = _region_clause(regions)
    params: dict = {**region_params}

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
        WHERE 1=1 {region_sql}{_EXCLUDE_PHRASEBOOK}{tag_where}{query_where}
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
    """Retourne les préférences d'un utilisateur (ui_lang)."""
    sql = text("SELECT id::text, ui_lang FROM users WHERE id = :user_id::uuid")
    with engine.connect() as conn:
        row = conn.execute(sql, {"user_id": user_id}).fetchone()
    if row is None:
        return None
    return {"id": row.id, "ui_lang": row.ui_lang}


def update_user_preferences(user_id: str, ui_lang: str) -> Optional[dict]:
    """Met à jour les préférences d'un utilisateur. Retourne les nouvelles valeurs."""
    sql = text("""
        UPDATE users SET ui_lang = :ui_lang
        WHERE id = :user_id::uuid
        RETURNING id::text, ui_lang
    """)
    with engine.begin() as conn:
        row = conn.execute(sql, {"user_id": user_id, "ui_lang": ui_lang}).fetchone()
    if row is None:
        return None
    return {"id": row.id, "ui_lang": row.ui_lang}


def get_user_favorites(user_id: str) -> list[dict]:
    """Retourne les favoris d'un utilisateur, du plus récent au plus ancien."""
    sql = text("""
        SELECT expression_id, saved_at
        FROM user_favorites
        WHERE user_id = :user_id::uuid
        ORDER BY saved_at DESC
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"user_id": user_id}).fetchall()
    return [{"expression_id": r.expression_id, "saved_at": r.saved_at.isoformat()} for r in rows]


def toggle_user_favorite(user_id: str, expression_id: str) -> dict:
    """Ajoute ou retire un favori. Retourne {"action": "added"} ou {"action": "removed"}."""
    check_sql = text("SELECT 1 FROM user_favorites WHERE user_id = :uid::uuid AND expression_id = :eid")
    with engine.begin() as conn:
        exists = conn.execute(check_sql, {"uid": user_id, "eid": expression_id}).fetchone()
        if exists:
            conn.execute(
                text("DELETE FROM user_favorites WHERE user_id = :uid::uuid AND expression_id = :eid"),
                {"uid": user_id, "eid": expression_id}
            )
            return {"action": "removed"}
        else:
            conn.execute(
                text("INSERT INTO user_favorites (user_id, expression_id, saved_at) VALUES (:uid::uuid, :eid, NOW())"),
                {"uid": user_id, "eid": expression_id}
            )
            return {"action": "added"}


def get_concepts(
    locale: str = "en",
    lang: Optional[str] = None,
    domain: Optional[str] = None,
    min_count: int = 5,
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
        {lang_clause.replace("AND e.", "AND e.")}
        GROUP BY cd.domain_slug
    """

    params: dict = {
        "locale": locale,
        "meta_tags": list(META_TAGS),
        "min_count": min_count,
    }
    if lang:
        params["lang"] = lang
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

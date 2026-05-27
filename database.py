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
        "type":         getattr(row, "type", "expression") or "expression",
        "source":       getattr(row, "source", None),
        "match_type":   match_type,
    }


def _region_clause(regions: Optional[set[str]]) -> tuple[str, dict]:
    """
    Retourne un fragment SQL et ses paramètres pour filtrer par région.
    Utilise ANY(:regions) — syntaxe PostgreSQL pour tester l'appartenance à un tableau.
    """
    if regions:
        return "AND e.region = ANY(:regions)", {"regions": list(regions)}
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
    """
    # Double LEFT JOIN : ec_orig = contenu dans la langue de l'expression,
    # ec_pref = contenu dans la locale demandée (peut être NULL si pas encore traduit).
    # COALESCE prend ec_pref en priorité, sinon ec_orig.
    sql = """
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
        WHERE e.type = 'expression'
          AND NOT EXISTS (
              SELECT 1 FROM expression_tags et_pb
              JOIN tags t_pb ON t_pb.id = et_pb.tag_id
              WHERE et_pb.expression_id = e.id AND t_pb.slug = 'phrasebook'
          )
        GROUP BY e.id, e.text, e.language, e.region, e.register,
                 e.illustration, e.source,
                 ec_orig.meaning, ec_orig.origin, ec_orig.example,
                 ec_pref.meaning, ec_pref.origin, ec_pref.example,
                 ct_pref.meaning, ct_pref.origin, ct_pref.example, ct_pref.literal
        ORDER BY RANDOM()
        LIMIT 1
    """
    # Si pas de locale demandée, on utilise la langue de l'expression comme fallback
    effective_locale = locale or ""
    with engine.connect() as conn:
        row = conn.execute(text(sql), {"locale": effective_locale}).fetchone()
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


def search_expressions(query: str, regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    """
    Cherche des expressions par mot-clé dans le texte, le sens, les tags, l'exemple et l'origine.

    Deux types de correspondance, retournés dans cet ordre :
    - "exact"    : le mot apparaît dans le texte de l'expression elle-même
    - "semantic" : le mot apparaît dans le sens, les tags, l'exemple ou l'origine

    Le JOIN avec expression_content utilise la locale = langue de l'expression.
    Les tags sont agrégés en une seule chaîne par la requête SQL (string_agg).
    """
    q = f"%{query.lower().strip()}%"
    region_sql, region_params = _region_clause(regions)

    # Sous-requête réutilisée : jointure expressions + contenu + tags agrégés
    base_cte = """
        WITH expr_full AS (
            SELECT
                e.id,
                e.text,
                e.language,
                e.region,
                e.register,
                e.illustration,
                e."type",
                e.source,
                ec.meaning,
                ec.origin,
                ec.example,
                STRING_AGG(t.slug, ',') AS tags
            FROM expressions e
            LEFT JOIN expression_content ec
                ON ec.expression_id = e.id AND ec.locale = e.language
            LEFT JOIN expression_tags et ON et.expression_id = e.id
            LEFT JOIN tags t ON t.id = et.tag_id
            WHERE 1=1 {region_clause}{exclude_phrasebook}
            GROUP BY e.id, e.text, e.language, e.region, e.register,
                     e.illustration, e."type", e.source, ec.meaning, ec.origin, ec.example
        )
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK)

    exact_sql = base_cte + """
        SELECT * FROM expr_full
        WHERE lower(text) LIKE :q
        ORDER BY CASE WHEN "type" = 'word' THEN 1 ELSE 0 END, text
    """

    semantic_sql = base_cte + """
        SELECT * FROM expr_full
        WHERE lower(text) NOT LIKE :q
          AND (
              lower(meaning) LIKE :q
           OR lower(tags)    LIKE :q
           OR lower(example) LIKE :q
           OR lower(origin)  LIKE :q
          )
        ORDER BY CASE WHEN "type" = 'word' THEN 1 ELSE 0 END, text
    """

    params = {"q": q, **region_params}

    with engine.connect() as conn:
        exact_rows    = conn.execute(text(exact_sql),    params).fetchall()
        semantic_rows = conn.execute(text(semantic_sql), params).fetchall()

    exact    = [_build_expression_dict(r, "exact")    for r in exact_rows]
    semantic = [_build_expression_dict(r, "semantic") for r in semantic_rows]

    all_results = exact + semantic
    return all_results[offset:offset + limit], len(all_results)


def search_by_concept(tag_set: set[str], regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    """
    Retourne toutes les expressions ayant au moins un tag parmi tag_set (logique OR).
    Utilisé pour la recherche cross-lingue par concept (argent + money + wealth...).
    Le filtrage se fait en SQL via expression_tags.
    """
    region_sql, region_params = _region_clause(regions)

    sql = """
        SELECT
            e.id,
            e.text,
            e.language,
            e.region,
            e.register,
            e.illustration,
            e."type",
            e.source,
            ec.meaning,
            ec.origin,
            ec.example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = e.language
        JOIN expression_tags et ON et.expression_id = e.id
        JOIN tags t ON t.id = et.tag_id
        WHERE t.slug = ANY(:tag_set)
        {region_clause}{exclude_phrasebook}
        GROUP BY e.id, e.text, e.language, e.region, e.register,
                 e.illustration, e."type", e.source, ec.meaning, ec.origin, ec.example
        ORDER BY e.language, CASE WHEN e."type" = 'word' THEN 1 ELSE 0 END, e.text
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK)

    params = {"tag_set": list(tag_set), **region_params}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    all_results = [_build_expression_dict(r, "tag") for r in rows]
    return all_results[offset:offset + limit], len(all_results)


def browse_by_region(regions: Optional[set[str]] = None, limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    """Retourne toutes les expressions d'une ou plusieurs régions, dans un ordre aléatoire."""
    region_sql, region_params = _region_clause(regions)

    sql = """
        SELECT
            e.id, e.text, e.language, e.region, e.register,
            e.illustration, e."type", e.source,
            ec.meaning, ec.origin, ec.example,
            STRING_AGG(t.slug, ',') AS tags
        FROM expressions e
        LEFT JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        LEFT JOIN expression_tags et ON et.expression_id = e.id
        LEFT JOIN tags t ON t.id = et.tag_id
        WHERE 1=1 {region_clause}{exclude_phrasebook}
        GROUP BY e.id, e.text, e.language, e.region, e.register,
                 e.illustration, e."type", e.source, ec.meaning, ec.origin, ec.example
        ORDER BY RANDOM()
        LIMIT :limit OFFSET :offset
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK)

    count_sql = """
        SELECT COUNT(*) FROM expressions e WHERE 1=1 {region_clause}{exclude_phrasebook}
    """.format(region_clause=region_sql, exclude_phrasebook=_EXCLUDE_PHRASEBOOK)

    params = {**region_params, "limit": limit, "offset": offset}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()
        total = conn.execute(text(count_sql), region_params).scalar() or 0

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
            e."type",
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
                 e.illustration, e.source, e."type",
                 ec_orig.meaning, ec_orig.origin, ec_orig.example,
                 ct_native.meaning, ct_native.origin, ct_native.example,
                 ec_en.meaning, ec_en.origin, ec_en.example
    """

    with engine.connect() as conn:
        row = conn.execute(text(sql), {"id": expression_id}).fetchone()

    return _build_expression_dict(row, "direct") if row else None


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

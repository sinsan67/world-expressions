from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import database

app = FastAPI(title="Expressions du Monde API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://world-expressions.vercel.app",
        "http://localhost:3000",  # local dev
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    counts = database.count_expressions()
    return {
        "message": "Welcome to the Expressions du Monde API",
        "expressions_loaded": counts["total"],
        "by_language": counts["by_language"],
        "usage": "GET /search?q=your_word",
    }


@app.get("/search")
def search_expressions(
    q: str = Query(..., min_length=2, description="Word to search"),
    region: str = Query("", description="Comma-separated regions to include, e.g. 'fr,uk,us'. Empty = all."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
):
    """
    Search for expressions related to a word.
    Returns exact matches first, then semantic matches.
    Pass region=fr,uk,us to filter by origin country; omit for all regions.
    """
    regions = set(region.split(",")) - {""} if region else None
    results, total = database.search_expressions(q, regions, limit, offset)
    return {
        "query": q,
        "regions": sorted(regions) if regions else "all",
        "total": total,
        "offset": offset,
        "limit": limit,
        "exact":    sum(1 for r in results if r["match_type"] == "exact"),
        "semantic": sum(1 for r in results if r["match_type"] == "semantic"),
        "results": results,
    }


@app.get("/concept")
def search_by_concept(
    tags: str = Query(..., description="Comma-separated tag synonyms (OR logic). e.g. 'argent,money,wealth'"),
    region: str = Query("", description="Comma-separated regions. Empty = all."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
):
    """
    Return all expressions that have at least one of the given tags.
    Powers cross-language concept navigation: clicking 'argent' also finds 'money', 'wealth'...
    """
    tag_set = {t.lower().strip() for t in tags.split(",") if t.strip()}
    regions = set(region.split(",")) - {""} if region else None
    results, total = database.search_by_concept(tag_set, regions, limit, offset)
    return {
        "concept_tags": sorted(tag_set),
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": results,
    }


@app.get("/tags")
def get_tags(
    limit: int = Query(30, ge=1, le=500, description="Number of top tags to return"),
    language: str = Query("", description="Filter tags by expression language: fr, en, es, it, tr. Empty = all."),
    locale: str = Query("en", description="Locale for tag display names: fr, en, es, it, tr."),
):
    """Return the most represented tags, excluding meta-tags. Pass language= to filter by expression language, locale= for display names."""
    lang = language.strip() or None
    loc = locale.strip() or "en"
    return database.get_top_tags(limit, lang, loc)


@app.get("/random")
def get_random(
    locale: str = Query("", description="Preferred locale for meaning (fr/en/es). Falls back to expression's language."),
):
    """Return a random expression. Pass locale=en to get the meaning in English if available."""
    expr = database.get_random_expression(locale.strip() or None)
    if expr is None:
        raise HTTPException(status_code=404, detail="No expressions found")
    return expr


@app.get("/expression/{expression_id}")
def get_expression(
    expression_id: str,
    lang: str = Query("", description="Target language for translation (en/fr/es/it/tr). Empty = no translation."),
):
    """Return the full detail of an expression by its id. Pass lang= to include a translation."""
    expr = database.get_expression_by_id(expression_id)
    if expr is None:
        raise HTTPException(status_code=404, detail=f"Expression '{expression_id}' not found")
    target = lang.strip()
    if target and target != expr["language"]:
        expr["translation"] = database.get_translation(expression_id, target)
    else:
        expr["translation"] = None
    return expr

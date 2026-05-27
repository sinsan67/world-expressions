import os
import re
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database

app = FastAPI(title="Expressions du Monde API")

_default_origins = "https://world-expressions.vercel.app,http://localhost:3000"
_cors_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST"],
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


@app.get("/regions")
def get_regions():
    """Return all regions present in the database with their expression counts."""
    return database.get_regions()


@app.get("/search")
def search_expressions(
    q: str = Query(..., min_length=2, description="Word to search"),
    region: str = Query("", description="Comma-separated regions to include, e.g. 'fr,uk,us'. Empty = all."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
):
    """
    Search for expressions related to a word.
    Returns exact matches first, then semantic matches.
    Pass region=fr,uk,us to filter by origin country; omit for all regions.
    """
    regions = set(region.split(",")) - {""} if region else None
    tf = type_filter.strip() or None
    results, total = database.search_expressions(q, regions, limit, offset, tf)
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
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
):
    """
    Return all expressions that have at least one of the given tags.
    Powers cross-language concept navigation: clicking 'argent' also finds 'money', 'wealth'...
    """
    tag_set = {t.lower().strip() for t in tags.split(",") if t.strip()}
    regions = set(region.split(",")) - {""} if region else None
    tf = type_filter.strip() or None
    results, total = database.search_by_concept(tag_set, regions, limit, offset, tf)
    return {
        "concept_tags": sorted(tag_set),
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": results,
    }


@app.get("/browse")
def browse_expressions(
    region: str = Query("", description="Comma-separated regions. Empty = all."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
):
    """Return all expressions for given regions, sorted alphabetically. No query needed."""
    regions = set(region.split(",")) - {""} if region else None
    tf = type_filter.strip() or None
    results, total = database.browse_by_region(regions, limit, offset, tf)
    return {
        "regions": sorted(regions) if regions else "all",
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


@app.get("/type-counts")
def get_type_counts(
    region: str = Query("", description="Comma-separated regions. Empty = all."),
    tag: str = Query("", description="Comma-separated tag slugs for concept filter."),
    q: str = Query("", description="Text search query."),
):
    """Return count of expressions per type, given optional region/concept/search filters."""
    regions = set(region.split(",")) - {""} if region else None
    tag_set = {t.lower().strip() for t in tag.split(",") if t.strip()} if tag else None
    query = q.strip() or None
    return database.get_type_counts(regions, tag_set, query)


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_VALID_LANGS = {"fr", "en", "es", "it", "tr"}


class SubscribeRequest(BaseModel):
    email: str
    language: str = "en"


@app.get("/slugs")
def get_slugs():
    """Return all expression IDs — used for sitemap generation only."""
    return {"slugs": database.get_all_slugs()}


@app.post("/newsletter/subscribe")
def newsletter_subscribe(body: SubscribeRequest):
    email = body.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address")
    lang = body.language if body.language in _VALID_LANGS else "en"
    result = database.subscribe_newsletter(email, lang)
    return result

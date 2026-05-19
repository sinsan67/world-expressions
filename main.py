from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import database

app = FastAPI(title="Expressions du Monde API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    limit: int = Query(30, ge=1, le=100, description="Number of top tags to return"),
):
    """Return the most represented tags, excluding meta-tags (origin, register markers)."""
    return database.get_top_tags(limit)


@app.get("/expression/{expression_id}")
def get_expression(expression_id: str):
    """Return the full detail of an expression by its id."""
    expr = database.get_expression_by_id(expression_id)
    if expr is None:
        raise HTTPException(status_code=404, detail=f"Expression '{expression_id}' not found")
    return expr

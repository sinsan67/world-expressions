import json
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Expressions du Monde API")

# Allow the frontend to call this API when the HTML is opened locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Load expressions once at startup
DATA_PATH = Path(__file__).parent / "data" / "expressions.json"
with open(DATA_PATH, encoding="utf-8") as f:
    EXPRESSIONS = json.load(f)


def normalize(text: str) -> str:
    """Lowercase and strip for case-insensitive comparison."""
    return text.lower().strip()


def search(query: str, langs: set[str] | None = None) -> list[dict]:
    """
    Search expressions by keyword, optionally filtered by a set of languages.
    If langs is None or empty, all languages are included.

    Two match types, in priority order:
    - "exact"    : the word appears in the expression text itself
    - "semantic" : the word appears in meaning, tags, example, or origin
    """
    q = normalize(query)
    if not q:
        return []

    exact_results = []
    semantic_results = []

    for expr in EXPRESSIONS:
        if langs and expr.get("language") not in langs:
            continue

        in_expression = q in normalize(expr["expression"])
        in_meaning    = q in normalize(expr["meaning"])
        in_tags       = any(q in normalize(tag) for tag in expr["tags"])
        in_example    = q in normalize(expr.get("example", ""))
        in_origin     = q in normalize(expr.get("origin", ""))

        if in_expression:
            exact_results.append({**expr, "match_type": "exact"})
        elif in_meaning or in_tags or in_example or in_origin:
            semantic_results.append({**expr, "match_type": "semantic"})

    return exact_results + semantic_results


@app.get("/")
def home():
    fr_count = sum(1 for e in EXPRESSIONS if e.get("language") == "fr")
    en_count = sum(1 for e in EXPRESSIONS if e.get("language") == "en")
    return {
        "message": "Welcome to the Expressions du Monde API",
        "expressions_loaded": len(EXPRESSIONS),
        "by_language": {"fr": fr_count, "en": en_count},
        "usage": "GET /search?q=your_word&lang=en",
    }


@app.get("/search")
def search_expressions(
    q: str = Query(..., min_length=2, description="Word to search"),
    lang: str = Query("", description="Comma-separated languages to include, e.g. 'en,fr'. Empty = all."),
):
    """
    Search for expressions related to a word.
    Returns exact matches first, then semantic matches.
    Pass lang=en,fr to filter by language; omit for all languages.
    """
    langs = set(lang.split(",")) - {""} if lang else None
    results = search(q, langs)
    return {
        "query": q,
        "langs": sorted(langs) if langs else "all",
        "total": len(results),
        "exact": sum(1 for r in results if r["match_type"] == "exact"),
        "semantic": sum(1 for r in results if r["match_type"] == "semantic"),
        "results": results,
    }


@app.get("/expression/{expression_id}")
def get_expression(expression_id: str):
    """Return the full detail of an expression by its id."""
    for expr in EXPRESSIONS:
        if expr["id"] == expression_id:
            return expr
    return {"error": f"Expression '{expression_id}' not found"}, 404

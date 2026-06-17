import os
import re
from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database


def _cache_public_1h(response: Response) -> None:
    """Dependency: marks a GET response as publicly cacheable for 1 h (CDN + browser)."""
    response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"

app = FastAPI(title="Expressions du Monde API")

_default_origins = "https://world-expressions.vercel.app,http://localhost:3000"
_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST", "PUT"],
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
def get_regions(_: None = Depends(_cache_public_1h)):
    """Return sub-regions (alsace, bretagne) present in the database with their expression counts."""
    return database.get_regions()


@app.get("/countries")
def get_countries(_: None = Depends(_cache_public_1h)):
    """Return all countries present in the database with their expression counts."""
    return database.get_countries()


@app.get("/search")
def search_expressions(
    q: str = Query(..., min_length=2, description="Word to search"),
    region: str = Query("", description="Comma-separated sub-regions (alsace, bretagne). Empty = all."),
    country: str = Query("", description="Comma-separated country codes, e.g. 'fr,uk,ar'. Empty = all."),
    language: str = Query("", description="Comma-separated language codes, e.g. 'es'. Filters by expression language."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
    locale: str = Query("", description="UI locale for translated meanings, e.g. 'fr', 'en'"),
):
    """
    Search for expressions related to a word.
    Returns exact matches first, then semantic matches, then cross-language translation matches.
    Pass country=fr,uk,ar to filter by origin country; omit for all countries.
    Pass locale=fr to receive meanings in French when available.
    """
    regions = set(region.split(",")) - {""} if region else None
    countries = set(country.split(",")) - {""} if country else None
    languages = set(language.split(",")) - {""} if language else None
    tf = type_filter.strip() or None
    loc = locale.strip() or None
    results, total, detected_concepts = database.search_expressions(q, regions, limit, offset, tf, loc, languages, countries)
    return {
        "query": q,
        "countries": sorted(countries) if countries else "all",
        "total": total,
        "offset": offset,
        "limit": limit,
        "exact":       sum(1 for r in results if r["match_type"] == "exact"),
        "semantic":    sum(1 for r in results if r["match_type"] == "semantic"),
        "translation": sum(1 for r in results if r["match_type"] == "translation"),
        "concept":     sum(1 for r in results if r["match_type"] == "concept"),
        "detected_concepts": sorted(detected_concepts),
        "results": results,
    }


@app.get("/concept")
def search_by_concept(
    tags: str = Query("", description="Comma-separated tag synonyms (OR logic). e.g. 'argent,money,wealth'"),
    domain: str = Query("", description="Domain slug — uses all tags of that domain (overrides tags)."),
    region: str = Query("", description="Comma-separated sub-regions (alsace, bretagne). Empty = all."),
    country: str = Query("", description="Comma-separated country codes, e.g. 'fr,uk,ar'. Empty = all."),
    language: str = Query("", description="Comma-separated language codes, e.g. 'es'. Filters by expression language."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
    locale: str = Query("", description="UI locale for translated meanings: fr, en, es, it, tr."),
    sort: str = Query("", description="Sort order: 'random' for random order (domain browsing), empty for default alphabetical."),
):
    """
    Return all expressions that have at least one of the given tags.
    Powers cross-language concept navigation: clicking 'argent' also finds 'money', 'wealth'...
    Pass domain= to search all expressions in a thematic domain.
    """
    if domain.strip():
        tag_set = database.get_domain_tags(domain.strip())
    else:
        tag_set = {t.lower().strip() for t in tags.split(",") if t.strip()}
    regions = set(region.split(",")) - {""} if region else None
    countries = set(country.split(",")) - {""} if country else None
    languages = set(language.split(",")) - {""} if language else None
    tf = type_filter.strip() or None
    loc = locale.strip() or None
    random_order = sort.strip() == "random"
    results, total = database.search_by_concept(tag_set, regions, limit, offset, tf, loc, languages, countries, random_order)
    return {
        "concept_tags": sorted(tag_set),
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": results,
    }


@app.get("/browse")
def browse_expressions(
    region: str = Query("", description="Comma-separated sub-regions (alsace, bretagne). Empty = all."),
    country: str = Query("", description="Comma-separated country codes, e.g. 'fr,uk,ar'. Empty = all."),
    language: str = Query("", description="Comma-separated language codes, e.g. 'es'. Filters by expression language."),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    type_filter: str = Query("", description="Filter by expression type: idiom, proverb, locution, word"),
    locale: str = Query("", description="UI locale for translated meanings: fr, en, es, it, tr."),
):
    """Return all expressions for given countries/regions, in random order. No query needed."""
    regions = set(region.split(",")) - {""} if region else None
    countries = set(country.split(",")) - {""} if country else None
    languages = set(language.split(",")) - {""} if language else None
    tf = type_filter.strip() or None
    loc = locale.strip() or None
    results, total = database.browse_by_region(regions, limit, offset, tf, loc, languages, countries)
    return {
        "countries": sorted(countries) if countries else "all",
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
    _: None = Depends(_cache_public_1h),
):
    """Return the most represented tags, excluding meta-tags. Pass language= to filter by expression language, locale= for display names."""
    lang = language.strip() or None
    loc = locale.strip() or "en"
    return database.get_top_tags(limit, lang, loc)


@app.get("/concepts")
def get_concepts_endpoint(
    locale: str = Query("en", description="Locale for tag display names: fr, en, es, it, tr."),
    lang: str = Query("", description="Filter expression counts by language: fr, en, es, it, tr. Empty = all."),
    domain: str = Query("", description="Filter to a single domain slug (e.g. 'emotions'). Empty = all."),
    min_count: int = Query(5, ge=1, description="Minimum number of expressions per concept."),
    kind: str = Query("", description="Filter by expression kind: idiom, proverb, locution. Empty = all."),
    _: None = Depends(_cache_public_1h),
):
    """Return tags that have been assigned to a thematic domain, grouped with their domains.
    Includes domain_counts (number of concepts per domain) and a flat concept list."""
    return database.get_concepts(
        locale=locale.strip() or "en",
        lang=lang.strip() or None,
        domain=domain.strip() or None,
        min_count=min_count,
        kind=kind.strip() or None,
    )


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
    expr["concept_equivalents"] = database.get_concept_equivalents(expression_id)
    return expr


@app.get("/expression/{expression_id}/neighbors")
def get_expression_neighbors(
    expression_id: str,
    mode: str = Query("country_type", description="Navigation mode: country_type|random|country|tag"),
    country: str = Query("", description="Country code"),
    tag: str = Query("", description="Tag slug for tag mode"),
    kind: str = Query("", description="Expression kind for country_type mode"),
):
    """Return prev/next neighbor expressions for ‹/› floating navigation."""
    return database.get_expression_neighbors(expression_id, mode, country.strip(), tag.strip(), kind.strip())


@app.get("/type-counts")
def get_type_counts(
    region: str = Query("", description="Comma-separated sub-regions (alsace, bretagne). Empty = all."),
    country: str = Query("", description="Comma-separated country codes, e.g. 'fr,uk,ar'. Empty = all."),
    language: str = Query("", description="Comma-separated language codes, e.g. 'es'. Filters by expression language."),
    tag: str = Query("", description="Comma-separated tag slugs for concept filter."),
    q: str = Query("", description="Text search query."),
    _: None = Depends(_cache_public_1h),
):
    """Return count of expressions per type, given optional country/region/concept/search filters."""
    regions = set(region.split(",")) - {""} if region else None
    countries = set(country.split(",")) - {""} if country else None
    languages = set(language.split(",")) - {""} if language else None
    tag_set = {t.lower().strip() for t in tag.split(",") if t.strip()} if tag else None
    query = q.strip() or None
    return database.get_type_counts(regions, tag_set, query, languages, countries)


@app.get("/facets")
def get_facets(
    q: str = Query("", description="Text query for query-aware facets"),
    country: str = Query("", description="Comma-separated country codes for kind facets"),
    type_filter: str = Query("", description="Type filter (idiom|proverb|locution|word) for country facets"),
    domain: str = Query("", description="Domain slug to scope facets to a thematic domain"),
    locale: str = Query("", description="UI locale for stemmed FTS (fr, en, es, it, de, tr)"),
    _: None = Depends(_cache_public_1h),
):
    """Return facet counts: country counts (with type_filter) + kind counts (with country filter)."""
    countries = set(c.strip() for c in country.split(",") if c.strip()) or None
    type_f = type_filter.strip() or None
    query = q.strip() or None
    domain_f = domain.strip() or None
    loc = locale.strip() or None
    return database.get_facets(countries, query, type_f, domain_f, loc)


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_VALID_LANGS = {"fr", "en", "es", "it", "tr"}


class UpsertUserRequest(BaseModel):
    google_id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None


_VALID_EXPLORE_MODES = {"multilingual", "single"}
_VALID_CONTENT_TYPES = {"all", "proverbs", "everyday", "slang"}


class PreferencesRequest(BaseModel):
    ui_lang: str
    explore_mode: str = "multilingual"
    learning_langs: list[str] = []
    content_type: str = "all"
    native_lang: str | None = None
    user_goal: str | None = None


class FavoriteRequest(BaseModel):
    expression_id: str


@app.post("/users/upsert")
def upsert_user(body: UpsertUserRequest):
    """Crée ou met à jour un utilisateur après connexion Google OAuth."""
    return database.upsert_user(body.google_id, body.email, body.name, body.avatar_url)


@app.get("/users/{user_id}/preferences")
def get_preferences(user_id: str):
    """Retourne les préférences d'un utilisateur (ui_lang)."""
    prefs = database.get_user_preferences(user_id)
    if prefs is None:
        raise HTTPException(status_code=404, detail="User not found")
    return prefs


@app.put("/users/{user_id}/preferences")
def update_preferences(user_id: str, body: PreferencesRequest):
    """Met à jour les préférences d'un utilisateur."""
    if body.ui_lang not in _VALID_LANGS:
        raise HTTPException(status_code=422, detail=f"ui_lang must be one of {sorted(_VALID_LANGS)}")
    if body.explore_mode not in _VALID_EXPLORE_MODES:
        raise HTTPException(status_code=422, detail=f"explore_mode must be one of {sorted(_VALID_EXPLORE_MODES)}")
    if body.content_type not in _VALID_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail=f"content_type must be one of {sorted(_VALID_CONTENT_TYPES)}")
    invalid_langs = [l for l in body.learning_langs if l not in _VALID_LANGS]
    if invalid_langs:
        raise HTTPException(status_code=422, detail=f"learning_langs contains invalid values: {invalid_langs}")
    prefs = database.update_user_preferences(
        user_id, body.ui_lang, body.explore_mode, body.learning_langs, body.content_type,
        body.native_lang, body.user_goal,
    )
    if prefs is None:
        raise HTTPException(status_code=404, detail="User not found")
    return prefs


@app.put("/users/{user_id}/name")
def update_user_name(user_id: str, body: dict):
    """Met à jour le nom affiché d'un utilisateur."""
    name = body.get("name", "")
    try:
        return database.update_user_name(user_id, name)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")


@app.get("/users/{user_id}/favorites")
def get_favorites(user_id: str):
    """Retourne les favoris d'un utilisateur."""
    return {"favorites": database.get_user_favorites(user_id)}


@app.post("/users/{user_id}/favorites")
def toggle_favorite(user_id: str, body: FavoriteRequest):
    """Ajoute ou retire un favori (toggle). Retourne {"action": "added"|"removed"}."""
    return database.toggle_user_favorite(user_id, body.expression_id)


class SubscribeRequest(BaseModel):
    email: str
    language: str = "en"


@app.get("/slugs")
def get_slugs(_: None = Depends(_cache_public_1h)):
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


# ---------------------------------------------------------------------------
# Email / password auth
# ---------------------------------------------------------------------------

_APP_URL = os.getenv("APP_URL", "https://world-expressions.vercel.app")


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


def _validate_email(email: str) -> str:
    email = email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address")
    return email


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")


@app.post("/auth/register")
def auth_register(body: RegisterRequest):
    """
    Inscrit un nouvel utilisateur avec email + mot de passe.
    Envoie un email de vérification via Resend.
    """
    email = _validate_email(body.email)
    _validate_password(body.password)
    name = body.name.strip() if body.name else None

    user = database.register_email_user(email, body.password, name)
    if user is None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    token = database.create_email_token(user["id"], "verify", expires_hours=48)
    verify_url = f"{_APP_URL}/verify-email?token={token}"
    html = (
        f"<p>Welcome to World Expressions!</p>"
        f"<p><a href='{verify_url}'>Verify your email address</a></p>"
        f"<p>This link expires in 48 hours.</p>"
    )
    try:
        database.send_transactional_email(email, "Verify your World Expressions account", html)
    except Exception as e:
        print(f"[email error] Failed to send verification email to {email}: {e}")

    return {"status": "registered", "message": "Check your email to verify your account"}


@app.post("/auth/login")
def auth_login(body: LoginRequest):
    """
    Vérifie email + mot de passe. Retourne le profil si valide.
    Utilisé par le provider Credentials de NextAuth.
    """
    email = _validate_email(body.email)
    user = database.login_email_user(email, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@app.get("/auth/verify-email")
def auth_verify_email(token: str = Query(..., description="Verification token from email")):
    """
    Valide le token de vérification d'email et marque l'adresse comme vérifiée.
    """
    user_id = database.consume_email_token(token, "verify")
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    database.set_email_verified(user_id)
    return {"status": "verified"}


@app.post("/auth/forgot-password")
def auth_forgot_password(body: ForgotPasswordRequest):
    """
    Envoie un lien de réinitialisation de mot de passe.
    Retourne toujours 200 pour ne pas exposer les emails inscrits.
    """
    email = _validate_email(body.email)
    user = database.get_user_by_email(email)
    if user and user.get("password_hash"):
        token = database.create_email_token(user["id"], "reset", expires_hours=2)
        reset_url = f"{_APP_URL}/reset-password?token={token}"
        html = (
            f"<p>Reset your World Expressions password:</p>"
            f"<p><a href='{reset_url}'>Choose a new password</a></p>"
            f"<p>This link expires in 2 hours. If you didn't request this, ignore this email.</p>"
        )
        database.send_transactional_email(email, "Reset your World Expressions password", html)
    return {"status": "sent", "message": "If that email exists, a reset link has been sent"}


@app.post("/auth/reset-password")
def auth_reset_password(body: ResetPasswordRequest):
    """
    Valide le token de réinitialisation et met à jour le mot de passe.
    """
    _validate_password(body.password)
    user_id = database.consume_email_token(body.token, "reset")
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    database.update_password_hash(user_id, body.password)
    return {"status": "reset", "message": "Password updated successfully"}

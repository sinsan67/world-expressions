"""
Tests for the "additive" endpoint changes of the games hub pivot (contract §3):
GET /random/count?language=, GET /browse?ids=, POST/GET /users/{id}/favorites
(game_session_id, review_box, reviewed_at), GET/PUT /users/{id}/preferences
(language_modes).
"""
import uuid

import pytest


@pytest.fixture
def user_id(api):
    r = api.post("/users/upsert", json={
        "google_id": f"pytest-lotapi-{uuid.uuid4()}",
        "email": f"pytest-lotapi-{uuid.uuid4()}@example.com",
        "name": "Pytest Lot API",
    })
    assert r.status_code == 200
    return r.json()["id"]


# ── /random/count?language= ─────────────────────────────────────────────────

def test_random_count_language_filter(api):
    total = api.get("/random/count").json()["count"]
    fr = api.get("/random/count", params={"language": "fr"}).json()["count"]
    assert total >= fr > 0


def test_random_count_unknown_language_is_zero(api):
    r = api.get("/random/count", params={"language": "zz"})
    assert r.status_code == 200
    assert r.json()["count"] == 0


def test_random_count_language_combines_with_country(api):
    # Additive: existing filters keep working alongside the new one.
    r = api.get("/random/count", params={"country": "fr", "language": "fr"})
    assert r.status_code == 200
    assert r.json()["count"] > 0


# ── /browse?ids= ─────────────────────────────────────────────────────────────

def test_browse_ids_hydrates_requested_expressions(api, sample_expression_id):
    r = api.get("/browse", params={"ids": sample_expression_id})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["results"][0]["id"] == sample_expression_id


def test_browse_ids_preserves_order(api):
    # De-dup the draw itself (callers always pass distinct ids in practice — a
    # collection or a game session's card list never repeats an id).
    raw_ids = [api.get("/random").json()["id"] for _ in range(3)]
    ids = list(dict.fromkeys(raw_ids))
    r = api.get("/browse", params={"ids": ",".join(ids)})
    got_ids = [x["id"] for x in r.json()["results"]]
    assert got_ids == ids


def test_browse_ids_unknown_id_is_ignored(api):
    r = api.get("/browse", params={"ids": "this-id-does-not-exist-anywhere"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["results"] == []


def test_browse_ids_bypasses_other_filters(api, sample_expression_id):
    # A deliberately-wrong country filter must not suppress an explicit ids= hydrate.
    r = api.get("/browse", params={"ids": sample_expression_id, "country": "zz"})
    assert r.status_code == 200
    assert r.json()["total"] == 1


# ── favorites: game_session_id / review_box / reviewed_at ──────────────────

def test_favorites_toggle_without_game_session_id_still_works(api, user_id, sample_expression_id):
    added = api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    assert added.status_code == 200
    assert added.json()["action"] == "added"
    removed = api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    assert removed.json()["action"] == "removed"


def test_favorites_toggle_with_game_session_id(api, user_id, sample_expression_id):
    session = api.post("/game-sessions", json={
        "game": "voyage", "client_id": f"pytest-{uuid.uuid4()}", "filters": {},
    }).json()
    r = api.post(f"/users/{user_id}/favorites", json={
        "expression_id": sample_expression_id, "game_session_id": session["id"],
    })
    assert r.status_code == 200
    assert r.json()["action"] == "added"

    rows = api.get(f"/users/{user_id}/favorites").json()["favorites"]
    row = next(f for f in rows if f["expression_id"] == sample_expression_id)
    assert row["game_session_id"] == session["id"]


def test_favorites_rows_include_review_fields(api, user_id, sample_expression_id):
    api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    rows = api.get(f"/users/{user_id}/favorites").json()["favorites"]
    row = next(f for f in rows if f["expression_id"] == sample_expression_id)
    assert row["review_box"] == 0
    assert row["reviewed_at"] is None
    assert "game_session_id" in row


# ── preferences: language_modes ─────────────────────────────────────────────

def test_preferences_language_modes_defaults_empty(api, user_id):
    r = api.get(f"/users/{user_id}/preferences")
    assert r.status_code == 200
    assert r.json()["language_modes"] == {}


def test_preferences_language_modes_roundtrip(api, user_id):
    r = api.put(f"/users/{user_id}/preferences", json={
        "ui_lang": "en",
        "language_modes": {"it": "discovery", "tr": "mastered"},
    })
    assert r.status_code == 200
    assert r.json()["language_modes"] == {"it": "discovery", "tr": "mastered"}

    again = api.get(f"/users/{user_id}/preferences")
    assert again.json()["language_modes"] == {"it": "discovery", "tr": "mastered"}


def test_preferences_invalid_language_modes_value_returns_422(api, user_id):
    r = api.put(f"/users/{user_id}/preferences", json={
        "ui_lang": "en",
        "language_modes": {"it": "not-a-valid-mode"},
    })
    assert r.status_code == 422

import uuid

import pytest


@pytest.fixture
def user_id(api):
    """Creates a fresh test user (unique google_id per test — no shared state)."""
    r = api.post("/users/upsert", json={
        "google_id": f"pytest-lotapi-{uuid.uuid4()}",
        "email": f"pytest-lotapi-{uuid.uuid4()}@example.com",
        "name": "Pytest Lot API",
    })
    assert r.status_code == 200
    return r.json()["id"]


def test_review_knew_sets_box_1(api, user_id, sample_expression_id):
    api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    r = api.post(f"/users/{user_id}/favorites/{sample_expression_id}/review", json={"result": "knew"})
    assert r.status_code == 200
    data = r.json()
    assert data["review_box"] == 1
    assert data["reviewed_at"] is not None


def test_review_not_yet_resets_box_0(api, user_id, sample_expression_id):
    api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    api.post(f"/users/{user_id}/favorites/{sample_expression_id}/review", json={"result": "knew"})
    r = api.post(f"/users/{user_id}/favorites/{sample_expression_id}/review", json={"result": "not_yet"})
    assert r.status_code == 200
    data = r.json()
    assert data["review_box"] == 0
    assert data["reviewed_at"] is not None


def test_review_unknown_favorite_returns_404(api, user_id, sample_expression_id):
    # Never favorited -> nothing to review.
    r = api.post(f"/users/{user_id}/favorites/{sample_expression_id}/review", json={"result": "knew"})
    assert r.status_code == 404


def test_review_invalid_result_returns_422(api, user_id, sample_expression_id):
    api.post(f"/users/{user_id}/favorites", json={"expression_id": sample_expression_id})
    r = api.post(f"/users/{user_id}/favorites/{sample_expression_id}/review", json={"result": "bogus"})
    assert r.status_code == 422

import uuid


def _client_id() -> str:
    return f"pytest-{uuid.uuid4()}"


def test_voyage_session_draws_cards(api):
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {},
    })
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    cards = data["cards"]
    assert 1 <= len(cards) <= 10
    for card in cards:
        assert "id" in card
        assert "expression" in card
        assert "rare" in card


def test_voyage_session_cards_are_unique(api):
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {},
    })
    cards = r.json()["cards"]
    ids = [c["id"] for c in cards]
    assert len(ids) == len(set(ids))


def test_voyage_session_excludes_japanese(api):
    # JA excluded from all game pools (contract §0) until Luke L3 (broken JA content) is fixed.
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {},
    })
    cards = r.json()["cards"]
    assert all(c["language"] != "ja" for c in cards)


def test_voyage_session_at_most_one_rare_card(api):
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {},
    })
    cards = r.json()["cards"]
    assert sum(1 for c in cards if c["rare"]) <= 1


def test_voyage_session_country_filter(api):
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {"country": "fr"},
    })
    assert r.status_code == 200
    cards = r.json()["cards"]
    assert len(cards) > 0
    assert all(c["country"] == "fr" for c in cards)


def test_voyage_session_is_recorded(api):
    # Fire-and-forget close should succeed on a session we just created.
    r = api.post("/game-sessions", json={
        "game": "voyage", "client_id": _client_id(), "filters": {},
    })
    session_id = r.json()["id"]
    close = api.patch(f"/game-sessions/{session_id}", json={
        "ended_at": "2026-07-10T12:00:00Z", "kept_ids": [],
    })
    assert close.status_code == 200
    assert close.json() == {"ok": True}


def test_revision_session_records_given_cards(api, sample_expression_id):
    r = api.post("/game-sessions", json={
        "game": "revision", "client_id": _client_id(), "cards": [sample_expression_id],
    })
    assert r.status_code == 200
    cards = r.json()["cards"]
    assert [c["id"] for c in cards] == [sample_expression_id]


def test_revision_session_requires_cards(api):
    r = api.post("/game-sessions", json={
        "game": "revision", "client_id": _client_id(), "cards": [],
    })
    assert r.status_code == 422


def test_revision_session_requires_cards_field(api):
    r = api.post("/game-sessions", json={
        "game": "revision", "client_id": _client_id(),
    })
    assert r.status_code == 422


def test_game_session_invalid_game_type(api):
    r = api.post("/game-sessions", json={
        "game": "bogus", "client_id": _client_id(), "filters": {},
    })
    assert r.status_code == 422


def test_close_unknown_game_session_returns_404(api):
    r = api.patch(
        f"/game-sessions/{uuid.uuid4()}",
        json={"ended_at": None, "kept_ids": []},
    )
    assert r.status_code == 404


def test_close_malformed_game_session_id_returns_404(api):
    r = api.patch("/game-sessions/not-a-uuid", json={"ended_at": None, "kept_ids": []})
    assert r.status_code == 404

import uuid


def _client_id() -> str:
    return f"pytest-{uuid.uuid4()}"


def test_report_creates_and_returns_201(api, sample_expression_id):
    r = api.post("/reports", json={
        "expression_id": sample_expression_id,
        "reason": "other",
        "client_id": _client_id(),
    })
    assert r.status_code == 201
    assert r.json() == {"ok": True}


def test_report_minimal_body(api, sample_expression_id):
    # Only expression_id is required — reason/comment/client_id/ui_lang all optional.
    r = api.post("/reports", json={"expression_id": sample_expression_id})
    assert r.status_code == 201


def test_report_repeat_tap_same_client_is_idempotent(api, sample_expression_id):
    client_id = _client_id()
    r1 = api.post("/reports", json={
        "expression_id": sample_expression_id, "reason": "fabricated", "client_id": client_id,
    })
    r2 = api.post("/reports", json={
        "expression_id": sample_expression_id, "reason": "other", "client_id": client_id,
    })
    # A repeat tap must not error and must still report success (contract §2/§3 — one
    # open report per client_id+expression_id, silently deduped server-side).
    assert r1.status_code == 201
    assert r2.status_code == 201


def test_report_unknown_expression_returns_404(api):
    r = api.post("/reports", json={
        "expression_id": "this-expression-does-not-exist-at-all",
        "client_id": _client_id(),
    })
    assert r.status_code == 404


def test_report_invalid_reason_returns_422(api, sample_expression_id):
    r = api.post("/reports", json={
        "expression_id": sample_expression_id,
        "reason": "not-a-valid-reason",
        "client_id": _client_id(),
    })
    assert r.status_code == 422

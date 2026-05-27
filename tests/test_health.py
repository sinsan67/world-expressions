def test_root_returns_200(api):
    r = api.get("/")
    assert r.status_code == 200


def test_root_has_expression_counts(api):
    data = r = api.get("/")
    data = r.json()
    # Au moins une langue présente avec des expressions
    assert any(v > 0 for v in data.values() if isinstance(v, int))

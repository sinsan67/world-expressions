def test_random_returns_expression(api):
    r = api.get("/random")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert "expression" in data


def test_random_with_locale(api):
    r = api.get("/random", params={"locale": "fr"})
    assert r.status_code == 200
    data = r.json()
    assert "meaning" in data


def test_random_changes_between_calls(api):
    ids = {api.get("/random").json()["id"] for _ in range(5)}
    # Sur 5 appels, au moins 2 IDs différents (la base a des milliers d'expressions)
    assert len(ids) > 1

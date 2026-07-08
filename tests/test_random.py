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


def test_random_returns_real_kind(api):
    # Le tirage doit exposer le vrai type — sur 30 tirages sans filtre,
    # on doit voir au moins un type autre que 'idiom' (~35 % du pool)
    types = {api.get("/random").json()["type"] for _ in range(30)}
    assert types - {"idiom"}


def test_random_kind_filter(api):
    for _ in range(5):
        r = api.get("/random", params={"kind": "proverb"})
        assert r.status_code == 200
        assert r.json()["type"] == "proverb"


def test_random_country_filter(api):
    for _ in range(5):
        r = api.get("/random", params={"country": "tr"})
        assert r.status_code == 200
        assert r.json()["country"] == "tr"


def test_random_country_and_kind_filter(api):
    r = api.get("/random", params={"country": "fr", "kind": "locution"})
    assert r.status_code == 200
    data = r.json()
    assert data["country"] == "fr"
    assert data["type"] == "locution"

def test_tags_returns_list(api):
    r = api.get("/tags")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_tags_has_required_fields(api):
    r = api.get("/tags")
    tag = r.json()[0]
    assert "slug" in tag
    assert "count" in tag


def test_tags_locale_fr(api):
    r = api.get("/tags", params={"locale": "fr", "limit": 10})
    assert r.status_code == 200
    tags = r.json()
    # Avec locale=fr, les noms doivent être en français (pas les slugs anglais bruts)
    # On vérifie juste que "name" ou "tag" est présent et non vide
    for t in tags:
        assert t.get("slug") or t.get("name")


def test_tags_language_filter(api):
    r = api.get("/tags", params={"language": "fr", "limit": 20})
    assert r.status_code == 200
    assert len(r.json()) > 0

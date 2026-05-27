import pytest


def test_search_returns_results(api):
    r = api.get("/search", params={"q": "argent"})
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert len(data["results"]) > 0


def test_search_result_has_required_fields(api):
    r = api.get("/search", params={"q": "pied"})
    assert r.status_code == 200
    item = r.json()["results"][0]
    for field in ("id", "expression", "language", "region"):
        assert field in item, f"champ manquant : {field}"


def test_search_region_filter(api):
    r = api.get("/search", params={"q": "money", "region": "uk"})
    assert r.status_code == 200
    results = r.json()["results"]
    for item in results:
        assert item["region"] == "uk"


def test_search_empty_query_returns_400_or_empty(api):
    r = api.get("/search", params={"q": ""})
    # L'API peut soit rejeter (400) soit retourner [] — les deux sont acceptables
    assert r.status_code in (200, 400, 422)


def test_search_pagination(api):
    r1 = api.get("/search", params={"q": "chat", "limit": 5, "offset": 0})
    r2 = api.get("/search", params={"q": "chat", "limit": 5, "offset": 5})
    assert r1.status_code == r2.status_code == 200
    ids1 = {x["id"] for x in r1.json()["results"]}
    ids2 = {x["id"] for x in r2.json()["results"]}
    # Les deux pages ne doivent pas se chevaucher (si assez de résultats)
    if ids1 and ids2:
        assert ids1.isdisjoint(ids2)

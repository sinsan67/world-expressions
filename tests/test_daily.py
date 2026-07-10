from datetime import datetime, timezone


def test_daily_returns_expression(api):
    r = api.get("/daily")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert "expression" in data


def test_daily_has_today_date(api):
    r = api.get("/daily")
    assert r.status_code == 200
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert r.json()["date"] == today


def test_daily_is_deterministic_within_the_day(api):
    # Same UTC date -> same expression for everyone, every call.
    ids = {api.get("/daily").json()["id"] for _ in range(5)}
    assert len(ids) == 1


def test_daily_cache_control_header(api):
    r = api.get("/daily")
    assert r.headers.get("cache-control") == "public, max-age=3600"


def test_daily_excludes_japanese(api):
    # JA content is broken (Luke L3) and excluded from all game pools, including /daily.
    r = api.get("/daily")
    assert r.status_code == 200
    assert r.json()["language"] != "ja"


def test_daily_with_locale(api):
    r = api.get("/daily", params={"locale": "fr"})
    assert r.status_code == 200
    assert "meaning" in r.json()

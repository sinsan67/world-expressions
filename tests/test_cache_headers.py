CACHED_ROUTES = ["/tags", "/concepts", "/regions", "/countries", "/facets", "/type-counts", "/slugs", "/search?q=pied"]
NOT_CACHED_ROUTES = ["/random"]

EXPECTED = "public, max-age=3600, stale-while-revalidate=86400"


def test_cached_routes_have_cache_control(api):
    for route in CACHED_ROUTES:
        r = api.get(route)
        assert r.status_code == 200, f"{route} returned {r.status_code}"
        cc = r.headers.get("cache-control", "")
        assert cc == EXPECTED, f"{route}: expected '{EXPECTED}', got '{cc}'"


def test_non_cached_routes_have_no_cache_control(api):
    for route in NOT_CACHED_ROUTES:
        r = api.get(route)
        assert r.status_code == 200, f"{route} returned {r.status_code}"
        cc = r.headers.get("cache-control", "")
        assert cc == "", f"{route}: expected no Cache-Control, got '{cc}'"


def test_expression_detail_has_cache_control(api, sample_expression_id):
    r = api.get(f"/expression/{sample_expression_id}")
    assert r.status_code == 200, f"expression detail returned {r.status_code}"
    cc = r.headers.get("cache-control", "")
    assert cc == EXPECTED, f"expression detail: expected '{EXPECTED}', got '{cc}'"

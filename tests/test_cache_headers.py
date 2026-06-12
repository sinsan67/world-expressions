CACHED_ROUTES = ["/tags", "/concepts", "/regions", "/countries", "/facets", "/type-counts", "/slugs"]
NOT_CACHED_ROUTES = ["/search?q=pied", "/random"]

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

# Jeu 3 — Constellation de proverbes (docs/game3-constellation-lot0-contract.md).
#
# /constellation/graph is a pure read of the checked-in
# data/constellation_graph.json (built from the DEV database, ~151 nodes) —
# its content is independent of whatever this test suite seeds into the
# throwaway CI database, so these tests only assert structural shape/cache/
# locale behaviour, never specific tag content.
#
# /constellation/tag/{tag} is NOT scoped to that curated graph — it looks up
# any real tag slug directly in `tags`/`expression_tags` — so it IS exercised
# against tests/seed_ci_db.py's fixtures: "patience" (2 proverbs, fr + tr) for
# the happy path, "bluntness" (tagged only on an idiom, no proverb) for the
# empty-examples path.

CACHE_CONTROL_24H = "public, max-age=86400, stale-while-revalidate=604800"


# ─── GET /constellation/graph ───

def test_constellation_graph_shape(api):
    r = api.get("/constellation/graph")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("nodes"), list)
    assert isinstance(data.get("edges"), list)
    assert len(data["nodes"]) > 0
    node = data["nodes"][0]
    assert set(node.keys()) == {"tag", "emoji", "label", "x", "y"}
    assert isinstance(node["tag"], str) and node["tag"]
    assert isinstance(node["emoji"], str) and node["emoji"]
    assert isinstance(node["label"], str) and node["label"]
    assert isinstance(node["x"], (int, float))
    assert isinstance(node["y"], (int, float))


def test_constellation_graph_edges_reference_valid_node_indices(api):
    r = api.get("/constellation/graph")
    data = r.json()
    n = len(data["nodes"])
    assert len(data["edges"]) > 0
    for edge in data["edges"]:
        assert len(edge) == 2
        i, j = edge
        assert 0 <= i < n
        assert 0 <= j < n
        assert i != j


def test_constellation_graph_cache_control_header(api):
    r = api.get("/constellation/graph")
    assert r.headers.get("cache-control") == CACHE_CONTROL_24H


def test_constellation_graph_locale_labels_differ(api):
    # en vs ja should diverge on at least one label (same tags, same order —
    # only the label pulled from the per-node `labels` object changes).
    r_en = api.get("/constellation/graph", params={"locale": "en"})
    r_ja = api.get("/constellation/graph", params={"locale": "ja"})
    assert r_en.status_code == 200
    assert r_ja.status_code == 200
    nodes_en = r_en.json()["nodes"]
    nodes_ja = r_ja.json()["nodes"]
    assert len(nodes_en) == len(nodes_ja) > 0
    assert [n["tag"] for n in nodes_en] == [n["tag"] for n in nodes_ja]
    assert any(a["label"] != b["label"] for a, b in zip(nodes_en, nodes_ja))


def test_constellation_graph_unknown_locale_falls_back_to_en(api):
    r_en = api.get("/constellation/graph", params={"locale": "en"})
    r_xx = api.get("/constellation/graph", params={"locale": "xx"})
    assert r_xx.status_code == 200
    assert r_xx.json()["nodes"] == r_en.json()["nodes"]


# ─── GET /constellation/tag/{tag} ───

def test_constellation_tag_patience_happy_path(api):
    # seed_ci_db.py tags exactly 2 proverbs "patience": fr + tr. No ja proverb
    # exists on this tag either way, but the endpoint's JA exclusion is a
    # blanket rule (Luke L3) applied regardless of what's seeded.
    r = api.get("/constellation/tag/patience", params={"locale": "fr"})
    assert r.status_code == 200
    data = r.json()
    assert data["tag"] == "patience"
    assert "emoji" in data and "label" in data
    examples = data["examples"]
    assert len(examples) == 2
    langs = [e["language"] for e in examples]
    assert set(langs) == {"fr", "tr"}
    assert len(langs) == len(set(langs))  # distinct languages, no dupes
    assert "ja" not in langs
    for e in examples:
        assert set(e.keys()) == {"expression_id", "text", "language", "meaning", "country"}
        assert e["text"]


def test_constellation_tag_bluntness_has_no_proverb_examples(api):
    # seed_ci_db.py tags "bluntness" only on an idiom (mettre-les-pieds-dans-
    # le-plat), never on a proverb — the tag itself exists (200), but the
    # proverb-only query returns no rows.
    r = api.get("/constellation/tag/bluntness", params={"locale": "en"})
    assert r.status_code == 200
    data = r.json()
    assert data["tag"] == "bluntness"
    assert data["examples"] == []


def test_constellation_tag_unknown_slug_404(api):
    r = api.get("/constellation/tag/this-tag-does-not-exist-anywhere")
    assert r.status_code == 404

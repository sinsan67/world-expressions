def test_expression_by_id(api, sample_expression_id):
    r = api.get(f"/expression/{sample_expression_id}")
    assert r.status_code == 200
    data = r.json()
    for field in ("id", "expression", "language", "region"):
        assert field in data


def test_expression_with_lang_param(api, sample_expression_id):
    r = api.get(f"/expression/{sample_expression_id}", params={"lang": "en"})
    assert r.status_code == 200
    # translation peut être null si non encore générée, mais le champ doit exister
    assert "translation" in r.json()


def test_expression_unknown_id_returns_404(api):
    r = api.get("/expression/ce-slug-nexiste-pas-du-tout")
    assert r.status_code == 404

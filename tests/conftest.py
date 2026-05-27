import os
import pytest
import httpx

# Pointer BASE_URL vers local, staging ou prod selon l'env
# Ex: BASE_URL=https://world-expressions.onrender.com pytest tests/
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def api():
    """Client HTTP synchrone réutilisé sur toute la session de test."""
    with httpx.Client(base_url=BASE_URL, timeout=90.0) as client:
        yield client


@pytest.fixture(scope="session")
def sample_expression_id(api):
    """Récupère un ID d'expression valide depuis /random pour les tests suivants."""
    r = api.get("/random")
    assert r.status_code == 200
    return r.json()["id"]



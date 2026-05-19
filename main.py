import json
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Expressions du Monde API")

# Autoriser le frontend à appeler cette API (nécessaire quand le HTML est ouvert en local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Chargement des expressions au démarrage du serveur (une seule fois en mémoire)
DATA_PATH = Path(__file__).parent / "data" / "expressions.json"
with open(DATA_PATH, encoding="utf-8") as f:
    EXPRESSIONS = json.load(f)


def normaliser(texte: str) -> str:
    """Convertit en minuscules pour une comparaison insensible à la casse."""
    return texte.lower().strip()


def chercher(query: str) -> list[dict]:
    """
    Recherche une expression par mot-clé.

    Deux types de correspondance, dans l'ordre de priorité :
    - "exact"     : le mot apparaît dans le texte de l'expression elle-même
    - "semantique": le mot apparaît dans la signification, les tags ou l'exemple
    """
    q = normaliser(query)
    if not q:
        return []

    resultats_exacts = []
    resultats_semantiques = []

    for expr in EXPRESSIONS:
        dans_expression = q in normaliser(expr["expression"])
        dans_signification = q in normaliser(expr["signification"])
        dans_tags = any(q in normaliser(tag) for tag in expr["tags"])
        dans_exemple = q in normaliser(expr.get("exemple", ""))
        dans_origine = q in normaliser(expr.get("origine", ""))

        if dans_expression:
            resultats_exacts.append({**expr, "match_type": "exact"})
        elif dans_signification or dans_tags or dans_exemple or dans_origine:
            resultats_semantiques.append({**expr, "match_type": "semantique"})

    # Les correspondances exactes apparaissent en premier
    return resultats_exacts + resultats_semantiques


@app.get("/")
def accueil():
    return {
        "message": "Bienvenue sur l'API Expressions du Monde",
        "expressions_chargees": len(EXPRESSIONS),
        "usage": "GET /recherche?q=votre_mot",
    }


@app.get("/recherche")
def recherche(q: str = Query(..., min_length=2, description="Mot à rechercher")):
    """
    Recherche des expressions liées à un mot.
    Retourne les correspondances exactes d'abord, puis les correspondances sémantiques.
    """
    resultats = chercher(q)
    return {
        "query": q,
        "total": len(resultats),
        "exacts": sum(1 for r in resultats if r["match_type"] == "exact"),
        "semantiques": sum(1 for r in resultats if r["match_type"] == "semantique"),
        "resultats": resultats,
    }


@app.get("/expression/{expression_id}")
def detail_expression(expression_id: str):
    """Retourne le détail complet d'une expression par son identifiant."""
    for expr in EXPRESSIONS:
        if expr["id"] == expression_id:
            return expr
    return {"erreur": f"Expression '{expression_id}' introuvable"}, 404

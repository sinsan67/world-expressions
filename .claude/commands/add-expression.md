Aide l'utilisateur à ajouter une nouvelle expression à la base de données.

## Étape 1 — Collecter les informations

Demande à l'utilisateur les champs suivants (un à un ou tous d'un coup s'il les a déjà) :

- **expression** : le texte de l'expression (ex: "Avoir le cafard")
- **meaning** : ce que ça veut dire
- **origin** : d'où ça vient (histoire, étymologie)
- **example** : une phrase d'exemple avec l'expression
- **register** : niveau de langue — une seule valeur parmi `standard`, `informal`, `slang`, `vulgar`, `formal`
- **tags** : liste de mots-clés (ex: animaux, émotions, travail). Consulte les top tags existants pour rester cohérent.
- **language** : `fr` pour français, `en` pour anglais
- **region** : code pays d'origine (ex: `fr`, `uk`, `us`, `au`). Utilise le même code que `language` si l'expression est nationale.

## Étape 2 — Générer l'ID

Génère un `id` en kebab-case à partir du texte de l'expression :
- Tout en minuscules
- Accents supprimés (é→e, à→a, ç→c, etc.)
- Espaces et apostrophes remplacés par des tirets
- Articles en tête conservés si l'expression commence par un article
- Exemple : "Avoir le cafard" → `avoir-le-cafard`

## Étape 3 — Vérifier les doublons

Avant d'insérer, vérifie qu'aucune expression avec le même `id` n'existe déjà dans `data/expressions.json`. Si c'est le cas, signale-le et demande confirmation.

## Étape 4 — Insérer dans les deux sources

1. Ajoute l'expression à la fin du tableau dans `data/expressions.json` avec `"illustration": null`.
2. Insère-la directement dans SQLite via ce script Python en ligne :

```python
import json, sqlite3
from pathlib import Path

expr = <le dict de la nouvelle expression>

# Ajout JSON
json_path = Path("data/expressions.json")
data = json.load(open(json_path, encoding="utf-8"))
data.append(expr)
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Ajout SQLite
conn = sqlite3.connect("data/expressions.db")
conn.execute("""
    INSERT INTO expressions (id, expression, meaning, origin, example, register, language, region, illustration, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (expr["id"], expr["expression"], expr["meaning"], expr.get("origin"),
      expr.get("example"), expr["register"], expr["language"], expr.get("region"),
      None, json.dumps(expr["tags"], ensure_ascii=False)))
conn.commit()
conn.close()
print(f"Expression '{expr['id']}' ajoutée.")
```

## Étape 5 — Confirmer

Affiche la fiche complète de l'expression ajoutée et le nouveau total d'expressions dans la base.

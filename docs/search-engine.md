# Moteur de recherche — Comment ça marche

*Expressions du Monde — référence interne, session 35*

---

## Lexique

| Terme | Définition |
|-------|------------|
| **Expression** | Phrase idiomatique stockée en base avec ses champs : texte, sens, origine, exemple, registre, tags, région, langue. |
| **Slug** | Identifiant texte normalisé : minuscules, sans accents, tirets à la place des espaces. Ex : `"argent"`, `"casser-les-pieds"`, `"money"`. C'est la clé technique d'une expression ou d'un tag. |
| **Tag** | Étiquette thématique attachée à une expression. Toujours stockée en anglais sous forme de slug. Ex : `money`, `work`, `love`, `fear`. Une expression peut avoir plusieurs tags. |
| **Tag name** | Traduction affichable d'un slug de tag dans une langue donnée. Ex : slug `money` → FR `argent`, ES `dinero`, TR `para`. Stocké dans la table `tag_names`. |
| **Concept** | Synonyme de tag dans le contexte de la recherche. Un "concept" est un slug de tag utilisé comme pivot multilingue pour relier des expressions de langues différentes. |
| **FTS / trigramme** | Technologie PostgreSQL utilisée *sous le capot* par les passes 1 à 3 — pas une passe à part. Pour le texte latin : `tsvector`/`ts_rank`/`websearch_to_tsquery`, avec un dictionnaire de stemming par langue (français, anglais, espagnol...). Pour les requêtes japonaises/chinoises/coréennes (tokenisation par espace inopérante) : repli sur `pg_trgm`/`ILIKE` (similarité de trigrammes). |
| **match_type** | Champ retourné par l'API sur chaque résultat, indiquant comment l'expression a été trouvée : `exact`, `semantic`, `translation`, `concept`. |
| **Region** | Code pays de l'expression (`fr`, `uk`, `us`, `au`, `es`, `it`, `tr`). Une expression en anglais peut être `uk` (britannique) ou `us` (américaine). |
| **Language** | Langue source de l'expression (`fr`, `en`, `es`, `it`, `tr`). Plus général que region : toutes les expressions en anglais ont `language = "en"`, qu'elles soient UK ou US. |

---

## Les 4 passes de recherche

Quand l'utilisateur tape un mot et appuie sur Rechercher, la fonction `search_expressions()` côté backend enchaîne jusqu'à 4 passes dans l'ordre. Chaque passe cherche dans les expressions *qui n'ont pas encore été trouvées par la passe précédente*.

### Passe 1 — Correspondance exacte

> Cherche le mot tel quel dans le **texte de l'expression**.

- Exemple : taper `pied` → trouve `casser les pieds`, `lever le pied`, etc.
- Match type retourné : `exact`

### Passe 2 — Correspondance sémantique

> Cherche le mot dans les champs **sens**, **tags**, **exemple** et **origine**.

- Exemple : taper `agacer` → trouve `casser les pieds` (dont le sens mentionne "agacer")
- Capture les expressions où le mot cherché *décrit* l'expression sans apparaître dans son texte
- Match type : `semantic`

### Passe 3 — Traduction (cross-langue)

> Cherche le mot dans les **traductions** d'une expression vers d'autres langues, stockées dans `content_translations` (sens, origine, exemple traduits — pensé pour un lecteur qui ne connaît pas la langue d'origine).

- Exemple : une expression turque n'ayant pas le mot cherché dans son texte ni dans son sens natif peut remonter si sa traduction française stockée dans `content_translations` contient ce mot
- Complémentaire à la passe 2 : celle-ci ne regarde que le contenu natif de l'expression, la passe 3 regarde son contenu *traduit*, dans toutes les langues cibles
- Match type : `translation`

### Passe 4 — Concepts multilingues (cross-language)

> Traduit le mot cherché en **slug de tag**, puis remonte toutes les expressions tagguées avec ce concept — dans toutes les langues.

C'est la passe la plus puissante pour la navigation multilingue. Elle fonctionne ainsi :

1. Le mot cherché (ex : `argent`) est cherché dans `tag_names` → slug `money`
2. Toutes les expressions tagguées `money` sont remontées, **quelle que soit leur langue**
3. Résultat : une recherche en français (`argent`) remonte des expressions en anglais, espagnol, turc, etc.

- Match type : `concept`

**Exemple concret :**
```
GET /search?q=argent&limit=100

Passe 1 : 18 expressions FR contenant "argent" dans leur texte
Passe 2 : 4 expressions FR supplémentaires avec "argent" dans le sens
Passe 3 : quelques expressions supplémentaires dont une traduction (dans une langue cible) mentionne "argent"
Passe 4 : ~59 expressions EN/TR/ES/IT tagguées "money" (non encore trouvées)
```

---

## Ce que ça donne côté utilisateur

| Recherche | Ce qui remonte |
|-----------|----------------|
| `pied` | Toutes les expressions FR contenant le mot "pied" |
| `agacer` | Expressions dont le **sens** mentionne "agacer" (ex : *casser les pieds*) |
| `argent` | Expressions FR + toutes les expressions EN/TR/ES/IT sur le thème `money` |
| `industry` | Expressions EN + expressions FR/ES/IT/TR sur les thèmes `work`, `business` |
| `work` (concept) | Toutes les expressions tagguées `work` dans toutes les langues |

---

## Filtres disponibles dans l'interface

- **Filtre par pays** : restreint les résultats à un ou plusieurs pays (`region=fr,en`) — envoyé à l'API, pas appliqué côté client
- **Tri "Par pays"** : regroupe les résultats reçus par pays en sections, avec header (🇫🇷 France · N expressions) — traitement côté client uniquement, pas de nouvel appel API
- **Tri "Pertinence"** : ordre original retourné par l'API (passes 1 → 4, les résultats exacts en premier)

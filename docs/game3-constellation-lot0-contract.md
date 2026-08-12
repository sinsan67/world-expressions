# Jeu 3 — Constellation de proverbes — Lot 0 Contract

**Status: DRAFT — awaiting Sinan validation before any build (S234, 2026-08-12).**

Upstream: 2 wireframes de comparaison (S233, `scratchpad/wireframe-game3-*.html`,
détail dans la mémoire `game3-wireframes.md`) → piste **Constellation** retenue
sur la carte du monde (S234) → 4 matrices de décision tranchées le même jour
(source des nœuds, sélection éditoriale, emplacement du graphe, contenu au tap),
appuyées sur des requêtes de vérification en DB dev (voir §0). Ce fichier suit
le même format que `pivot-lot0-contract.md` (pivot hub de jeux), à l'échelle
d'un seul petit jeu.

---

## 0. Decisions feeding this contract (S234)

- **Piste** : constellation d'emojis (vs carte du monde, écartée après test des
  2 wireframes).
- **Périmètre : proverbes uniquement** (`kind='proverb'`) — pas les idiomes.
  Décision Sinan S234, en cohérence avec le persona « collectionne les
  proverbes » de l'atelier S194 (savourer, pas apprendre une langue).
- **Source des paires cross-lingues au tap : tags thématiques**
  (`tags`/`expression_tags`), **pas** la table `concepts` — sur les proverbes,
  `concepts` tombe à 1,3 % de couverture (3 groupes multi-langues seulement,
  vérifié en DB dev), contre 100 % de couverture par tag.
- **Sélection des nœuds** : seuil **≥3 langues et ≥10 proverbes** par tag →
  **44 nœuds candidats** sur la DB dev (6 langues, 1944 proverbes) — à
  revalider sur prod (plus de langues/volume, probablement plus de nœuds
  passeront le seuil). Curation manuelle légère autorisée pour privilégier les
  emoji les plus lisibles quand plusieurs tags équivalents en richesse
  s'offrent au choix (ex. préférer family 👨‍👩‍👧 à un tag abstrait équivalent).
  Top du classement (dev) : wisdom (6 langues/671), nature (6/160),
  responsibility (6/87), family (6/87), time (6/86), health (6/86),
  justice (6/84), friendship (6/79), fate (6/78), love (6/67), work (6/66)...
- **Graphe (positions + arêtes)** : **précalculé, JSON statique versionné dans
  le repo**, régénéré à la main via un script quand la base évolue
  significativement — pas de calcul serveur à la volée (mêmes coûts qu'une
  carte SVG figée, cf. piste A écartée).
- **Contenu affiché au tap** : requête à la demande (2-3 proverbes du tag,
  langues distinctes), pas de préchargement du contenu de tous les nœuds.
- **Moteur pan/zoom** : reprend tel quel le verdict du spike perf S197
  (Pointer Events natifs + CSS `transform` sur un wrapper, pas de librairie —
  déjà stress-testé à 1600 nœuds fluide sur desktop, largement au-dessus des
  44 nœuds réels ici). Écart au wireframe : **retirer `backdrop-filter`** sur
  `.node` (coût de compositing élevé sur mobile bas de gamme à ce nombre de
  nœuds simultanés, remplacé par un simple fond semi-transparent sans flou).
  Test `gesturestart`/Safari mobile réel obligatoire avant merge (jamais
  formellement clos depuis le spike).
- **JA exclu** des pools de ce jeu, comme tous les jeux (règle existante,
  jusqu'à correction Luke L3).

### Ouvert — à trancher avec Sinan avant ou pendant le build (pas bloquant pour ce contrat)

1. **Nom final du jeu.** Placeholder ci-dessous : route `/constellation`, nom
   interne « Constellation ». Wording FR définitif + déclinaison 7 langues
   différés au lot i18n, même séquençage que Voyage/Révision (nom tranché
   après un passage mockup/test, pas à ce stade).
2. **❤️ Garder écrit-il dans les favoris existants ?** Reco par défaut : oui,
   réutilise `POST /users/{id}/favorites/{expression_id}` sans rien de neuf.
3. **Trace-t-on une "partie" en DB (`game_sessions`) ?** Reco par défaut :
   **non** — ce jeu est une exploration libre sans début/fin de partie
   définis (contrairement à Voyage/Révision), plus proche d'Atlas/Explorer
   (jamais tracé) que d'une partie à 10 cartes. Seul le ❤️ compte comme
   signal.

---

## 1. Routes & navigation

| Route | Écran | Changement |
|---|---|---|
| `/constellation` | Jeu 3 — constellation de proverbes (nom d'affichage FR final TBD) | **Nouveau** |
| `/` (hub) | La carte « bientôt » du jeu SVG, déjà prévue au hub depuis le pivot (S194), devient une vraie carte jouable → lien vers `/constellation` | Changement mineur (carte existante, lien à activer) |

Pas de redirection à gérer — aucune route existante n'est absorbée
(contrairement à Voyage qui reprenait `/random-mode`).

---

## 2. Data model

**Additif uniquement — pas de migration Alembic pour ce lot** (sous réserve
des réponses aux points ouverts 2 et 3 ci-dessus, tous deux réutilisent
l'existant par défaut).

Le graphe (liste des ~44 tags-nœuds + positions x/y + arêtes) n'est **pas une
table DB** : c'est un artefact statique versionné dans le repo
(`web/lib/constellationGraph.json` ou équivalent), généré par un script
one-shot (`scripts/build_constellation_graph.py`) qui :
1. interroge `tags` / `expression_tags` / `expressions` avec le seuil validé
   (`kind='proverb'`, ≥3 langues, ≥10 expressions) ;
2. calcule un layout (force-directed hors-ligne, ou repositionnement manuel
   comme dans le wireframe) ;
3. écrit le JSON figé.

Se régénère à la main (pas à chaque déploiement) quand la base de proverbes
évolue significativement — même logique que la carte du monde statique de la
piste écartée.

---

## 3. API contract

Deux nouveaux endpoints, aucune migration :

| Endpoint | Requête | Réponse | Usage |
|---|---|---|---|
| `GET /constellation/graph` | *(aucun paramètre, ou `locale=` pour les labels traduits)* | `{nodes: [{tag, emoji, label, x, y}], edges: [[i,j]]}` — servi depuis le JSON statique (lecture fichier, pas de requête SQL par appel), cache public long (24h+, ne change qu'à la régénération) | Chargement initial du jeu |
| `GET /constellation/tag/{tag}` | `locale=` | `{tag, emoji, label, examples: [{expression_id, text, language, meaning, country}]}` — 2-3 proverbes du tag, langues distinctes tirées parmi celles disponibles, JA exclu | Tap sur un nœud |

Réutilise le favori existant (`POST /users/{user_id}/favorites/{expression_id}`)
pour « ❤️ Garder » — aucun changement à cet endpoint (sous réserve du point
ouvert 2).

---

## 4. i18n keys

`constellationLabels.ts` — même pattern que les autres jeux (`hubLabels.ts`,
`voyageLabels.ts`...) : EN + FR remplis au lot de build, es/it/tr/de/ja
complétés + wording arbitré avec Sinan au lot i18n (nom final compris, cf.
point ouvert 1).

Clés : `title` · `hint` (description du geste pan/zoom/tap, pas de jargon
technique) · `reveal` · `keepBtn` · `close` · `placeholder` (nœud sans contenu
— ne devrait plus arriver avec le seuil ≥3 langues/≥10 proverbes, gardé par
sécurité si prod donne moins de nœuds que dev).

---

## 5. Lots & plan de release

Contrairement au pivot hub (6+ lots parallèles), ce jeu est petit — **un seul
lot suffit**, pas de "Lot API" séparé (pas de migration) :

| Lot | Contenu | Modèle |
|---|---|---|
| **Graphe** | Script `build_constellation_graph.py` + JSON figé dans le repo | Sonnet 5 |
| **Jeu** | Route `/constellation`, moteur pan/zoom (repris du wireframe, sans `backdrop-filter`), overlay devinette/révélation branché sur les 2 endpoints, bouton ❤️ | Sonnet 5 |
| **Nav** | Activer la carte « bientôt » du hub → lien réel vers `/constellation` | Haiku |
| **i18n** | `constellationLabels.ts` 7 langues, wording final du nom arbitré avec Sinan | Haiku, après le point ouvert 1 |

Les 2 endpoints (§3) peuvent être ajoutés dans le même PR que le lot « Jeu »
— pas besoin d'un lot API séparé mergé en amont comme pour le pivot (aucune
dépendance de déploiement backend-avant-frontend ici, contrairement au pivot
où Render = prod unique imposait l'ordre).

---

## 6. Notes d'implémentation

- Reprend le moteur pan/zoom de `scratchpad/wireframe-game3-constellation.html`
  quasiment tel quel (Pointer Events + CSS transform déjà validé par le
  spike S197) — seul écart : retirer `backdrop-filter` des `.node`.
- Le script générateur de graphe doit tourner sur les données **prod** avant
  tout lancement réel — les comptes du §0 viennent de la DB dev (6 langues,
  1944 proverbes), pas de la prod (7-8 langues, volumes plus grands d'après
  `MEMORY.md`).
- Tester `gesturestart` sur Safari mobile réel avant merge.
- Lot owner : lire `web/AGENTS.md` avant tout code Next.js (breaking changes
  vs training data).

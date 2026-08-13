# PRD — ColdStartCard

**Statut** : shippé sur staging (`7c1e3d1`, S230) — validation visuelle en cours (S231)
**Auteur** : Claude, à la demande de Sinan (S230)
**Composants** : `web/components/home/ColdStartCard.tsx`, `web/app/Hub.tsx`, `scripts/export_cold_start_proverbs.py`, `web/lib/coldStartProverbs.json`

## 1. Problème

L'hébergement backend (Render, plan gratuit) met le service en veille après ~15 minutes d'inactivité. Le réveil ("cold start") prend 30 à 60 secondes. Pendant ce délai, la page d'accueil (`Hub.tsx`) appelle `GET /daily` pour afficher l'expression du jour dans le `DailyPostcard` — et cet appel n'a **aucun timeout côté client**.

Résultat pour un visiteur qui tombe sur un serveur endormi : un skeleton gris figé, sans explication, pendant jusqu'à une minute. Sur un plan gratuit assumé, ce silence ressemble à une panne plutôt qu'à une attente normale — le pire moment possible pour perdre un nouveau visiteur.

**Root cause découverte en S230** : un mécanisme de détection cold start existait déjà (`ColdStartCard.tsx`, livré historiquement sur l'ancienne `HeroSection.tsx`), mais `HeroSection.tsx` n'est plus montée par aucune page depuis le pivot games-hub (`Hub.tsx` a remplacé `HomePage.tsx`) — personne n'avait reconnecté le mécanisme. C'était du code mort, pas une feature qui ne marchait pas.

## 2. Objectif

Transformer un silence anxiogène en moment de contenu — remplacer le skeleton figé par une carte qui montre un vrai proverbe pendant l'attente, avec une explication honnête ("notre serveur (plan gratuit) sort de sa sieste") plutôt qu'un état de chargement muet.

Objectif produit secondaire, aligné sur le principe UX *Playfulness & Delight* du projet (CLAUDE.md) : transformer une contrainte technique (hébergement gratuit) en occasion de contenu plutôt que de la subir comme un défaut à cacher.

## 3. Non-objectifs

- Ne résout pas la latence elle-même (upgrade Render payant = hors scope, décision business pas produit).
- Ne couvre pas le cas d'un **vrai échec** de `/daily` (backend up mais requête en erreur) — actuellement le même skeleton figé s'affiche indéfiniment dans ce cas aussi, `.catch(() => {})` avale l'erreur en silence. Voir section 7 (dette).
- Pas de mesure/analytics dédiée sur la fréquence des cold starts en prod (hors scope V1).

## 4. Expérience utilisateur

**Déclenchement** : `Hub.tsx` lance `GET /daily` au montage. Si `dailyLoading` reste `true` après **5 secondes**, l'état `coldStart` passe à `true` et remplace `DailyPostcard` par `ColdStartCard` dans le même emplacement visuel (juste sous `CollectionStrip`). Dès que `/daily` répond (`dailyLoading` repasse à `false`), la carte redevient `DailyPostcard` — bascule silencieuse, pas de transition dédiée.

**Contenu de la carte** (`ColdStartCard.tsx`) :
- Drapeau + label "Proverbe du jour" (traduit dans les 7 langues UI)
- Le proverbe dans sa langue source
- Sa traduction mot-à-mot ("Mot à mot : « ... »") — masquée si la langue source == langue UI du visiteur
- Son sens, dans la langue UI du visiteur
- Un tampon ☕ (visuel "pause café") + texte d'explication honnête sur la cause (serveur gratuit qui se réveille, ~30s)
- Une barre de progression qui se remplit sur ~45s (`setInterval` 1s, `+100/45` par tick, plafonnée à 96% — jamais 100%, car on ne sait pas réellement quand ça va répondre)

**Décision de contenu (arbitrée avec Sinan en S230)** : carte "découverte cross-culturelle" — le proverbe du jour peut venir de **n'importe quelle langue de l'app**, pas forcément celle du visiteur. Un visiteur FR peut voir un proverbe espagnol, avec sa traduction littérale en français et son sens en français. Alternative écartée : un proverbe toujours dans la langue du visiteur (jugé moins surprenant, moins fidèle à l'esprit "chaque langue a sa propre folie" du projet).

## 5. Design technique

**Pourquoi un contenu figé plutôt qu'un appel API** : la carte s'affiche précisément quand l'API est indisponible — impossible de fetcher du contenu dynamique à ce moment-là. La solution retenue gèle 365 proverbes réels (un par jour de l'année, rotation déterministe sur `dayOfYearUTC() % 365`) directement dans le bundle frontend.

**Génération du pool** (`scripts/export_cold_start_proverbs.py`) :
- Source : DB prod, table `expressions` (kind=`proverb`) + `expression_content` + `content_translations`
- Filtre qualité : un proverbe n'est éligible que si sa traduction (sens **et** littéral) existe et fait ≥4 caractères dans les 6 autres langues UI — sinon la carte serait cassée pour une partie des visiteurs selon leur langue
- ~52-53 proverbes par langue source (répartition quasi égale sur les 7 langues : fr 52, en 52, es 50, it 53, tr 53, de 53, ja 52 — état S230), tirage aléatoire seedé (`random.seed(42)`, reproductible) puis troncature à 365
- Sortie : `web/lib/coldStartProverbs.json`, ~370 Ko gzip, zéro appel réseau au runtime

**Format d'une entrée** :
```json
{
  "id": "...",
  "expression": "texte du proverbe",
  "sourceLang": "es",
  "country": "es",
  "translations": { "fr": {"meaning": "...", "literal": "..."}, ... },
  "day": 0
}
```

**Rendu** : `PROVERBS[dayOfYearUTC() % PROVERBS.length]` — même proverbe pour tous les visiteurs d'un jour UTC donné (cohérent avec le mécanisme "expression du jour" utilisé ailleurs dans l'app, ex. `/daily`).

## 6. Vérification effectuée

- **S230, locale** : simulation Playwright par interception réseau (route `/daily` jamais résolue) — la carte apparaît après 5s avec un vrai contenu (cas testé : proverbe ES affiché à un visiteur FR, littéral + sens en français). `tsc`/build propres.
- **S231** : validation sur un cold start Render réel — voir section 8.

## 7. Dette connue (hors scope de cette feature, notée pour suite)

- `getDailyExpression()` (`web/lib/api.ts`) n'a pas de timeout. Un vrai échec de `/daily` (backend up, erreur applicative) laisse le skeleton figé indéfiniment — `ColdStartCard` ne se déclenche que sur la lenteur (5s), pas sur l'échec en tant que tel, mais dans les deux cas `dailyLoading` reste bloqué à `true` si la promesse ne se résout jamais. Piste : `AbortController` + fallback explicite.
- `HeroSection.tsx` (composant historique qui montait l'ancienne version de `ColdStartCard`) reste dans le repo, orphelin depuis le pivot games-hub — à confirmer et nettoyer si vraiment mort (voir tech-debt).

## 8. Suivi

- [ ] Validation visuelle sur un cold start Render réel (S231, en cours)
- [ ] Décision sur le fix timeout `/daily` (section 7) — priorité à trancher avec Sinan

# QA — Session 2 (2026-07-16, Sinan, PWA Android installée sur Samsung Galaxy S23) — analyse code

Méthode identique à la session 1 (`qa-session1-analysis.md`) : chaque item de
`QA - Bug Review 2.md` a été rattaché au code réel (fichiers + lignes), avec
hypothèse de root cause (bugs) ou point d'implémentation (améliorations).
Aucune modification de code effectuée — synthèse uniquement, validation à
faire avec Sinan avant toute implémentation.

---

## 🔴 Bugs

### [Urgent] Cold start / Pays qui ne s'affichent pas (1er lancement PWA)

**Fichiers clés :**
- `web/components/voyage/VoyageSetup.tsx:38-40` — `getCountries().then(setCountries).catch(() => {})` : **aucun retry, aucun état d'erreur, échec avalé silencieusement.**
- `web/lib/api.ts:377-381` (`getCountries`) — comparé à `getGlobalStats` (`api.ts:387-405`) et `postGameSession` (`api.ts:264-285`), qui ont un **retry avec backoff explicitement commenté** : *"Render's single instance flakes on cold hits (~1 request in 2 fails): retry before giving up"*.
- `web/app/sw.ts:14-29` — le service worker masque le cold start Render (30-50s) via `StaleWhileRevalidate`, **mais seulement s'il existe déjà un cache d'une visite précédente**. À la toute première installation PWA, aucun cache n'existe.
- `web/components/home/ColdStartCard.tsx` n'est monté que dans `HeroSection.tsx:338` (page d'accueil) — **jamais dans le flux Voyage/Setup**.

**Root cause** : le pattern retry/cold-start déjà en place ailleurs (`getGlobalStats`, `postGameSession`) n'a pas été appliqué à `getCountries()`. Sur premier lancement PWA (aucun cache SW), le cold start Render fait échouer/traîner l'appel `/countries`, et `VoyageSetup` se retrouve avec une liste vide sans aucun signal.

**Impact** : bloquant (empêche de jouer au premier lancement). **Effort** : < 1h — répliquer le pattern retry déjà écrit pour `getGlobalStats`/`postGameSession` sur `getCountries()`, + état de chargement/erreur visible dans `VoyageSetup.tsx` (le message rassurant suggéré par Sinan peut servir d'état intermédiaire pendant le retry).

---

### [Moyenne] Publicité Pinterest inattendue

Recherche exhaustive (`grep -rn "pinterest"` sur tout `web/`, hors `node_modules`) → **aucun résultat**. Vérifié aussi `layout.tsx` (scripts tiers = uniquement Vercel Analytics + GA), `sw.ts`, `manifest.json` → rien.

**Conclusion** : rien dans le code ne référence Pinterest ni aucune intégration publicitaire. Probable artefact externe (extension navigateur Android, suggestion système Samsung/Chrome "Discover", pub injectée par l'OS/navigateur) — **pas un bug côté code**, à observer à nouveau côté device si ça se reproduit.

**Impact/Effort** : rien à faire côté code pour l'instant — sauf si ça se reproduit et qu'on identifie une source précise.

---

### [Urgent] Session perdue au retour d'app (PWA Android, redirigé vers filtres)

**Fichier clé :** `web/app/voyage/Voyage.tsx:44-51` — toute la machine à états (phase `setup`/`play`/`recap`, session, `cardIndex`, favoris en cours) vit en `useState` React pur, **sans persistance** (aucun `localStorage`/`sessionStorage` dans `web/app/voyage/` ni `web/components/voyage/`) et **sans navigation** associée (aucun `router.push`/`router.replace` — commentaire ligne 11-12 : *"Single client route holding all 3 phases in-component state"*).

Pattern de persistance déjà existant ailleurs, mais jamais réutilisé ici : `web/lib/carnet.ts:112,136` (`localStorage.getItem/setItem`, avec migration versionnée).

**Root cause** : Android tue le processus WebView de la PWA en arrière-plan (comportement standard, libération mémoire). Au retour, Next.js redémarre sur `/voyage` (état par défaut `phase: "setup"`) — toute la partie en cours est perdue.

**Impact** : bloquant, jugé inacceptable par le testeur. **Effort** : demi-journée — persister `session`/`phase`/`cardIndex`/`keptIds` dans `sessionStorage` (pattern proche de `carnet.ts`), restaurer au montage de `Voyage.tsx` si une session valide existe.

---

### [Moyenne] Écran blanc en fin de session sans favoris

**Fichier :** `web/components/voyage/VoyageRecap.tsx` — vérifié en détail : les blocs conditionnels (`keptCards.length > 0 && (...)`, lignes 64, 78) sont bien gardés, aucun crash évident identifié dans ce cas précis.

**Point structurel confirmé** : `find web/app -iname "error.tsx" -o -iname "global-error.tsx"` → **aucune error boundary Next.js nulle part dans le projet** (`app/error.tsx`, `app/voyage/error.tsx`, `app/global-error.tsx` absents).

**Root cause (hypothèse, non confirmée sans repro live)** : sans error boundary, toute exception runtime non interceptée dans l'arbre `VoyageRecap` (image manquante, donnée inattendue) fait s'effondrer silencieusement toute la page → écran blanc. Cause structurelle la plus probable, à défaut de pouvoir reproduire avec les DevTools branchés. Indépendamment d'un crash, le composant n'a de toute façon **pas d'état "vide" explicite** pour `keptCards.length === 0` (la section est juste omise, sans message de remplacement).

**Impact** : visible (pas bloquant si repro rare) mais laisse l'utilisateur sans feedback. **Effort** : < 1h pour l'état vide explicite dans `VoyageRecap` ; ajouter `app/error.tsx`/`app/global-error.tsx` (filet de sécurité général, pas spécifique à ce bug) = < 1h également, à traiter une fois pour tout le site.

---

### [Urgent] Bouton retour Android depuis les filtres → va à la home

**Fichiers :** `web/app/Hub.tsx:102` (`<GameCard href="/voyage" />`, `Link` standard) ; `web/app/voyage/Voyage.tsx` — **aucun `router.push`/`router.replace`** dans tout le fichier, les changements de phase (`setPhase("setup")`, etc., y compris `handleChangeFilters`, lignes 139-141) sont de purs changements d'état React sans toucher l'historique du navigateur.

**Root cause** : pas un `router.replace` qui casse l'historique (il n'y en a pas) — c'est l'inverse : **aucune navigation n'est jamais poussée** pour les phases internes à `/voyage`. Tout vit sous une seule entrée d'historique (`/voyage`). Le bouton retour Android (= `history.back()`) n'a donc aucune étape intermédiaire à dépiler à l'intérieur du jeu : il saute directement à l'entrée précédente réelle du navigateur, la Home, au lieu de revenir de "filtres" à "en train de jouer".

**Impact** : bloquant sur Android (navigation native cassée). **Effort** : demi-journée — pousser une entrée d'historique (`router.push`/state via `history.pushState`, ou query param `?screen=setup`) à chaque changement de phase dans `Voyage.tsx`, + écouter `popstate`/le bouton retour pour revenir en arrière dans la machine à états plutôt que quitter la page. Chantier à mener avec le point "session perdue" ci-dessus (même zone de code, même besoin de refléter l'état dans l'URL/historique).

---

### [Moyenne] Labels "Mode Découverte" / "Maîtrisée" qui débordent (S23, collection)

**Fichiers :**
- Libellés : `web/lib/collectionLabels.ts:36-37` (`discovery: "🧳 découverte"`, `mastered: "📚 maîtrisée"`).
- Rendu : `web/components/collection/LanguageSection.tsx:53-88` — header en `display: flex` **sans `flexWrap`**, badge de mode en `<button>` "pill" (`padding: "4px 10px"`) sans `whiteSpace: "nowrap"` ni `flexShrink: 0`.

**Root cause** : le header combine drapeau + nom de langue (police display, gras) + compteur + badge pill sur une seule ligne flex non contrainte. Sur écran étroit (S23 portrait), le badge est compressé et son texte passe sur 2 lignes à l'intérieur du bouton à bords arrondis fixes → le bouton grandit verticalement et désaligne toute la ligne.

**Impact** : visible (décalage visuel, pas bloquant). **Effort** : < 1h — `whiteSpace: "nowrap"` + `flexShrink: 0` sur le badge, éventuellement `flexWrap: "wrap"` sur le header pour dégrader proprement sur les très petits écrans.

---

## 🟡 Améliorations

### [Haute] Navigation globale — vue d'ensemble (pas d'implémentation, atelier UX à organiser avant tout)

Routes actuelles (`web/app/`, 1er niveau) : `/` (Hub), `/about`, `/atlas`, `/carnet`, `/collection`, `/country/[code]`, `/domain/[slug]`, `/emoji`, `/emoji-map`, `/expression/[id]`, `/instagram`, `/offline`, `/profile`, `/random`, `/regions`, `/regions/[code]`, `/reset-password`, `/search`, `/type/[slug]`, `/verify-email`, `/voyage`.

Nav persistante : `web/components/home/BottomNav.tsx` (5 items : Home, Search, Random/dé 🎲, Atlas, Concepts) + `web/components/home/Sidebar.tsx` (desktop).

**Pas d'analyse plus poussée ici** — conformément à la demande de Sinan, ce point attend un atelier UX dédié avant toute décision d'implémentation (archivage de pages, fusion recherche/jeu, etc.).

---

### [Urgent] Absence perçue de bouton audio + transcription phonétique manquante

**Bouton audio : existe déjà, mais peut sembler absent.**
- `web/lib/useAudio.ts` (Web Speech API, `SpeechSynthesisUtterance`).
- Utilisé dans `web/app/expression/[id]/page.tsx:21,345` (`useAudio(expr?.expression, expr?.language)`).
- Rendu : `page.tsx:521-538` — le bouton est **désactivé et grisé** (`opacity: 0.4`, `cursor: not-allowed`) quand `voiceAvailable === false`.
- Sur Android/Chrome WebView PWA, `speechSynthesis.getVoices()` renvoie souvent une liste vide au premier appel, ou ne contient pas de voix pour certaines langues (turc, japonais...) selon les packs TTS installés sur le device — ce qui grise silencieusement le bouton. **Probablement ce que Sinan a perçu comme une absence sur son S23.**

**Transcription phonétique : vrai manque, pas juste un bug d'affichage.**
- Type `Expression` (`web/lib/api.ts:27-46`) : aucun champ `phonetic`/`pronunciation`/`ipa`.
- Backend : `grep -rn "phonetic|pronunciation" --include="*.py"` → aucun résultat pertinent.
- Nécessiterait un ajout de schéma (DB + API + type TS) et une source de données (génération IPA ou saisie manuelle) — un vrai chantier, pas une correction de bug.

**Impact** : critique pour Sinan (apprentissage/accessibilité). **Effort** : bouton audio = < 1h pour investiguer le comportement réel sur S23 (retry sur `getVoices()`, fallback si liste vide au premier appel — souvent un simple souci de timing d'init) ; phonétique = gros chantier (schéma + données + UI), à cadrer séparément, pas un "fix".

---

### [Moyenne] Refonte page filtres (base de discussion, pas de proposition ici)

**Fichier unique actuel** : `web/components/voyage/VoyageSetup.tsx` — 259 lignes. Contenu : chips pays, tuiles type (emoji codés en dur), pills thème/domaine (2 lignes scrollables), compteur de résultats live (debounce 200ms), CTA. Tout en inline `style={{...}}`.

Mock-ups à proposer par Sinan lors d'une prochaine session, comme convenu — pas d'implémentation ici.

---

### [Moyenne] Émojis manquants dans le filtrage par thème

**Deux filtres thème distincts, statuts différents :**
1. **Voyage/Setup** (`VoyageSetup.tsx:132-146`) — a déjà des emojis (`EDITORIAL_DOMAINS[].emoji`). **Pas de manque ici.**
2. **Collection** (`web/components/collection/CollectionToolbar.tsx:82-92`) — `<select>` natif **sans emoji** ; `themes` dérivés des tags des expressions (`web/app/collection/Collection.tsx:176-182`).

**Mapping déjà existant et réutilisable** : `web/lib/tagIcons.ts` exporte `tagIcon(tag: string): string`, déjà utilisé dans `VoyageCard.tsx:23,45`.

**Point d'implémentation** : préfixer `th.name` par `tagIcon(th.slug)` dans les `<option>` de `CollectionToolbar.tsx` — fonction déjà écrite, aucune nouvelle donnée à créer.

**Impact** : mineur (cohérence visuelle). **Effort** : < 1h.

---

### [Moyenne] Filtre par pays manquant

**Ça dépend de la "section filtre" visée :**
- **Voyage/Setup** — a déjà un filtre pays complet (chips + drapeaux, `getCountries()`). Le retour ne s'applique probablement pas ici.
- **Collection** (`CollectionToolbar.tsx:82-104`) — thème + type + tri seulement, **aucun filtre pays**. C'est très probablement le filtre visé.

**Pattern déjà existant à réutiliser** : `ExpressionCard.tsx:149,152` (lien drapeau → `/country/[code]`), `web/app/country/[code]/page.tsx` (page pays existante), et `VoyageSetup.tsx` a déjà l'implémentation exacte du composant "chips pays" à adapter. La donnée pays est déjà présente sur chaque item de la collection (`expression.country`) — pas besoin d'un nouvel appel API, même logique que `themes` (dérivation locale, `Collection.tsx:176-182`).

**Impact** : visible (confort d'usage pour utilisateurs multi-pays). **Effort** : demi-journée (UI + décision produit : `<select>` cohérent avec thème/type, ou chips comme Voyage/Setup).

---

## Tableau priorisé (impact ↑ × effort ↓ = à faire en premier)

| # | Item | Zone | Impact | Effort | Priorité |
|---|------|------|--------|--------|----------|
| 1 | Cold start — `getCountries()` sans retry | Voyage/Setup | Bloquant (1er lancement) | < 1h | 🥇 Immédiat |
| 2 | Labels mode collection débordent (S23) | Collection | Visible | < 1h | 🥇 Immédiat |
| 3 | Émojis manquants filtre thème collection | Collection | Mineur | < 1h | 🥇 Immédiat |
| 4 | Bouton audio grisé sur S23 (diagnostic live d'abord) | Fiche expression | Critique perçu | < 1h (diagnostic) | 🥇 Immédiat |
| 5 | Écran blanc fin de session sans favoris (état vide + error boundary) | Voyage | Visible | < 1h | 🥈 Court terme |
| 6 | Filtre pays manquant en collection | Collection | Visible | Demi-journée | 🥈 Court terme |
| 7 | Session perdue au retour d'app + bouton retour Android cassé | Voyage | Bloquant / inacceptable | Demi-journée (même chantier : historique/persistance) | 🥉 Prochain sprint (chantier structurant) |
| 8 | Transcription phonétique | Fiche expression | Critique (souhaité) mais gros chantier | Gros chantier (schéma+données) | 🥉 Prochain sprint / à cadrer |
| 9 | Refonte page filtres | Voyage/Setup | Visible | Atelier UX puis chantier | Attend mock-ups Sinan |
| 10 | Navigation globale | Toute l'app | Structurant | Atelier UX puis chantier | Attend atelier UX |
| 11 | Publicité Pinterest | — | Inconnu (hors code) | — | Pas d'action code |

**Remarque** : les items #7 (session perdue) et #5 (bouton retour Android) partagent la même cause racine — l'absence totale de navigation/historique interne à `/voyage` — et devraient être traités ensemble dans un seul chantier (refléter la phase de jeu dans l'URL ou l'historique du navigateur), pas comme deux fixes séparés.

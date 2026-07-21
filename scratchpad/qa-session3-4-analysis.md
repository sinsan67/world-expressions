# QA — sessions 3 & 4 (Sinan) — analyse code

Méthode : chaque item des notes QA brutes (`scratchpad/QA - Bug Review 3.md` et
`scratchpad/QA - Bug Review 4.md`) a été rattaché au code réel (fichiers + lignes), avec
hypothèse de root cause (bugs) ou point d'implémentation (améliorations).
Aucune modification de code effectuée — synthèse uniquement, validation à faire
avec Sinan avant impl. Fichiers lus via `origin/staging` (le checkout local est
en retard, cf. mémoire projet — pitfall connu).

---

## 🔴 Bugs

### [Ma collection] Compteurs incohérents — ❤️ 17 vs "23 expressions" (QA4, critique)

**Fichiers clés :**
- `web/app/collection/Collection.tsx:261,282` — `totalCount = items.length`, dérivé
  de `rawFavorites` qui, pour un utilisateur connecté, vient de
  `getUserFavorites(userId)` (ligne 69) — **appel serveur frais à chaque montage
  de la page**. C'est le chiffre correct (23).
- `web/components/ui/CarnetHeartLink.tsx:31-38` — le badge ❤️ du header lit
  `getCarnet().favorites.length`, c'est-à-dire le **localStorage**, sur
  `wex-carnet-updated` uniquement. Même pattern dans
  `web/components/home/CollectionStrip.tsx:19-24` (bandeau accueil) et
  `web/components/home/Sidebar.tsx:70-75` (compteur menu). **Trois endroits
  différents font tous confiance au cache local, jamais au serveur.**
- `web/components/AuthGate.tsx:30-64` (fix J2-1, S216, commit `e2e1c6b`) —
  rapatrie les favoris serveur → local au premier login sur un device, mais
  seulement **une fois pour toujours** par (compte, device) : garde
  `carnet.user.syncedAccountId === userId` ligne 35.

**Ce que ça signifie :** le fix J2-1 (S216) a bien corrigé le problème de
*première synchronisation* sur un nouveau device, mais pas le régime permanent.
Dès qu'un favori est ajouté ailleurs (autre device, ou toute session postérieure
au sync unique) après que ce sync a déjà eu lieu sur cet appareil, le compteur
local de ce device reste bloqué à l'ancien total pour toujours — alors que la
page `/collection` elle-même, qui interroge le serveur à chaque ouverture,
reste juste. D'où 17 (cache local figé) vs 23 (vérité serveur). Ce n'est pas un
glitch ponctuel : ça se reproduira à chaque fois qu'un favori est ajouté depuis
un autre point d'entrée après le sync initial.

**Piste de correctif** : les 3 badges devraient, pour un utilisateur connecté,
soit interroger le serveur (même endpoint que Collection.tsx) soit être
recalculés à chaque `wex-carnet-updated` **après** un re-sync serveur — pas
uniquement lire le localStorage brut. Nécessite une petite fonction/hook
partagé (ex. `useFavoritesCount()`) plutôt que 3 lectures locales dupliquées.

**Impact** : critique (confusion utilisateur explicitement remontée).
**Effort** : petit (< 1h–2h) — logique déjà éprouvée dans Collection.tsx à
généraliser, pas de nouvelle décision produit.

---

### [Voyage] Audio absent sur les cartes (QA3, priorité absolue)

**Fichiers clés :**
- `web/components/voyage/VoyageCard.tsx` — **aucune trace d'audio** : pas
  d'import `useAudio`, pas d'icône `Volume2/VolumeX`, pas de `speechSynthesis`.
  Confirmé par comparaison avec `web/app/expression/[id]/page.tsx:21-22`
  (import `useAudio`, `Volume2`, `VolumeX`) et `:345-348,544-546` (appel du hook
  + rendu du bouton). `web/lib/useAudio.ts` est un hook autonome et réutilisable
  (Web Speech API).
- Git : `VoyageCard.tsx` créé dans `7aebe88 feat(voyage): build the Voyage
  game`, jamais retouché pour ajouter l'audio depuis.
- `web/app/voyage/Voyage.tsx:319-320` — `<VoyageCard key={current.id} .../>`
  démonte/remonte à chaque carte : rien de spécifique à la carte n°1.

**Ce que ça signifie :** ce n'est très probablement **pas une régression
propre à la première carte** — c'est une fonctionnalité qui n'a jamais été
câblée sur aucune carte du jeu Voyage. L'impression "seulement la première
carte" vient sans doute du fait que c'est la première fois dans une session
que l'utilisateur cherche le bouton et constate son absence (répété à chaque
partie → remonté "à plusieurs reprises").

**Piste de correctif** : réutiliser `useAudio(card.expression, card.language)`
(déjà utilisé ailleurs) + bouton à côté du bouton 🚩 signalement existant sur
la carte. `card.expression`/`card.language` déjà disponibles sur `GameCardType`.

**Impact** : critique (signalé plusieurs fois, priorité absolue affichée).
**Effort** : petit — réutilisation directe d'un hook existant, pas de nouveau
mécanisme.

---

### [Voyage] Compose your journey — section COUNTRY vide sur mobile PWA (QA3)

**Fichiers clés :**
- `web/components/voyage/VoyageSetup.tsx:77-79` — `getCountries().then(setCountries).catch(() => {})`,
  effet au montage uniquement. Les tuiles pays viennent uniquement de
  `countries.map(...)` (ligne 235) ; "All countries" (ligne 233) s'affiche
  toujours, indépendamment — un `countries` vide reproduit exactement le
  symptôme rapporté.
- `web/lib/api.ts:377-392` (fix cold-start S204) — `getCountries()` retente
  3 fois avec un backoff `attempt * 2000ms` (0s/2s/4s, ~6s de délai ajouté +
  temps de fetch), et **retourne silencieusement `[]`** si les 3 tentatives
  échouent (ligne 391) — pas d'erreur remontée.
- Aucun CSS spécifique mobile trouvé sur les styles du composer
  (`collapseStyle`, `countryChipStyle`) — pas de media query, comportement
  identique desktop/mobile en théorie.

**Ce que ça signifie :** root cause la plus probable = **timing de cold-start
Render, pas un bug CSS**. Le commentaire du fix S204 (`api.ts:377-379`)
souligne lui-même que ce cas cible justement le cold-start PWA (pas de cache
Service Worker pour le masquer) — mais un cold-start Render (tier gratuit) peut
dépasser 6-10s, ce qui épuiserait les 3 tentatives avant que le backend soit
réveillé. Le `.catch(() => {})` de `VoyageSetup.tsx:78` avale une seconde fois
toute erreur, sans retry ni UI d'erreur : `countries` reste `[]` pour de bon,
sans action utilisateur possible pour relancer. Comportement identique et non
corrigé sur `getRandomCount` (mêmes lignes 79/83/93) — donc les compteurs de
pool sont probablement fragiles au même problème, juste moins visibles qu'une
grille de tuiles vide.

**Piste de correctif** : surfacer l'échec + offrir un bouton "réessayer" est
rapide. Calibrer la fenêtre de retry correctement demande une vérification
live du vrai temps de cold-start Render (pas mesurable depuis le code seul).

**Impact** : visible/bloquant pour l'action précise (empêche de choisir un
pays après un cold-start mobile).
**Effort** : petit pour la partie "ne pas avaler l'échec en silence" ;
moyen pour bien calibrer le retry (nécessite un test live sur staging).

---

## 🟡 Améliorations

### [Ma collection] Affichage "18-18 sur 2437" (QA4)

**Fichiers clés :**
- `web/components/collection/LanguageSection.tsx` (ligne ~68) —
  `{totalFavorited} {setCountTotal !== null && <> · {t.setCounter(totalFavorited, setCountTotal)}</>}`.
- `web/lib/collectionLabels.ts:41` (et équivalent dans les 6 autres langues) —
  `setCounter: (fav, total) => \`${fav} / ${total}\``.
- `setCountTotal` vient de `getRandomCount("", "", "", lang)` (Collection.tsx:164)
  — le total d'expressions disponibles dans l'app pour cette langue (2437
  expressions italiennes au total dans l'app), pas une pagination ni un rang.

**Ce que ça signifie :** ce n'est ni une pagination ni un rang — l'intention
est "tu as mis en favori 18 expressions italiennes sur 2437 possibles dans
l'app" (logique de collection/gamification). Mais le code appelle
`setCounter(totalFavorited, setCountTotal)` — c'est-à-dire qu'il **réinjecte le
même nombre déjà affiché juste avant** (`totalFavorited`, 18) comme premier
argument de `setCounter`, donc 18 apparaît deux fois de suite : "18 · 18/2437"
au lieu de "18 sur 2437". Bug de duplication littérale, pas une erreur de
calcul.

**Piste de correctif** : supprimer la duplication (n'afficher que
`{totalFavorited} / {setCountTotal}` par exemple), et — comme la QA a
elle-même interprété ça comme de la pagination — envisager un libellé plus
explicite que "/" (ex. "sur", "collectées / disponibles") pour lever
l'ambiguïté. Le premier point est trivial ; le second est un choix de wording
à valider avec Sinan (pas un bug, une clarté à améliorer).

**Impact** : mineur/visible (confusion, pas bloquant).
**Effort** : trivial pour la duplication ; petit pour le wording.

---

### [Ma collection] Filtres jugés "tristes" / incohérents visuellement (QA4)

**Ne pas trancher isolément** — un atelier utilisateur est prévu pour les
filtres du composer "Voyage". Décision à aligner entre les deux écrans de
filtres. Action de cette session : mettre à jour l'ordre du jour de l'atelier
pour y intégrer explicitement la cohérence Ma collection ↔ Voyage.

**Impact** : visible. **Effort** : n/a (attend l'atelier).

---

### [Fin de jeu — Récap "Belle pioche"] Réduire chaque carte à 2 lignes (QA3)

Contenu : traduction littérale + sens, sur deux lignes distinctes, retrait du
reste. Formatage/contenu du composant récap — pas de root cause à investiguer,
implémentation directe.

**Impact** : visible (clarté du récap).
**Effort** : petit.

---

### [Fin de jeu — Boutons du bas] 3 mockups alternatifs (QA3)

Design uniquement (pas de code) : 3 pistes visuelles avec emoji + distinction
continuité (retour au carnet/filtres) vs sortie du jeu (favoris). Pas de
décision produit prise avant validation de Sinan sur un des 3 mockups.

**Impact** : visible. **Effort** : petit (mockups statiques, pas d'implémentation).

---

### [Ma connexion] Toggle Découverte/Maîtrisée peu clair (QA3)

Pas encore investigué en profondeur (hors scope de cette synthèse rapide) —
nécessite un passage code + test live pour comprendre si le toggle a un effet
réel actuellement ou si c'est un problème d'affichage/feedback uniquement.

**Impact** : visible. **Effort** : à investiguer avant de pouvoir chiffrer.

---

### [Récap multi-sessions — Favoris] Pistes de solution / wireframes (QA3)

Design uniquement (pas de code) : imaginer des maquettes statiques pour un
récapitulatif global des favoris à travers plusieurs sessions.

**Impact** : visible (besoin non couvert). **Effort** : petit (wireframes).

---

## Tableau priorisé (impact ↑ × effort ↓)

| # | Item | Impact | Effort | Session |
|---|------|--------|--------|---------|
| 1 | Compteurs incohérents 17/23 (QA4) | 🔴 Critique | Petit | Prochaine |
| 2 | Audio absent Voyage (QA3) | 🔴 Critique | Petit | Prochaine |
| 3 | Country vide mobile PWA (QA3) | Visible/bloquant partiel | Petit→Moyen | Prochaine (surfacer l'échec) + test live |
| 4 | "18-18/2437" duplication (QA4) | Mineur | Trivial | Prochaine (quick win) |
| 5 | Récap 2 lignes (QA3) | Visible | Petit | Prochaine |
| 6 | 3 mockups boutons récap (QA3) | Visible | Petit | Prochaine |
| 7 | Wireframes récap multi-sessions favoris (QA3) | Visible | Petit | Prochaine ou suivante |
| 8 | Toggle Découverte/Maîtrisée (QA3) | Visible | À investiguer | À chiffrer d'abord |
| 9 | Filtres Ma collection "tristes" (QA4) | Visible | n/a | Attend l'atelier Voyage |

Items 1-6 tiennent dans une seule session bien remplie (tous des fixes/mockups
bien circonscrits, aucun ne demande d'arbitrage produit lourd). 7-8 peuvent
suivre. 9 est hors code pour l'instant (coordination atelier).

# Pivot "Games Hub" — Lot 0 Contract

**Status: VALIDATED by Sinan (S196, 2026-07-10) — this contract is frozen.**
It fixes the interfaces between the parallel implementation lots (A–F +
Report). Any change to routes, table shapes, or API signatures below must
come back through this file first.

Validated S196: route slugs (`/voyage`, `/revision`, `/collection`, reuse of
`/search`, redirects from `/random-mode` and `/carnet`) · mechanics
arbitration (daily unique + rare card + set counter in; full Leitner
deferred, box field stored) · release plan V-jeu-1/2/3.

Upstream decisions: workshop S194 (core loop, 2 games, 8 decisions), mockups
S195 (`docs/mockups/pivot-*.html`, final names), mechanics arbitration S196.

---

## 0. Decisions feeding this contract

- **Names (final, FR reference)**: hub = « À quoi on joue ? » · game 1 =
  **Voyage** (internal/spec name: Discovery) · game 2 = **Révision** ·
  collection = **Ma collection** · search result families = « Le mot y est /
  L'idée y est ». Other languages: lot E.
- **Mechanics adopted at launch (S196)**: unique expression of the day (date
  seed, same for everyone) · rare card ~1/10 per game (draw rule on existing
  data) · set counter "31 / 2 438" in the collection.
- **Leitner deferred**: v1 review behavior stays the 2-state rule acted S195
  ("not yet" → to review, "knew" → known, never reviewed → new), **but the data
  model stores a full box `0–3` from day 1** (free now, avoids a migration).
  Full Leitner spacing = post-launch workshop, with real usage data.
- **Game sessions recorded in DB from day 1**; the "My games" UI comes in a
  later increment.
- **Report flag 🚩 at launch**, open to all (no account), one tap, optional
  reason.
- **JA excluded from all game pools** until Luke L3 (broken JA content) is
  fixed. JA expressions remain reachable via search/browse/fiche.

---

## 1. Routes & navigation

### Page routes

| Route | Screen | Change |
|---|---|---|
| `/` | Hub « À quoi on joue ? » (mockup `pivot-hub.html`) | **Replaced** — current search home moves to `/search` |
| `/search` | Search page, redesigned (mockup `pivot-chercher.html`) | **Replaces BOTH the old home content and `SearchOverlay`** (single search screen to maintain) |
| `/voyage` | Voyage game — 3 states in one client route: setup (filters) → play (cards) → recap | **New** (absorbs Random mode) |
| `/voyage?quick=1` | Quick game: skips setup, starts immediately with no filters | New (target of the mobile 🎲) |
| `/revision` | Révision game (draws from favorites only) | **New** |
| `/collection` | Ma collection (carnet 2.0, mockup `pivot-carnet.html`) | **Rename** of `/carnet` |
| `/random-mode` | → **redirect** `/voyage` (Instagram links & bookmarks preserved) | Redirect |
| `/carnet` | → **redirect** `/collection` | Redirect |
| `/random` | Unchanged (server redirect to a random fiche — used by the fiche 🎲, which is kept as-is per S194 decision 5) | None |
| `/expression/[id]`, `/atlas`, `/country`, `/domain`, `/emoji`, `/type`, `/about`, `/profile`… | Unchanged | None |

### Navigation

- **Mobile bottom nav (M2 layout kept, 5 slots)**: home (hub) · search (now
  **navigates to `/search`** instead of opening the overlay) · **🎲 central →
  `/voyage?quick=1`** ("quick game": one tap = a game starts) · atlas ·
  concepts. `SearchOverlay.tsx` is removed once `/search` ships.
- **Header**: 🔍 icon → `/search` · ❤️ heart → `/collection` (unchanged
  position). Desktop sidebar: same substitutions.
- **Hub secondary access**: search card/link on the hub; Explore (Atlas,
  domains, emojis) stays in the secondary menu; expression of the day =
  compact postcard at the bottom of the hub (country photo background kept).

---

## 2. Data model

Additive only — the expressions base does not change. Migrations follow the
existing practice (SQL scripts in `scripts/` + **`models.py` kept in sync in
the same commit** — S177 lesson).

### New table `game_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK `users` NULL, ON DELETE SET NULL | Logged-in player |
| `client_id` | String(64) NOT NULL | Anonymous device id (UUID generated once, stored in local carnet). Lets us link anon sessions to an account later |
| `game` | String(20) NOT NULL | `voyage` \| `revision` |
| `filters` | JSONB NOT NULL default `{}` | `{country, kind, domain, locale, quick}` — voyage; `{language, mode}` — revision |
| `cards` | JSONB NOT NULL | Ordered array of expression ids seen. Replay-a-game (V2 UI) = same list |
| `kept_ids` | JSONB NOT NULL default `[]` | Expressions favorited during the game |
| `started_at` | timestamptz NOT NULL | |
| `ended_at` | timestamptz NULL | NULL = abandoned mid-game |

Indexes: `user_id`, `client_id`, `started_at`.

### `user_favorites` — new columns

| Column | Type | Notes |
|---|---|---|
| `review_box` | smallint NOT NULL default 0 | Leitner box 0–3. **v1 semantics**: `reviewed_at IS NULL` = new · box 0 (reviewed) = to review · box ≥ 1 = known. "Knew" sets box 1 in v1 (later: box+1) ; "not yet" resets to 0 |
| `reviewed_at` | timestamptz NULL | Last review answer |
| `game_session_id` | UUID FK `game_sessions` NULL | The game where it was kept (V2 "My games" UI) |

Révision draw order (v1, client logic): to review → new → known.

### New table `expression_reports` (🚩)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `expression_id` | FK `expressions` ON DELETE CASCADE, NOT NULL | |
| `reason` | String(30) NULL | `fabricated` \| `wrong-translation` \| `duplicate` \| `other` — optional |
| `comment` | Text NULL | Free text, optional (mainly for `other`) |
| `user_id` | UUID NULL / `client_id` String(64) NULL | Whoever is available |
| `ui_lang` | String(10) NULL | UI language at report time (review context) |
| `status` | String(20) NOT NULL default `open` | `open` \| `resolved` \| `dismissed` — Sinan's periodic review (SQL/Nao, no admin UI v1) |
| `created_at` | timestamptz NOT NULL | |

Dedupe rule: one open report per (`client_id`, `expression_id`) — repeat taps
are idempotent.

### `users` — new column

| Column | Type | Notes |
|---|---|---|
| `language_modes` | JSONB NOT NULL default `{}` | `{"it": "discovery", "tr": "mastered"}` — 🧳/📚 profile per language. Rides the existing `GET/PUT /users/{id}/preferences`. Default when absent: UI language = mastered, others asked at first favorite in that language |

### Local carnet (`wex_carnet`) — version 1 → 2 migration

- `clientId`: UUID generated once (feeds `game_sessions.client_id` and reports).
- `favorites[*]` gain `reviewBox`, `reviewedAt`, `sessionId` (mirror of the
  server columns; sync on login as today).
- New `languageModes` record (mirror of `users.language_modes`).

---

## 3. API contract

**Deployment constraint (drives lot order)**: Render = single prod instance
deployed from `main`; the staging front calls the prod backend. All backend
changes below are additive → they ship as an early **Lot API** merged to
`main` *before* the front lots reach staging QA.

### New endpoints

| Endpoint | Request | Response | Used by |
|---|---|---|---|
| `GET /daily` | `locale=` | One expression, same shape as `/random` + `"date": "YYYY-MM-DD"`. Deterministic pick seeded by UTC date, same for everyone. Pool: **same as `/random`** (excludes `phrasebook` and `kind='word'`) minus JA *(amended S197, validated by Sinan — the daily postcard must never serve a transactional phrase or a vocabulary word)*. Public cache 1h | Hub (lot A) |
| `POST /game-sessions` | `{game, client_id, user_id?, filters, cards?}` | `{id, cards: [expression…]}` — **voyage**: server draws 10 unique cards (JA excluded), flags **at most one as `"rare": true`** (~1 game in 10 has none; criterion: `register` in slang/vulgar); cards come localized per `filters.locale`. **revision**: client supplies `cards` (favorites live client-side for anon users), server just records | Voyage (B), Révision (D) |
| `PATCH /game-sessions/{id}` | `{ended_at, kept_ids}` | `{ok: true}` — closes the game; fire-and-forget from the recap screen | B, D |
| `POST /reports` | `{expression_id, reason?, comment?, client_id?, ui_lang?}` | `201 {ok: true}` — no auth, idempotent per client+expression | Report lot |
| `POST /users/{user_id}/favorites/{expression_id}/review` | `{result: "knew" \| "not_yet"}` | `{review_box, reviewed_at}` — logged-in sync; anon users update local carnet only | D |

### Changed endpoints (additive)

| Endpoint | Change | Used by |
|---|---|---|
| `GET /random/count` | New `language=` filter (set counter « 31 / 2 438 » per collection language section; also per-filter pool count on the Voyage setup screen) | B, C |
| `GET /browse` | New `ids=` param (comma-separated expression ids) to hydrate collection rows in one call — collection search/filter/sort stays client-side in v1 | C |
| `POST /users/{id}/favorites` | Optional `game_session_id` in body | B |
| `GET /users/{id}/favorites` | Rows now include `review_box`, `reviewed_at`, `game_session_id` | C, D |
| `GET/PUT /users/{id}/preferences` | Carries `language_modes` | C |

---

## 4. i18n keys

Pattern: same as `web/lib/uiLabels.ts` (exported `Record<Lang, …>` consts,
fallback **always English** — editorial charter). Each lot ships its labels in
a dedicated lib file with **EN + FR filled**; lot E completes es/it/tr/de/ja
and arbitrates final wording with Sinan (rule S195: describe the gesture, do
not name the mechanic — "flashcard" stays internal + About).

| File | Keys (FR reference values) |
|---|---|
| `hubLabels.ts` (A) | `title` « À quoi on joue ? » · `voyage.title` « Voyage » · `voyage.tagline` · `revision.title` « Révision » · `revision.tagline` · `comingSoon` (game 3 teaser) · `daily.title` « L'expression du jour » · `collection.teaser` (« 31 / 2 438 » wording) · `search.invite` |
| `voyageLabels.ts` (B) | `setup.*` (langue/thème/type pickers, « C'est parti », quick) · `play.*` (reveal, « Garder ❤️ », next, origin unfold 📖) · `rare.badge` (discreet marker) · `recap.*` (« Tu as gardé X expressions », rejouer, enchaîner) |
| `revisionLabels.ts` (D) | `flip` « Retourne la carte — tu la savais, ou pas encore ? » · `knew` / `notYet` · `queue.*` (à revoir / nouvelles / sues) · `empty.rebound` (0 favorite → Voyage) · `locked.pairing` « Garde encore X expressions » |
| `collectionLabels.ts` (C) | `title` « Ma collection » · `search.placeholder` · `filters.*` (thème, type) · `sort.byDate` · `mode.discovery` 🧳 / `mode.mastered` 📚 · `mode.prompt` (first favorite in a language) · `setCounter` |
| `searchLabels.ts` (F/A) | `title` « Chercher » · `families.word` « Le mot y est » · `families.idea` « L'idée y est » (matchSections separators kept as-is) |
| `reportLabels.ts` (Report) | `flag` 🚩 aria · `reasons.*` (4) · `thanks` |
| `BottomNav` NAV_LABELS | `random` label becomes "quick game" wording — lot F |

---

## 5. Lots & release plan

Lots run in parallel worktrees once this contract is validated. Model hints:
Sonnet 5 for A–D/API, Haiku for E–F mechanical passes.

| Lot | Content | Depends on |
|---|---|---|
| **API** | Migrations (§2) + endpoints (§3) + `models.py` sync + backend tests | Contract only — **merge to `main` first** |
| **Report 🚩** | `expression_reports` + `POST /reports` + flag button (fiche + game card) | Independent — deliverable early (can ship inside Lot API + a tiny front PR) |
| **A — Hub** | New `/`, hub cards, daily postcard, collection teaser | API (`/daily`) |
| **B — Voyage** | `/voyage` 3 states, quick mode, rare badge, session recording | API (`/game-sessions`) |
| **C — Collection** | `/collection`, 🧳/📚 sections, search/filter/sort, set counter, language-mode prompt | API (favorites enrichment) |
| **D — Révision** | `/revision` flashcard v1, review queue, empty/locked states | API (review endpoint) + C's local-carnet migration |
| **E — i18n** | Complete 5 languages, wording arbitration with Sinan | A–D key files |
| **F — Nav & redirects** | BottomNav/header/sidebar rewiring, `/random-mode` + `/carnet` redirects, `/search` page swap, SearchOverlay removal | A (hub live) |

### Staged releases (each one valuable & QA-able on staging alone)

1. **V-jeu-1 — "the hub and a playable game"**: Lot API → main, then A + B +
   F (+ Report). The app pivots: hub home, Voyage playable, old links intact.
2. **V-jeu-2 — "the collection becomes a workspace"**: C + E. Two-mode
   collection, retrievable (search/filters/sort), full 7-language wording.
3. **V-jeu-3 — "révision"**: D. Flashcard on favorites, review queue seeded.
4. **Post-launch (not in this contract)**: Leitner workshop (real usage data) ·
   "My games" UI (data already recorded) · personal notes on favorites ·
   SVG game spike (world map vs emoji constellations) · pairing & quiz
   mechanics.

### Planned data extension (no schema impact — noted S196)

Basic vocabulary decks (e.g. Italian starter vocabulary) imported as
`kind = "word"` rows — the `kind` field and `/type-counts` already support
`word`; the Voyage "type" filter will serve vocabulary-only sessions
naturally. Requires a dedicated data session (source dataset, `literal_fr`,
meanings) — out of scope for lots A–F.

---

## 6. Implementation notes for lot owners

- **Next.js**: read `web/AGENTS.md` first — this repo's Next version has
  breaking changes vs training data; check `node_modules/next/dist/docs/`.
- **Build**: `npx next dev --webpack` (Turbopack incompatible with Serwist).
- **Staging QA**: Vercel staging is protected — bypass header token in
  `web/.env.playwright`. Wait for `documentElement.lang` before asserting
  (hydration).
- **New backend features only work on staging after merge to `main` +
  Render redeploy** — hence Lot API first.
- Every visible string goes through a labels file (charter: no hardcoded
  single-language string; missing-language fallback = English, never French).

# Profile / "Mon carnet" — Spec for Claude Code

> **New feature** — does not exist in the current codebase.
> Destination: `web/app/carnet/page.tsx` (new route)
> Reference HTML mockup: `Profile (hi-fi).html` + `profile-design/` in the design project
> Fidelity: **high** — match colors, typography, spacing closely.

---

## 0. Context

This is a brand-new page: the user's personal **"carnet de voyage"** — a notebook where they collect their saved expressions, history, notes, and progression. **No equivalent exists today.**

**Two operating modes**, both supported from day one:
1. **Local mode** (default, no signup) — all data lives in `localStorage` under the key `wex_carnet`. Works offline. Cleared when the user clears site data or switches device.
2. **Synced mode** (optional, V+1) — a real account (email + magic-link) lets the user mirror their carnet to the backend so it survives device changes.

**The app must remain fully usable without an account.** No login wall.

---

## 1. Reuse from `design/homepage-redesign.md`

This spec **inherits**:
- All design tokens (`--paper`, `--ink`, `--plum`, `--terra`, `--ochre`, fonts, radii, shadows). Make sure those are already in `web/app/globals.css` before implementing this page.
- The sidebar / bottom-nav navigation pattern (Accueil · Atlas · Concepts · ♥ Favoris [active here] · 🎲 Au hasard on sidebar)
- Existing atoms: `<Postcard>`, `<Postmark>`, `<CountryChip>`, `<ConceptChip>`, `<CountryStamp>`, `<Eyebrow>`
- The `wex-frame` / `wex-paper-aged` background classes

---

## 2. New components

| Component | Purpose | Key props |
|---|---|---|
| `<Avatar>` | Circular stamp with user initial in handwriting (Caveat) | `initial`, `size`, `tone: 'terra'\|'plum'` |
| `<StatTile>` | Number + label tile, optional icon, optional tone | `value`, `label`, `icon?`, `size: 'md'\|'lg'`, `tone?` |
| `<CountryProgressBar>` | Flag + name + progress bar + ratio | `entry: { flag, name, seen, total }` |
| `<TabBar>` | Horizontal pill tabs with counts | `tabs: [{ id, icon, label, count? }]`, `active`, `onChange` |
| `<FavoriteRow>` | List row: flag + expression + meaning + date saved + ♥ remove | `expr` |
| `<HistoryRow>` | List row: flag + expression (italic) + timestamp | `entry` |
| `<NoteCard>` | Card: expression + user's annotation in Caveat over ochre bg | `note` |
| `<AccountBanner>` | "Mode local · Créer un compte →" ochre banner | shown only when `isLocal === true` |
| `<ExportCard>` | "Télécharger mon carnet" with JSON/CSV buttons | — |

See `profile-design/atoms.jsx` in the mockup for visual reference (don't copy verbatim — port to typed TSX).

---

## 3. Page structure (pseudo-code)

### Mobile (≤768px)

```jsx
<main className="wex-frame wex-paper-aged">
  <StatusBar />
  <TopNav>
    <BackButton />
    <Eyebrow>Mon carnet</Eyebrow>
    <SettingsButton />
  </TopNav>

  <CoverCard>                              {/* slight tilt -0.4° */}
    <Avatar initial="C" size={64} />
    <div>
      <Eyebrow accent="terra">Mon carnet</Eyebrow>
      <h2 display italic>{displayName}</h2>
      <p faint>Membre depuis {memberSince}</p>
    </div>
    <StreakBadge>🔥 7 jours</StreakBadge>      {/* absolute top-right, tilted */}
    <Divider dashed />
    <Eyebrow>Tes thèmes</Eyebrow>
    <TopTagsRow>...</TopTagsRow>
  </CoverCard>

  <StatTileGrid columns={2}>
    <StatTile value={85}      label="Expressions vues" />
    <StatTile value={12}      label="Favoris" icon="♥" tone="terra" />
    <StatTile value="5/14"    label="Pays explorés" tone="plum" />
    <StatTile value="Français" label="Langue dominante" />
  </StatTileGrid>

  <TabBar tabs={[
    { id: 'favoris',    icon: '♥', label: 'Favoris',    count: 12 },
    { id: 'historique', icon: '👁', label: 'Vues',       count: 85 },
    { id: 'notes',      icon: '✎', label: 'Notes',      count: 2 },
  ]} active={tab} onChange={setTab} />

  {tab === 'favoris' && (
    <>
      <SearchBar placeholder="filtrer mes favoris…" small />
      <CountryFilterChips>tous (12) · 🇫🇷 4 · 🇹🇷 3 · …</CountryFilterChips>
      <FavoriteRow /> × N
    </>
  )}

  {tab === 'historique' && (
    <>
      <Subtitle>Tes 50 dernières lectures · effacer →</Subtitle>
      <HistoryRow /> × N
    </>
  )}

  {tab === 'notes' && <NoteCard /> × N }

  {/* COUNTRY PROGRESSION — always visible below tabs */}
  <Eyebrow accent="terra">Ta collection</Eyebrow>
  <h3 display>Progression par pays</h3>
  <CountryProgressBar /> × 14

  {isLocal && <AccountBanner />}
  <ExportCard />

  <Spacer h={100} />
  <BottomNav active="favoris" />          {/* ♥ Favoris is the active tab */}
</main>
```

### Desktop (≥1024px)

```jsx
<main className="wex-frame wex-paper-aged" grid="220px 1fr">
  <Sidebar active="favoris" />            {/* ♥ Favoris highlighted */}

  <MainContent>
    <Breadcrumb>
      <a>Accueil</a> › Mon carnet
      <SettingsButton aligned-right />
    </Breadcrumb>

    <CoverPostcard tilt={-0.2}>
      <FlexRow>
        <Avatar size={84} initial="C" />
        <div>
          <Eyebrow accent="terra">Mon carnet</Eyebrow>
          <h2 display italic size="38px">{displayName}</h2>
          <MetaLine>
            Membre depuis mars 2026 · 🔥 7 jours d'affilée · Langue : Français
          </MetaLine>
        </div>
        <StatTileRow>
          <StatTile size="lg" value={85}   label="vues" />
          <StatTile size="lg" value={12}   label="favoris" tone="terra" icon="♥" />
          <StatTile size="lg" value="5/14" label="pays" tone="plum" />
        </StatTileRow>
      </FlexRow>
      <Divider dashed />
      <TopTagsRow />
    </CoverPostcard>

    <TwoColLayout columns="1.6fr 1fr">
      <LeftCol>
        <TabBar tabs={['favoris','historique','notes']} />
        {/* tab content (same as mobile, but wider) */}
      </LeftCol>

      <RightCol>
        <Card>                                          {/* Country progression */}
          <Eyebrow accent="terra">Ta collection</Eyebrow>
          <h3>Progression par pays</h3>
          <CountryProgressBar /> × 6
          <Link>+ 8 autres pays →</Link>
        </Card>

        {isLocal && <AccountBanner />}
        <ExportCard />
      </RightCol>
    </TwoColLayout>

    <Footer />
  </MainContent>
</main>
```

---

## 4. Data model

### localStorage schema (key: `wex_carnet`)

```typescript
type Carnet = {
  version: 1;
  user: {
    pseudo: string | null;        // null = "Mon carnet"
    createdAt: string;            // ISO date
    syncedAccountId: string | null; // null = local mode
  };
  favorites: Array<{
    expressionId: string;
    savedAt: string;              // ISO timestamp
  }>;
  history: Array<{
    expressionId: string;
    viewedAt: string;             // ISO timestamp
  }>; // capped at 50 most recent — older entries pruned automatically
  notes: Array<{
    expressionId: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  stats: {
    streakDays: number;
    lastActiveDate: string;       // ISO date (used to compute streak)
    // computed at read time:
    // - totalSeen = history.length
    // - countriesExplored = unique regions in history
    // - topLang, topTags = aggregated from history
  };
};
```

### Helper functions (`web/lib/carnet.ts`)

```typescript
export function getCarnet(): Carnet
export function toggleFavorite(expressionId: string): void
export function isFavorite(expressionId: string): boolean
export function recordView(expressionId: string, region: string, language: string): void
export function setNote(expressionId: string, text: string): void
export function getStats(): ComputedStats          // derives top-tags, top-lang, etc.
export function getProgressByCountry(): Array<...> // join with expressions metadata
export function exportJSON(): Blob
export function exportCSV(): Blob
```

---

## 5. Account state

### Local mode (default)

- No backend call needed
- `AccountBanner` shows at the bottom: "Tu es en mode local · [Créer un compte →]"
- Banner is dismissible (stored in `localStorage.wex_carnet.user.bannerDismissed`)

### When user clicks "Créer un compte"

- Open a modal (reuse `WelcomeModal` patterns) with email input
- Backend sends a magic-link email
- On click, the user lands back here logged in
- The existing local carnet is **uploaded** to the backend (POST `/carnet/sync`)
- From now on, the carnet syncs on every change

### Backend endpoints (V+1, NOT MVP)

```
POST /auth/magic-link    { email }
GET  /auth/verify?token=...   → sets session cookie, redirects to /carnet
POST /carnet/sync        { fullCarnet }   → returns merged result
GET  /carnet/pull        → returns user's stored carnet
```

For the MVP (this PR), only local mode is functional. The "Créer un compte" button can stub-route to a "coming soon" modal.

---

## 6. i18n (CRITICAL)

**All visible strings in the UI must come from the i18n dictionary**, matching `uiLang`. The mockup hard-codes French strings — that's the spec, not the implementation.

Extend the existing `T` object in `web/lib/i18n.ts` (or in the page) with this new keyset:

```typescript
T.fr.carnet = {
  title: "Mon carnet",
  memberSince: (date) => `Membre depuis ${date}`,
  streak: (n) => `${n} jours d'affilée`,
  stats: {
    seen: "Expressions vues",
    favorites: "Favoris",
    countries: "Pays explorés",
    topLang: "Langue dominante",
    yourThemes: "Tes thèmes",
  },
  tabs: {
    favorites: "Favoris",
    history: "Historique",
    notes: "Notes",
  },
  filter: "filtrer mes favoris…",
  // … etc.
};
// T.en.carnet, T.es.carnet, T.it.carnet, T.tr.carnet — same shape, translated.
```

**The language pill in the sidebar must reflect the active language.** Currently the sidebar in the design shows `🇫🇷 FR` active (because all copy is in French). If the user switches to EN via the pill, the entire interface — including badge names, "Mon carnet" → "My notebook", tab labels, etc. — re-renders in English.

---

## 7. Animations & transitions

| Trigger | Effect | Duration | Easing |
|---|---|---|---|
| Page mount | Cover card slides up + fades in | 500ms | `cubic-bezier(0.2, 0.7, 0.3, 1)` |
| Tab switch | Cross-fade content (opacity only) | 200ms | ease |
| Favorite remove (♥ click) | Row fades + slides up, then list reflows | 250ms | ease-out |
| Streak increment (daily, on first visit of new day) | Brief "+1 🔥" overlay | 1.2s | — |
| Progress bar fill (mount) | Width grows from 0 to value | 600ms | ease |
| AccountBanner appear | Slide up from bottom | 300ms | ease-out |

Reuse the existing `fadeSlideUp` keyframe from `globals.css`.

---

## 8. Routing & nav integration

- New route: `web/app/carnet/page.tsx`
- Sidebar link: `<SidebarItem href="/carnet" icon="♥" label="Favoris" count={favoritesCount} active />`
- Bottom nav (mobile): the 4th item ♥ Favoris navigates to `/carnet`
- Browser history: each tab change updates the URL hash (`/carnet#favoris`, `/carnet#historique`, etc.) for back-button friendliness

---

## 9. What changes elsewhere

These small touches to make favoriting flow nicely:

1. **`ExpressionCard.tsx`** + the new expression detail page — already have a heart button. **Wire it up** to `toggleFavorite(expressionId)` and reflect `isFavorite()` state with the active color (`var(--terra)`).
2. **Expression detail view** (any page) — call `recordView(expressionId, region, language)` on mount, so history tracks.
3. **Streak computation** — on first visit of a calendar day, if `lastActiveDate` was yesterday → `streakDays++`. Else if older than 1 day → `streakDays = 1`. Update `lastActiveDate`.

---

## 10. Out of scope (V+1)

- Real account auth (magic link, sessions)
- Backend `POST /carnet/sync`
- **Badges / achievements system** — deliberately deferred. The data model and UI have no badges. To add later, plan: server-side rules engine + new tab + i18n catalogue.
- Sharing favorites with friends (public profile)
- Custom collections / playlists ("ma sélection d'expressions sur l'argent")

These can come later — the localStorage-first design lets us ship the carnet **without any backend changes**.

---

## 11. Acceptance criteria

1. New route `/carnet` accessible from sidebar (desktop) and bottom-nav ♥ icon (mobile)
2. Cover card shows: avatar (`C` initial by default), "Mon carnet" name, member since date, streak chip
3. 4 stat tiles visible (vues / favoris / pays / langue)
4. Top 3 themes shown as plum chips with counts
5. Tab bar with 3 tabs (Favoris / Historique / Notes) on both mobile and desktop
6. ♥ Favoris is the default open tab and shows the filterable list
7. Country progression bars are accurate (n/total per country) and visible below the tabs (mobile) or in the right side panel (desktop)
8. `AccountBanner` visible at bottom in local mode, dismissible
9. Export CSV/JSON buttons download a real file with current favorites + notes + history
10. **All visible text** uses i18n keys — switching language via the pill instantly re-renders the entire `/carnet` in the new language
11. Language pill shows the active UI language as selected — never a mismatch between the active pill and the rendered copy

---

## 12. Recommended file structure

```
web/
├── app/
│   ├── carnet/
│   │   └── page.tsx              ← new route, ~250 lines
│   └── globals.css                ← (tokens already there from home redesign)
├── components/
│   ├── carnet/
│   │   ├── Avatar.tsx
│   │   ├── StatTile.tsx
│   │   ├── CountryProgressBar.tsx
│   │   ├── TabBar.tsx
│   │   ├── FavoriteRow.tsx
│   │   ├── HistoryRow.tsx
│   │   ├── NoteCard.tsx
│   │   ├── AccountBanner.tsx
│   │   └── ExportCard.tsx
│   └── home/                      ← (created by homepage redesign)
└── lib/
    ├── carnet.ts                  ← localStorage helpers (new)
    └── i18n.ts                    ← extend T with carnet keys
```

---

*Reference visual: open `Profile (hi-fi).html` in the design project for the exact look. The JSX maps 1:1 to TSX — only difference is real Next `<Link>`s instead of buttons, and `useState` driven by real data from `lib/carnet.ts`.*

# Homepage Redesign — Spec for Claude Code

> Destination: `web/app/page.tsx` (and related files in `web/`)
> Reference HTML mockup: `Home (hi-fi).html` + `home-design/` in the design project
> Fidelity: **high** — colors, typography, spacing should match the mockup pixel-close.

---

## 0. Context

This spec describes the new homepage for **World Expressions**. The current homepage (`web/app/page.tsx`, ~56KB, ~1100 lines) is functional but visually generic ("purple SaaS"). The redesign pivots to a **"carnet de voyage"** aesthetic — warm cream paper, postcard hero, country stamps, hand‑written accents — while keeping all existing data flows (FastAPI, Next.js router, the language switcher).

**Scope of this redesign:** the homepage (`/`) only. Other pages (`/expression/[id]`, `/country/[code]`) have their own specs.

---

## 1. Design tokens

Add to `web/app/globals.css` (or extract to a `web/app/tokens.css` imported from layout).

```css
:root {
  /* PAPER & INK */
  --paper:        #fdf8ee;
  --paper-deep:   #f3e8d4;
  --paper-edge:   #e8dcc4;
  --paper-fold:   #ddd0b5;
  --ink:          #1c1410;
  --ink-soft:     #5c4f47;
  --ink-softer:   #8b7d72;
  --ink-faint:    #b8aa9b;

  /* BRAND — softened purple (was #7c3aed in v2) */
  --plum:         #6b4d8f;
  --plum-deep:    #4a3565;
  --plum-soft:    #c9b8d9;
  --plum-bg:      #ebe3f1;

  /* ACCENT — terracotta stamp */
  --terra:        #c1543a;
  --terra-deep:   #92341f;
  --terra-soft:   #f0c8b8;
  --terra-bg:     #f7e3d8;

  /* HIGHLIGHT — ochre */
  --ochre:        #d4a83a;
  --ochre-deep:   #8b6b1c;
  --ochre-soft:   #f1e1a8;
  --ochre-bg:     #faf2cf;

  /* TYPOGRAPHY */
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body:    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-hand:    "Caveat", "Comic Sans MS", cursive;

  /* SHADOWS — warm, never gray */
  --shadow-postcard: 3px 6px 0 rgba(28,20,16,0.08), 1px 2px 4px rgba(28,20,16,0.06);
  --shadow-stamp:    1px 2px 0 rgba(28,20,16,0.12);
  --shadow-card:     0 1px 2px rgba(28,20,16,0.05), 0 4px 12px rgba(28,20,16,0.06);
  --shadow-deep:     0 8px 28px rgba(28,20,16,0.18);

  /* RADIUS */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 18px;
  --r-pill: 999px;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
}
```

### Fonts

Replace any current font setup with:

```html
<!-- in web/app/layout.tsx <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

(Or use `next/font` with these three families — pick whichever fits your build pipeline.)

---

## 2. Page structure (pseudo-code)

### Mobile layout (≤768px)

```jsx
<main className="wex-frame wex-paper-aged">
  <StatusBar />                       {/* native, no need to render */}
  <Header>                            {/* sticky-ish, transparent over hero */}
    <Wordmark>World <em>Expressions</em></Wordmark>
    <LangPicker compact />
    <FavIcon />
  </Header>

  {/* HERO — country photo backdrop + postcard */}
  <CountryPhotoBackdrop photo={featured.photo} fadeBottom>
    <Eyebrow tone="terra-on-photo">
      ✦ Expression du jour · {featured.country}
    </Eyebrow>
    <Postcard tilt={-0.5}>
      <Postmark date="27" month="MAY" year="26" />        {/* top-right */}
      <Meta>{featured.type} · {featured.register}</Meta>
      <h2 display italic>{featured.expression}</h2>
      <p hand>« {featured.literal} »</p>
      <Divider dashed />
      <p>{featured.meaning}</p>
      <ChipRow>
        <CountryChip />
        <ConceptChip plum /> × N
      </ChipRow>
    </Postcard>
    <Actions over-photo>
      <GhostButton>🎲 Une autre</GhostButton>
      <SolidButton>Lire la fiche →</SolidButton>
    </Actions>
  </CountryPhotoBackdrop>

  <SearchBar />                       {/* pill, full-width */}

  {/* ATLAS — horizontal scroll of country stamps */}
  <Section eyebrow="L'atlas" title="14 pays, à toi">
    <HorizontalScroll>
      <CountryStamp size="sm" /> × 7
      <MoreCard>+ 7 autres pays</MoreCard>
    </HorizontalScroll>
  </Section>

  {/* CONCEPTS — wrap of clickable chips */}
  <Section eyebrow="Au fil des thèmes" title="Les mots qui voyagent">
    <ChipWrap>
      <ConceptChip withCount /> × 9
      <ChipLink>tous les concepts →</ChipLink>
    </ChipWrap>
  </Section>

  {/* RECENT — list of small expression rows */}
  <Section eyebrow="Cette semaine" title="Récemment ajoutées"
           rightSlot="+47 cette semaine">
    <ExpressionRow /> × 4
    <CenteredGhostButton>🌍 Voir toutes les expressions</CenteredGhostButton>
  </Section>

  <Spacer h={100} />                  {/* room for bottom nav */}

  <BottomNav>
    <NavItem icon="🏠" label="Accueil" active />
    <NavItem icon="🌍" label="Atlas" />
    <NavItem icon="💡" label="Concepts" />
    <NavItem icon="♡" label="Favoris" />
  </BottomNav>
</main>
```

### Desktop layout (≥1024px)

```jsx
<main className="wex-frame wex-paper-aged" grid="220px 1fr">
  <Sidebar>
    <Wordmark stacked>World / Expressions (italic terra)</Wordmark>
    <Tagline hand>Every language has its own madness.</Tagline>
    <NavList>
      <Item icon="🏠">Accueil [active]</Item>
      <Item icon="🌍">Atlas <Count>14</Count></Item>
      <Item icon="💡">Concepts <Count>1050</Count></Item>
      <Item icon="🎲">Au hasard</Item>
      <Item icon="♡">Favoris <Count>3</Count></Item>
    </NavList>
    <Divider />
    <Section title="Langue">
      <LangPill x5 />
    </Section>
    <Spacer flex />
    <Divider />
    <FooterLinks>Newsletter · Instagram · Contribuer</FooterLinks>
    <StatsMini>1 200 expressions · 5 langues · 14 pays</StatsMini>
  </Sidebar>

  <MainContent>
    {/* HERO — full-bleed photo backdrop, contains both postcard and atlas */}
    <CountryPhotoBackdrop photo={featured.photo} fadeBottom>
      <TopBar>
        <Eyebrow on-photo>Accueil · jeudi 27 mai</Eyebrow>
        <Stats on-photo>🔥 7 jours d'affilée · 85 lues</Stats>
      </TopBar>

      <HeroGrid columns="1.15fr 1fr" gap={36}>
        {/* LEFT — postcard */}
        <div>
          <Eyebrow tone="terra-on-photo">
            ✦ Expression du jour · {featured.country}
          </Eyebrow>
          <Postcard tilt={-0.3} large>
            <Postmark date="27" month="MAY" year="26" size={92} />
            <Meta>{featured.type} · {featured.register} · {featured.country}</Meta>
            <h2 display italic size="44px">{featured.expression}</h2>
            <p hand size="24px">« {featured.literal} »</p>
            <Divider dashed />
            <p>{featured.meaning}</p>
            <ChipRow + Actions row>
              <ConceptChip /> × N
              <GhostButton>🎲 Une autre</GhostButton>
              <SolidButton>Lire la fiche →</SolidButton>
            </ChipRow>
          </Postcard>
        </div>

        {/* RIGHT — atlas preview card */}
        <AtlasCard>
          <Eyebrow>L'atlas</Eyebrow>
          <h3 display>14 pays, à toi</h3>
          <CountryStampGrid columns={3} rows={2} />
          <DashedDivider />
          <span hand>+ 8 pays à découvrir</span>
          <GhostButton>voir tous →</GhostButton>
        </AtlasCard>
      </HeroGrid>
    </CountryPhotoBackdrop>

    {/* CONTENT BELOW HERO — on paper */}
    <Padded>
      <SearchBar wide maxWidth={720} />
      <Section eyebrow="Au fil des thèmes" title="Les mots qui voyagent"
               rightSlot="tous les 1 050 concepts →">
        <ChipWrap withCount />
      </Section>
      <Section eyebrow="Cette semaine" title="Récemment ajoutées"
               rightSlot="+47 cette semaine">
        <ExpressionCardGrid columns={3} count={6} />
      </Section>
      <Footer />
    </Padded>
  </MainContent>
</main>
```

---

## 3. Components

New components to create (use existing patterns, place in `web/components/`):

| Component | Purpose | Key props |
|---|---|---|
| `<Postcard>` | Cream paper card with subtle tilt, ink border, postcard shadow | `tilt?: number`, `children` |
| `<Postmark>` | Circular postal cancellation stamp (date inside, terra double-ring, tilted) | `date`, `month`, `year`, `size`, `tilt` |
| `<CountryStamp>` | Postage stamp tile with perforation effect | `country`, `size: 'sm'\|'md'\|'lg'`, `tilt?` |
| `<CountryChip>` | Pill with flag + name (terra-toned) | `flag`, `name`, `href` |
| `<ConceptChip>` | Pill with emoji + tag name (+ optional count) | `concept`, `withCount`, `tone: 'plain'\|'plum'` |
| `<CountryPhotoBackdrop>` | Hero section with country photo, sepia+duotone overlay, paper fade | `photo`, `fadeBottom`, `children` |
| `<Eyebrow>` | Small uppercase pre-title label | `accent?: 'terra'\|'plum'\|'softer'`, `children` |
| `<ExpressionRow>` | Compact list row (mobile recent) | `expr` |
| `<BottomNav>`/`<NavItem>` | Mobile bottom tab bar | `active?: boolean` |
| `<SidebarItem>` | Desktop side nav row | `icon`, `label`, `count?`, `active?` |

Reference HTML for each: see `home-design/atoms.jsx` in the mockup project — but **don't copy verbatim**, rewrite as proper TSX with your existing patterns (Next `<Link>`, typed props, etc).

### Reused / updated existing components

- **`ExpressionCard.tsx`** — keep the file but restyle:
  - Replace top gradient bar (`COUNTRY_GRADIENT`) with a clean 1px top border in `var(--paper-edge)`
  - Replace purple text colors with `var(--plum)` / `var(--ink-soft)`
  - Type/register pill backgrounds: `var(--plum-bg)` and `var(--paper-deep)`
- **`WelcomeModal.tsx`** — keep functionality, restyle with new palette (paper bg, ink text, terra tagline accent, plum CTA)
- **`lib/api.ts`** — **NO CHANGES** to API layer
- **`lib/constants.ts`** — keep `FLAG`, `COUNTRY_NAME` as is. `COUNTRY_GRADIENT` can be deprecated for homepage but kept available for legacy pages.
- **`lib/tagIcons.ts`** — keep as is, used by `ConceptChip`

---

## 4. Country photo treatment

The featured-expression photo backdrop uses a **sepia + duotone** treatment (warm, carnet feel — not the dark overlay of v2). Implementation:

```css
.country-photo {
  position: relative;
  background-image: var(--photo);
  background-size: cover;
  background-position: center;
  background-color: var(--paper-deep);
  isolation: isolate;
}
.country-photo::before {           /* sepia photo backdrop */
  content: "";
  position: absolute; inset: 0;
  background: inherit;
  background-image: var(--photo);
  background-size: cover;
  background-position: center;
  filter: sepia(0.42) saturate(0.7) contrast(0.96) brightness(0.92);
  z-index: 0;
}
.country-photo::after {            /* duotone tint */
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(
    135deg,
    rgba(193,84,58,0.32) 0%,
    rgba(107,77,143,0.22) 100%
  );
  mix-blend-mode: multiply;
  z-index: 1;
}
.country-photo > * { position: relative; z-index: 2; }

.country-photo.--fade-bottom::after {
  background:
    linear-gradient(135deg, rgba(193,84,58,0.30) 0%, rgba(107,77,143,0.20) 100%),
    linear-gradient(to bottom, transparent 50%, var(--paper) 100%);
  mix-blend-mode: normal;
  opacity: 0.95;
}
```

Use the existing `web/public/images/{code}.jpg` files. Set `--photo: url('/images/${featured.region}.jpg')` inline on the wrapper.

---

## 5. CountryStamp — perforation effect

Postage-stamp visual using radial-gradient corner masks (already in the mockup). Approximate CSS:

```css
.country-stamp {
  width: var(--w, 120px);
  height: var(--h, 144px);
  background-color: var(--stamp-tint);
  border-radius: 4px;
  position: relative;
  box-shadow: var(--shadow-stamp), inset 0 0 0 1px rgba(28,20,16,0.06);
  background-image:
    radial-gradient(circle at 0 0, var(--paper) 5px, transparent 5.5px),
    radial-gradient(circle at 100% 0, var(--paper) 5px, transparent 5.5px),
    radial-gradient(circle at 0 100%, var(--paper) 5px, transparent 5.5px),
    radial-gradient(circle at 100% 100%, var(--paper) 5px, transparent 5.5px);
  background-repeat: no-repeat;
}
.country-stamp__inner {
  position: absolute; inset: 6px;
  border: 1px solid rgba(28,20,16,0.18);
  border-radius: 2px;
  padding: 10px;
  display: flex; flex-direction: column; justify-content: space-between;
}
```

Each country needs a tint color — map (see mockup `home-design/atoms.jsx` `COUNTRY_TINT`):
- `fr` → `#ebe3f1` · `uk` → `#d8d8e6` · `us`/`tr` → `#f7e3d8` · `es` → `#faf2cf` · `it` → `#dde5d6` · `au`/`ar`/`cl` → `#d8e0ee` · `mx` → `#e0e4d4` · `co` → `#f0dcb0`

---

## 6. What changes vs current `web/app/page.tsx`

### Major refactors

1. **Strip the dark hero overlay** — replace `rgba(10,4,28,0.42)` overlay with the sepia+duotone treatment above. The photo stays.
2. **Move from inline-styled monolith to component file** — the current 1100-line `page.tsx` should call into the new components above, keeping the file ~200 lines (data fetching, state, layout).
3. **Filter UI simplification** — REMOVE from the homepage:
   - The `countryDropdownOpen` country multi-select
   - The `conceptDropdownOpen` concept dropdown
   - The "Mix countries" `⇄` button
   - The `typeFilter` chips
   - The "Explorer un pays" / "Explorer un concept" expandable chip grids
   These move to dedicated pages (`/atlas`, `/concepts`) accessed via the sidebar.
4. **Replace bottom-of-page elements** with the new sections (Atlas preview, Concepts preview, Recent expressions).
5. **Add persistent navigation** — sidebar on desktop (≥1024px), bottom tab bar on mobile. Both contain: Accueil · Atlas · Concepts · ♡ Favoris (+ `🎲 Hasard` on desktop sidebar only — mobile users access random via the postcard's "Une autre" button).

### Smaller changes

- `<h1>` "World Expressions" stays but typography changes to Fraunces 500 italic for the word "Expressions" (terra color), regular ink for "World".
- Random-expression refresh dice button (`🎲`) stays but is now a ghost button positioned with the postcard CTA, not floating in the corner.
- Language switcher: keep functional logic, restyle pills (1.5px ink border when active, paper-edge otherwise).
- Welcome modal: keep, restyle palette.

### Removed (homepage only — features may move to other pages)

- The "Mix" interleaving feature → moves to `/atlas` page where it makes more sense.
- The "Filter by type" chips → moves to search/atlas results pages.
- The country-photo `REGION_GRADIENTS` fallback (no longer needed — paper-deep fills empty cases).

---

## 7. Conserved as-is

- All API endpoints + `lib/api.ts` shape
- `searchExpressions`, `searchByConcept`, `browseByRegion`, `getTopTags`, `getRandomExpression`, `getAllTagNames`, `getRegions`, `getTypeCounts` — keep all these
- The `featured` expression rotation mechanism (`getRandomExpression` + sessionStorage caching)
- The `WelcomeModal` first-visit flow (just restyle)
- The `localStorage.wex_lang` persistence
- The Hash-based deep linking (`#q=...`) for searches
- The data shape: `Expression`, `TypeCounts`
- Country photo files at `web/public/images/{code}.jpg`
- `FLAG`, `COUNTRY_NAME` constants

---

## 8. Animations & transitions

Keep them subtle, paper-feeling — no bouncy material design.

| Trigger | Effect | Duration | Easing |
|---|---|---|---|
| Page mount | `fadeSlideUp` on hero (12px up + opacity) | 600ms | `cubic-bezier(0.2, 0.7, 0.3, 1)` |
| Featured change (🎲) | Cross-fade backdrop photo + slide-up postcard contents | 500ms / 350ms | ease-out |
| Chip hover | Border darkens to `var(--ink)`, bg → `var(--paper-deep)` | 150ms | ease |
| Sidebar/Nav item hover | Background fill | 120ms | ease |
| Search focus | Border `var(--paper-edge)` → `var(--ink)`, 3px halo `rgba(28,20,16,0.06)` | 150ms | ease |
| Postcard hover | None — the postcard is the hero, not interactive |  |  |
| ExpressionRow / ConceptChip / CountryStamp click | Subtle scale 0.99 on `:active` | 80ms | ease |
| Concept dropdown / Country dropdown | **REMOVED** — they don't exist anymore on homepage |  |  |

Existing keyframes in `globals.css` to **keep**:
- `fadeSlideUp` (used in stagger animation for result cards)
- `bgFadeIn` (hero backdrop)
- `fadeIn` (modal)

---

## 9. Out of scope (do NOT touch in this PR)

- `web/app/expression/[id]/page.tsx` — has its own redesign spec
- `web/app/country/[code]/page.tsx` — has its own redesign spec
- `web/app/instagram/page.tsx` — no changes
- `web/app/opengraph-image.tsx` — keep current OG image generation
- Backend (FastAPI `main.py`, `database.py`, `models.py`) — no API changes
- Database schema, migrations, data scripts

---

## 10. Recommended file structure

```
web/
├── app/
│   ├── globals.css          ← add the tokens block + delete dark-mode media query
│   ├── layout.tsx           ← inject Google Fonts <link>s
│   └── page.tsx             ← rewritten, ~200 lines, imports from components/
├── components/
│   ├── ExpressionCard.tsx   ← restyle (existing)
│   ├── WelcomeModal.tsx     ← restyle (existing)
│   ├── home/
│   │   ├── Postcard.tsx
│   │   ├── Postmark.tsx
│   │   ├── CountryStamp.tsx
│   │   ├── CountryChip.tsx
│   │   ├── ConceptChip.tsx
│   │   ├── CountryPhotoBackdrop.tsx
│   │   ├── Eyebrow.tsx
│   │   ├── ExpressionRow.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── HeroSection.tsx
│   └── ui/
│       ├── SearchBar.tsx
│       └── Button.tsx
```

---

## 11. Acceptance criteria (to validate the implementation)

1. Cream paper (`#fdf8ee`) is the dominant background, not white or purple
2. The featured-expression photo backdrop has visible sepia+duotone treatment, NOT a dark overlay
3. The postcard is slightly tilted (-0.3° to -0.6°) and has a warm shadow
4. Fraunces is loaded and used for the expression title (italic 500)
5. Caveat is loaded and used for the literal translation
6. Sidebar visible on `>= 1024px`, bottom nav on `< 1024px`
7. The 4 mobile nav items match the desktop sidebar (Accueil · Atlas · Concepts · Favoris)
8. Clicking 🎲 cycles the featured expression including the country photo
9. Welcome modal still appears on first visit, restyled in new palette
10. Language switcher persists choice to `localStorage.wex_lang`
11. No console errors / no broken `/country/[code]` or `/expression/[id]` navigation

---

*Reference visual: open `Home (hi-fi).html` in the design project for the exact look. When in doubt about a measurement, copy from there — the React/JSX maps 1:1 to TSX.*

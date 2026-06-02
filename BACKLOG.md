# World Expressions — Product Backlog

## Definition of Ready (DoR)
*An item is ready to be picked up when:*

- [ ] Written as a user story (`As a [persona], I want [action] so that [value]`) or as a bug description (steps to reproduce + expected vs actual)
- [ ] Acceptance criteria defined (at least 2 concrete, testable criteria)
- [ ] T-shirt size estimated: **S** (< 2h) / **M** (2–8h) / **L** (1–2 days) / **XL** (3–5 days) / **XXL** (> 1 week)
- [ ] Dependencies identified (other stories, DB migrations, external scripts, etc.)
- [ ] For frontend items: rough UX description or reference mockup provided
- [ ] Priority set: **P0** (blocker) / **P1** (high) / **P2** (normal) / **P3** (nice-to-have)

## Definition of Done (DoD)
*An item is done when:*

- [ ] Code merged to `staging`, tested manually (happy path + edge cases)
- [ ] No visual regression on adjacent pages
- [ ] Frontend: tested on desktop and mobile (responsive)
- [ ] Bug: reproduction scenario documented, then confirmed fixed
- [ ] DB migration: applied on both `staging` and `prod` (Neon)
- [ ] New API endpoint: response verified with curl
- [ ] `MEMORY.md` updated if a product or technical decision was made
- [ ] `README.md` updated if stack or product direction changed
- [ ] Item closed in GitHub Projects board

---

## Next Sprint

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [US-007](#us-007) | Feature | Enrich IT expressions (target 200+) | M | P2 | 📋 Backlog |
| [US-008](#us-008) | Feature | Enrich TR expressions (target 200+) | M | P2 | 📋 Backlog |
| [DEBT-001](#debt-001) | Debt | Enable Vercel Analytics in Dashboard [action: Sinan] | S | P1 | 📋 Backlog |

---

## Backlog — Medium Term

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| ~~[US-026](#us-026)~~ | Feature | ~~Results section headers by match type~~ | S | P2 | ✅ Done (S41) |
| ~~[US-027](#us-027)~~ | Feature | ~~Always show literal translation on expression page~~ | S | P2 | ✅ Done (S41) |
| [US-004](#us-004) | Feature | Search hero-dismiss animation on home | M | P3 | 📋 Backlog |
| [US-005](#us-005) | Feature | SearchOverlay: add country + concept dropdowns | M | P2 | 📋 Backlog |
| [US-006](#us-006) | Feature | Dedicated /search page with persistent filters | L | P2 | 📋 Backlog |
| [US-009](#us-009) | Feature | Add new language (DE or PT) | XL | P3 | 📋 Backlog |
| [US-011](#us-011) | Feature | Concept quality: WordReference enrichment script | M | P3 | 📋 Backlog |
| [US-012](#us-012) | Feature | Register-based navigation (formal/informal/slang) | L | P3 | 📋 Backlog |
| [US-013](#us-013) | Feature | Unify country filters + Mix button into one mechanism | L | P3 | 📋 Backlog |
| [DEBT-003](#debt-003) | Debt | SQL pagination (LIMIT/OFFSET) — trigger: > 3K expressions/language | M | P2 | 📋 Backlog |
| [DEBT-004](#debt-004) | Debt | Add is_phrasebook BOOLEAN column | S | P3 | 📋 Backlog |
| [DEBT-005](#debt-005) | Debt | Render cold start: measure warm response time (< 3s) | S | P2 | 📋 Backlog |
| [DEBT-006](#debt-006) | Debt | Refactor homepage page.tsx inline styles → CSS tokens | L | P3 | 📋 Backlog |
| [DEBT-007](#debt-007) | Debt | Migrate homepage hash routing to Next.js router | L | P3 | 📋 Backlog |

---

## Backlog — Long Term / Vision

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [US-014](#us-014) | Feature | Game Mode: emoji puzzles (V4) | XXL | P3 | 💡 Idea |
| [US-015](#us-015) | Feature | Interactive SVG world map | XL | P3 | 💡 Idea |
| [US-016](#us-016) | Feature | PWA (offline, install on mobile, push notifs) | L | P3 | 💡 Idea |
| [US-017](#us-017) | Feature | Adult section: vulgar/slang expressions with 18+ gate | M | P3 | 💡 Idea |
| [US-018](#us-018) | Feature | Visual styles library (Twemoji, Noto, etc.) | L | P3 | 💡 Idea |
| [US-019](#us-019) | Feature | Collaborative content: user-submitted expressions | XXL | P3 | 💡 Idea |
| [US-020](#us-020) | Feature | Email newsletter: one expression per day | M | P3 | 💡 Idea |
| [US-022](#us-022) | Feature | Emoji as exploration vector (concept graph + visual) | XXL | P3 | 💡 Idea |

---

## Item Details

### US-026
**Results section headers by match type**
> As a user, when I see search results, I want to understand how each expression was found (exact / semantic / translation / concept) so I can immediately grasp why it appears and how deep the search went.

**Size:** S **Priority:** P2
**Context:** `match_type` already exists in search results (`exact` / `semantic` / `translation` / `concept`). Results are currently a flat list with no visual distinction between match types.

**Technical approach:**
- Group results client-side by `match_type` (keep relevance ordering within each group)
- Inject a sticky section header between groups: "Exact match", "Semantic match", "Found via translation", "Same concept"
- i18n 5 languages

**Acceptance criteria:**
1. When results are displayed, section headers appear between groups (e.g. "12 exact matches · 3 semantic · 8 by concept")
2. Each header is visually subtle — not dominant — a separator, not a title
3. If only one match type in results: no section header shown
4. i18n: headers displayed in current UI language
5. No regression on existing search behavior

---

### US-027
**Always show literal translation on expression page**
> As a user on an expression detail page, I want to always see the literal translation of the expression (e.g. "to break the feet" for "casser les pieds"), not just after clicking to translate — so I immediately understand the linguistic humor.

**Size:** S **Priority:** P2
**Context:** `literal_fr` is stored in the DB for many expressions. Currently only visible when the user clicks the translate button. Sinan confirmed he wants it always visible: "it's fun".
**Dependency:** Check coverage — how many expressions have `literal_fr` populated in prod.

**Acceptance criteria:**
1. On `/expression/[id]`, the literal translation is displayed inline below the expression text, always (no click needed)
2. Only shown if the field is non-null and non-empty
3. Visual treatment: smaller text, italic, secondary color — clearly distinct from the meaning
4. If UI language ≠ expression language: show `literal_fr` as the literal translation regardless (it's the FR field, already the main UI)
5. No layout regression on mobile

---

### US-004
**Search hero-dismiss animation on home**
> As a user on the home page, when I click "Search" in the sidebar, the hero section slides up and disappears, the search bar takes focus — no modal, stays in-page.

**Size:** M **Priority:** P3 — impact utilisateur faible (Sinan, S40)
**Acceptance criteria:**
- Hero animates out (slide up + fade) when search triggered from sidebar while on /
- Search input takes focus
- Back to empty state restores hero

---

### US-005
**SearchOverlay: add country + concept dropdowns**
> As a user, I want to filter search results by country and/or concept directly from the overlay, without going to the home page first.

**Size:** M **Priority:** P2
**Acceptance criteria:**
- Overlay shows 2 optional dropdowns (country, concept) below the text input
- Dropdowns default to "all"
- Results filtered when dropdowns are set

---

### US-006
**Dedicated /search page with persistent filters**
> As a user, I want a dedicated /search URL with query in URL params, persistent filters, and results — shareable and SEO-friendly.

**Size:** L **Priority:** P2
**Dependencies:** frontend router, API query params
**Acceptance criteria:**
- `/search?q=argent&lang=fr` returns results directly
- Page has proper `<title>` and meta description
- Back button works correctly

---

### US-007 / US-008
**Enrich IT / TR expressions (target 200+ each)**
> As a user, I want more idiomatic expressions in Italian and Turkish so the app feels substantial in those languages.

**Size:** M each
**Dependencies:** Mistral token (expires 2026-06-10 — urgent)
**Acceptance criteria:**
- IT: ≥ 200 expressions in prod DB
- TR: ≥ 200 expressions in prod DB
- All new expressions have meaning, origin, example in their language

---

### US-009
**Add new language (DE or PT)**
> As a user interested in European languages, I want to discover German or Portuguese expressions so I can explore another major culture.

**Size:** XL **Priority:** P3
**Dependencies:** source identification, generate_expressions.py adaptation, UI lang selector update, translations matrix update

---

### US-011
**Concept quality: WordReference enrichment script**
> As a product owner, I want a script that cross-checks our concept links (expression A ↔ expression B via concept_id) against WordReference, to surface false positives so we can improve quality.

**Size:** M **Priority:** P3
**Context:** WordReference dict accessible (fren, fres, frit). Forums blocked (HTTP 418). Script `check_wordreference.py` already exists as a prototype.

---

### US-012
**Register-based navigation**
> As a user, I want to browse expressions by language register (formal / informal / slang / vulgar) and compare how different cultures express the same idea at the same register level.

**Size:** L **Priority:** P3
**Context:** `register` field already in DB. Workshop needed to define page design and navigation model before coding.

---

### US-013
**Unify country filters + Mix button**
> As a user, when I select multiple countries, I want the Mix behavior to happen automatically — without a separate button.

**Size:** L **Priority:** P3
**Context:** 1 country selected = filter. 2+ countries = mix (round-robin). Mix button could disappear as standalone UI.

---

### US-014
**Game Mode: emoji puzzles (V4)**
> As a user, I want to guess the expression from a grid of emojis — with no text hint — then reveal the answer from the database.

**Size:** XXL **Priority:** P3 (deferred until tech base is solid)
**Dependencies:** solid data quality in all 5 languages, is_phrasebook column
**Acceptance criteria:** TBD (full conception workshop needed first)

---

### US-022
**Emoji as exploration vector**
> As a user, I want to explore expressions by clicking or searching with an emoji, discovering expressions from all languages linked to that visual concept.

**Size:** XXL **Priority:** P3
**Note:** Workshop needed to define emoji → concept mapping.

---

### DEBT-001
**Enable Vercel Analytics** [action: Sinan in Vercel Dashboard]
> Enable Vercel Analytics so usage data starts being collected. Code already deployed (commit f751a8b).

**Size:** S **Priority:** P1
**Acceptance criteria:**
- Vercel Dashboard → Analytics → Enabled
- Data appears in dashboard within 24h

---

### DEBT-003
**SQL pagination (LIMIT/OFFSET)**
> Replace Python-level slicing in `search_expressions` (database.py) with native SQL LIMIT/OFFSET.

**Size:** M **Trigger:** when any language exceeds ~3 000 expressions
**Acceptance criteria:**
- `search_expressions` uses SQL LIMIT/OFFSET
- Python never loads full result set into memory
- Existing tests pass

---

### DEBT-004
**Add is_phrasebook BOOLEAN column**
> Add a dedicated boolean column to flag phrasebook entries (currently tagged with `phrasebook` tag), enabling cleaner filtering without tag dependency.

**Size:** S **Priority:** P3
**Trigger:** before Game Mode development

---

### DEBT-005
**Render cold start: measure warm response time**
> Confirm that warm API responses are under 3s. Add a Playwright timing assertion or a manual benchmark.

**Size:** S **Priority:** P2

---

### DEBT-006
**Refactor homepage page.tsx inline styles → CSS tokens**
> Replace inline style objects in page.tsx with CSS class names using existing design tokens.

**Size:** L **Priority:** P3
**Trigger:** before a major homepage redesign

---

### DEBT-007
**Migrate homepage hash routing to Next.js router**
> Replace `window.history.replaceState(null, "", "#concept=...")` with proper Next.js router navigation.

**Size:** L **Priority:** P3
**Trigger:** before adding /search dedicated page (US-006)

---

*Last updated: 2026-06-02 (session 40)*
*Maintained by Claude — update after each session's commits*

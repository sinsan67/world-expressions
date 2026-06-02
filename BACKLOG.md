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

## Sprint — Current (session 30, 2026-06-02)

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [BUG-001](#bug-001) | Bug | Search from sidebar broken on home page | S | P0 | ✅ Fixed — pending merge |
| [US-001](#us-001) | Feature | Merge staging → main (55ec049) | S | P0 | 🔜 Ready |
| [US-002](#us-002) | Feature | Verify TR enrichment completion + count | S | P1 | 🔜 Ready |
| [US-003](#us-003) | Feature | QA Checklist items #12+ | M | P1 | 🔜 Ready |

---

## Backlog — Next Sprint

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [US-004](#us-004) | Feature | SearchOverlay: hero-dismiss animation on home | M | P2 | 📋 Backlog |
| [US-005](#us-005) | Feature | SearchOverlay: add country + concept dropdowns | M | P2 | 📋 Backlog |
| [US-006](#us-006) | Feature | Dedicated /search page with persistent filters | L | P2 | 📋 Backlog |
| [US-007](#us-007) | Feature | Enrich IT expressions (target 200+) | M | P2 | 📋 Backlog |
| [US-008](#us-008) | Feature | Enrich TR expressions (target 200+) | M | P2 | 📋 Backlog |
| [DEBT-001](#debt-001) | Debt | Enable Vercel Analytics in Dashboard [action: Sinan] | S | P1 | 📋 Backlog |
| [DEBT-002](#debt-002) | Debt | Playwright E2E tests in CI (VERCEL_BYPASS_TOKEN) | S | P2 | 📋 Backlog |
| [DEBT-003](#debt-003) | Debt | SQL pagination (LIMIT/OFFSET) — trigger: > 3K expressions | M | P2 | 📋 Backlog |
| [DEBT-004](#debt-004) | Debt | Add is_phrasebook BOOLEAN column | S | P3 | 📋 Backlog |
| [DEBT-005](#debt-005) | Debt | Render cold start: Playwright timing test (< 3s warm) | S | P2 | 📋 Backlog |

---

## Backlog — Medium Term

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [US-021](#us-021) | Feature | Cross-language concept search (issue #20) | L | P2 | 📋 Backlog |
| [US-009](#us-009) | Feature | Add new language (DE or PT) | XL | P3 | 📋 Backlog |
| [US-010](#us-010) | Feature | Feature Voice: listen to expression (Web Speech API) | S | P3 | 📋 Backlog |
| [US-011](#us-011) | Feature | Concept quality: WordReference enrichment script | M | P3 | 📋 Backlog |
| [US-012](#us-012) | Feature | Register-based navigation (formal/informal/slang) | L | P3 | 📋 Backlog |
| [US-013](#us-013) | Feature | Unify country filters + Mix button into one mechanism | L | P3 | 📋 Backlog |
| [DEBT-006](#debt-006) | Debt | Refactor homepage page.tsx inline styles → CSS tokens | L | P3 | 📋 Backlog |
| [DEBT-007](#debt-007) | Debt | Migrate homepage hash routing to Next.js router | L | P3 | 📋 Backlog |

---

## Backlog — Long Term / Vision

| ID | Type | Title | Size | Priority | Status |
|----|------|-------|------|----------|--------|
| [US-022](#us-022) | Feature | Emoji as exploration vector (concept graph + visual) | XXL | P3 | 💡 Idea |
| [US-014](#us-014) | Feature | Game Mode: emoji puzzles (V4) | XXL | P3 | 💡 Idea |
| [US-015](#us-015) | Feature | Interactive SVG world map | XL | P3 | 💡 Idea |
| [US-016](#us-016) | Feature | PWA (offline, install on mobile, push notifs) | L | P3 | 💡 Idea |
| [US-017](#us-017) | Feature | Adult section: vulgar/slang expressions with 18+ gate | M | P3 | 💡 Idea |
| [US-018](#us-018) | Feature | Visual styles library (Twemoji, Noto, etc.) | L | P3 | 💡 Idea |
| [US-019](#us-019) | Feature | Collaborative content: user-submitted expressions | XXL | P3 | 💡 Idea |
| [US-020](#us-020) | Feature | Email newsletter: one expression per day | M | P3 | 💡 Idea |

---

## Item Details

### BUG-001
**Search from sidebar broken on home page**
> As a user, when I open the search overlay from the sidebar and submit a query, I expect to see results on the home page — even if I was already on that page.

**Root cause:** `router.push('/#q=...')` on the same page doesn't remount the component — the hash `useEffect` with `[]` deps doesn't re-fire.
**Fix:** dispatch a `wex-search` custom event in `SearchOverlay.tsx`; `page.tsx` listens and calls `handleSearch(q)`.
**Files:** [SearchOverlay.tsx](web/components/SearchOverlay.tsx) · [page.tsx](web/app/page.tsx)
**Acceptance criteria:**
- Typing "argent" + Enter in the overlay from home page → results appear
- Typing from /atlas → navigates to home + results appear
- Overlay closes after submit

---

### US-001
**Merge staging → main (session 30 commits)**
> Merge commit 55ec049 from staging to main so prod reflects the sidebar search button and hero-dismiss features.
**Acceptance criteria:**
- prod URL shows "Rechercher" button in sidebar
- Hero hides when results are displayed
- Tagline in sidebar is translated

---

### US-002
**Verify TR enrichment completion**
> Check that the TR enrichment script (PID 21910, ~230/500 at close of session 29) has completed and count how many TR expressions are now in prod.
**Acceptance criteria:**
- `ps aux | grep generate` returns nothing (process done)
- `tail -20 /tmp/enrichment_it_tr.log` shows completion message
- DB count TR expressions logged

---

### US-003
**QA Checklist items #12+**
> Continue the manual QA pass starting from item #12 in QA_CHECKLIST.html. Collect failures, synthesize into a prioritized fix plan.
**Acceptance criteria:**
- Items #12–#30 tested and documented (pass/fail)
- Failures logged with priority and estimated fix size

---

### US-004
**SearchOverlay: hero-dismiss animation on home**
> As a user on the home page, when I click "Search" in the sidebar, the hero section slides up and disappears, the search bar takes focus — no modal, stays in-page.
**Size:** M **Priority:** P2
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
**Dependencies:** Mistral token (expires 2026-06-10 — high urgency)
**Acceptance criteria:**
- IT: ≥ 200 expressions in prod DB
- TR: ≥ 200 expressions in prod DB
- All new expressions have meaning, origin, example in their language

---

### DEBT-001
**Enable Vercel Analytics** [action: Sinan in Vercel Dashboard]
> Enable Vercel Analytics so usage data starts being collected. Code already deployed (commit f751a8b).
**Size:** S **Priority:** P1
**Acceptance criteria:**
- Vercel Dashboard → Analytics → Enabled
- Data appears in dashboard within 24h of enabling

---

### DEBT-002
**Playwright E2E tests in CI (VERCEL_BYPASS_TOKEN)**
> Add the VERCEL_BYPASS_TOKEN to Playwright config so E2E tests can run against the staging URL (currently blocked by Vercel SSO).
**Size:** S
**Acceptance criteria:**
- `VERCEL_BYPASS_TOKEN` set in env
- `npx playwright test` runs against staging without auth errors
- Tests pass

---

### DEBT-003
**SQL pagination (LIMIT/OFFSET) — trigger: > 3K expressions/language**
> Replace Python-level slicing in `search_expressions` (database.py `fetchall()`) with native SQL `LIMIT`/`OFFSET`. Currently loads all results into memory before slicing.
**Size:** M **Trigger:** when any language exceeds ~3 000 expressions
**Acceptance criteria:**
- `search_expressions` uses SQL LIMIT/OFFSET
- Python never loads full result set into memory
- Existing tests pass

---

### US-010
**Feature Voice: listen to expression (Web Speech API)**
> As a user, I want to click a "listen" button on any expression card to hear the expression pronounced in its original language.
**Size:** S (Web Speech API is browser-native, no backend needed)
**Acceptance criteria:**
- Button visible on expression page `/expression/[id]`
- Reads the expression text in the correct `lang=` (fr/en/es/it/tr)
- Graceful fallback if browser doesn't support SpeechSynthesis

---

### US-021
**Cross-language concept search**
> As a user, when I type a word (e.g. "source"), I want to discover expressions in ALL available languages that relate to the same concept — not just those containing the word literally — so I can explore how different cultures express the same idea.

**Size:** L **Priority:** P2 **Refs:** issue #20
**Technical approach:** Concept Graph (540 cross-lingual concepts already in DB) — word → concept(s) → expressions linked to those concepts, all languages
**Dependencies:** concept_graph populated in DB, FTS remains for exact matches

**Acceptance criteria:**
- Typing "source" returns expressions in FR/EN/ES/IT/TR that share the same concept — even if they don't contain the word "source"
- Concept-matched results are visually distinguishable from text-exact matches (e.g. label "by concept")
- Each result shows its country/language of origin
- **If a country filter is active** (or user is on a `/country/[code]` page): only expressions from that country are returned, even for concept-based matches
- If no concept graph match: fallback to text-based FTS only (no regression)

---

### US-022
**Emoji as exploration vector (concept graph + visual)**
> As a user, I want to explore expressions by clicking or searching with an emoji, discovering expressions from all languages linked to that visual concept — giving the app a playful, non-verbal entry point.

**Size:** XXL **Priority:** P3 (long-term exploration)
**Note:** needs a workshop to define emoji → concept mapping (1 emoji → N concepts/words), and a visual design for the graph exploration view.

**Acceptance criteria:** TBD — conception workshop first

---

### US-014
**Game Mode: emoji puzzles (V4)**
> As a user, I want to guess the expression from a grid of emojis — with no text hint — then reveal the answer from the database.
**Size:** XXL **Priority:** P3 (deferred until tech base is solid)
**Dependencies:** solid data quality in all 5 languages, is_phrasebook column
**Acceptance criteria:** TBD (full conception workshop needed first)

---

*Last updated: 2026-06-02 (session 31)*
*Maintained by Claude — update after each session's commits*

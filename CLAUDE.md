# Project — Expressions du Monde Web App

## Goal
Build a fun, intuitive, and visual web application around French idiomatic expressions: exploration and play.

## Status
V1 functional locally (FastAPI backend + HTML/CSS/JS frontend). Testing and iteration phase.

## Product Vision
A website (future PWA) where users type a word and discover French expressions related to it — either because they contain that word, or because they share its meaning. Results are displayed in a clear and visually appealing way.

## Decisions Made

### V1 Scope
- **French expressions only**
- Home page: search bar + illustration
- Results: list of expressions with a detail card

### Expression Card (V1)
- Meaning
- Origin
- Usage example sentence
- (V2+) Equivalent in other languages

### Search
- Exact: the word appears in the expression text
- Semantic: the word appears in meaning, tags, example, or origin (e.g. searching "annoy" finds "casser les pieds")
- Both match types are visually distinguished in results

### Data
- ~400 French expressions (built with Claude from public sources)
- V1 format: structured JSON file

### Tech Stack
- **Backend**: Python + FastAPI
- **Database**: JSON (V1) → SQLite → PostgreSQL
- **Frontend**: HTML/CSS + JavaScript
- **PWA**: added in V2

### JSON Field Names
```json
{
  "id": "kebab-case-slug",
  "expression": "The expression text",
  "meaning": "What it means",
  "origin": "Where it comes from",
  "example": "Example sentence",
  "register": "standard | informal | slang | vulgar | formal",
  "tags": ["tag1", "tag2"],
  "region": null,
  "illustration": null
}
```

### API Endpoints
- `GET /` — server health + expression count
- `GET /search?q=word` — search (exact + semantic)
- `GET /expression/{id}` — full expression detail

### Deployment
- V1: local only
- V2: deploy to the internet

## UX Principles

### Navigability (core principle)
Users must be able to navigate freely between concepts by clicking — not just searching. Concretely:
- Each expression has its own URL (e.g. `/expression/casser-les-pieds`)
- Each tag is clickable → list of expressions with that tag
- Each register is clickable → browse by language level
- Expressions should link to each other (related expressions, same family...)

This shapes the architecture: a frontend **router** (no-reload navigation) is needed starting V2.

### Playfulness & Delight (core principle)
This app should feel alive, mischievous, and surprising — not just informative. Every interaction is an opportunity to delight the user:
- Repeated clicks on the same element should do something new (e.g. re-shuffling hint chips)
- Animations, micro-interactions, and randomness are welcome when they serve the experience
- The unexpected is a feature: a different chip set on every visit, a card that flips, a result that surprises
- Propose playful interaction ideas proactively — if a feature can be made more dynamic or fun without added complexity, do it

This principle applies at every scale: a button behavior, a transition, a result ordering, a loading state.

### V2 Design
Reference: [ethereum.org](https://ethereum.org) — clarity, illustrations, pastel colors.

**Visual logic by page type:**
- Expression cards (simple pages) → **emojis**: lightweight, textual, contextual, no image file needed
- Exploration pages (tags, themes, home) → **SVG illustrations**: rich, designed, one per theme

## Version History

### V1 (current — local)
- FastAPI backend + 400 French expressions in JSON
- Single-page frontend: search + result cards
- Exact + semantic search
- Clickable tags
- Suggestion chips (pied, argent, animal, mentir, partir, peur, verlan)

### V2 (upcoming)
- Frontend router (pages per expression, per tag)
- Visual redesign inspired by ethereum.org (pastel, SVG illustrations)
- PWA

### V3/V4 (long-term vision)

**Interactive Map of France**
- Enrich the database with the regional origin of each expression
- Source: **TLFi (Trésor de la Langue Française informatisé)** — CNRS + University of Lorraine
- Plan: contact them for a partnership (educational and cultural project, public institution)
- "Map" page: SVG of France with clickable regions
- Click a region → list of expressions born or rooted there
- `region` field already in JSON (null for now)

**Per-expression Illustration**
- A unique SVG illustration for each expression
- Generation method TBD: AI-generated (Midjourney/DALL-E → vectorization) or native SVG
- `illustration` field already in JSON to hold the URL or SVG code
- Turns each card into a true visual artifact

## Context
Personal project by Sinan — first web application. Open-source and collaborative. Pedagogical approach preferred. Goal is to evolve the product version by version.

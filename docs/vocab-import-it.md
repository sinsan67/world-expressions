# Italian starter vocabulary — import spec (kind="word")

**Scoped S197 (2026-07-10), validated by Sinan: travel-themed selection ·
~300 words · standard card.** Zero schema change — `kind="word"` is already
plumbed (models, `/type-counts`, Voyage "type" filter). Execution = one
dedicated data session, out of scope for pivot lots A–F.

## Goal

Serve the "Sinan goes to Italy" persona: Voyage games filtered on
`kind=word` + a domain deal out basic Italian vocabulary cards; kept words
feed the collection and Révision like any expression.

## Word selection

- **~300 words: 12 travel domains × ~25 words**, anchored at CEFR A1–A2.
- Domains (reuse existing tag slugs wherever they exist — check the `tags`
  table first; create only the missing ones): food & restaurant · directions
  & transport · accommodation · market & shopping · body & health · weather ·
  numbers & time · greetings & politeness · family & people · house ·
  clothing · emotions.
- Pipeline: LLM drafts ~25 candidates per domain → each word is checked
  against a public Italian frequency list (e.g. OpenSubtitles/Wiktionary
  top 5,000); words outside it need manual approval. No invented or rare
  words — selection comes from established usage, LLM only fills fields.

## Field mapping

| Field | Content | Example |
|---|---|---|
| `id` | follow existing id convention; prefix `it-` if bare slugs collide cross-language | `it-pane` |
| `text` | the word — nouns **with article**, verbs in infinitive | « il pane » |
| `language` / `country` / `kind` / `register` | `it` / `it` / `word` / `standard` | |
| `literal_fr` | FR translation (the persona's core field) | « le pain » |
| `expression_content` (it) | `meaning` = simple IT definition · `example` = one A2 sentence, ≤ 12 words | « Un cestino di pane, per favore. » |
| `content_translations` (fr, en) | literal + translated example, same mechanics as idioms | |
| tags | ≥ 1 domain tag per word (drives Voyage domain filters) | `food` |
| `origin`, `concept_id`, `illustration` | empty in v1 (etymology = possible later enrichment, decided against for v1) | |

## Quality bar

- Generation via existing populate scripts pattern (Mistral free tier,
  `--mistral`), batched per domain.
- `scripts/validate_db.py` green; no duplicate `text` within `it` (words vs
  existing idioms/proverbs).
- Human QA: Sinan reviews a ~30-word sample (10 %) — he is learning Italian,
  ideal reviewer. Full native review not required at this risk level (basic
  vocabulary), unlike JA content.

## Later (recorded, not planned)

Other languages (TR is the natural next, same spec) · etymology in `origin` ·
mapping words to `concepts` for quiz distractors.

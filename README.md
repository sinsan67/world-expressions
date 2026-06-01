# World Expressions

**Every language has its own madness.**

A web app for exploring idiomatic expressions across languages and regions of the world — designed to be intuitive, navigable, fun, and a little bit surprising.

Live: [world-expressions.vercel.app](https://world-expressions.vercel.app)

---

## What it is

Language is more than grammar and vocabulary. Every culture has its own idioms — unexpected, poetic, absurd — that reveal how people actually think and speak.

World Expressions is a place to explore that. Search by word, browse by country, discover by concept, or let randomness guide you. Each expression comes with its meaning, origin, a usage example, and translations across languages.

Whether you're curious about other cultures, learning a new language, or just looking for something to laugh at — there's something here for you.

---

## Stack

- **Backend** — Python + FastAPI, PostgreSQL (Neon)
- **Frontend** — Next.js 16, TypeScript
- **Translations** — Mistral AI (batch generation)
- **Deployment** — Vercel (frontend) + Render (backend)

---

## Run locally

```bash
# Backend
python3 -m uvicorn main:app --reload

# Frontend
cd web && npm run dev
```

Requires a `.env.dev` with `DATABASE_URL` (PostgreSQL) and `web/.env.local` with `NEXT_PUBLIC_API_URL`.

---

## Contributing

New expressions, corrections, and new languages are welcome. Open an issue or a pull request.

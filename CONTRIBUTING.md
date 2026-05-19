# Contributing to World Expressions

## Local Setup

**1. Start the backend**
```bash
cd /path/to/expressions-du-monde
python3 -m uvicorn main:app --reload
```
API available at http://localhost:8000

**2. Open the frontend**
Open `frontend/index.html` directly in your browser (no server needed for V1).

---

## Git Workflow

### Daily flow
```bash
git pull                        # always pull before starting work
# ... make your changes ...
git add <file1> <file2>         # stage specific files (never git add -A blindly)
git commit -m "short description of what and why"
git push
```

### Branch naming (for future PRs)
```
feature/add-spanish-expressions
fix/search-accent-bug
design/v2-homepage-redesign
```

### Commit messages
- Start with a verb: `Add`, `Fix`, `Update`, `Remove`, `Refactor`
- Describe the *why*, not just the *what*
- Keep it under 72 characters
- Examples:
  - `Add 50 English expressions with language field`
  - `Fix country filter not resetting on new search`
  - `Update hero title to switch on language selection`

---

## GitHub Token Best Practices

- Always use a **classic token** with `repo` scope
- Set an **expiration date** (90 days recommended — no expiration is convenient but risky)
- **Never share your token** in a chat, email, or commit
- If a token is compromised: revoke it immediately at github.com/settings/tokens
- One token per machine (e.g. `mac-world-expressions`)

---

## Pull Requests (coming in V2)

When the team grows, we'll add a PR review process:
- No direct push to `main`
- All changes via feature branches + PR
- At least one review before merge
- CI checks before merging (linting, tests)

---

## Project Structure

```
expressions-du-monde/
├── main.py              # FastAPI backend
├── data/
│   └── expressions.json # 452 expressions (FR + EN)
├── frontend/
│   └── index.html       # Single-page frontend
└── scripts/             # Data enrichment scripts (Node.js)
```

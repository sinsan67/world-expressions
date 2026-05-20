#!/bin/bash
# generate-recap-pdf.sh
# Convertit RECAP.md en PDF, le sauvegarde sur le Bureau, archive RECAP.md, repart à zéro.
#
# Usage (depuis la racine du projet) :
#   ./scripts/generate-recap-pdf.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RECAP="$PROJECT_ROOT/RECAP.md"
ARCHIVE_DIR="$PROJECT_ROOT/recap-archive"
DATE=$(date +%Y-%m-%d)
DESKTOP="$HOME/Desktop"
OUTPUT="$DESKTOP/expressions-recap-$DATE.pdf"

# ─── Vérification ────────────────────────────────────────────────────────────

if [ ! -f "$RECAP" ]; then
  echo "Erreur : RECAP.md introuvable dans $PROJECT_ROOT"
  exit 1
fi

# ─── Installation md-to-pdf si absent ───────────────────────────────────────

if ! command -v md-to-pdf &> /dev/null; then
  if [ -f "$HOME/.npm-global/bin/md-to-pdf" ]; then
    export PATH="$HOME/.npm-global/bin:$PATH"
  else
    echo "Installation de md-to-pdf (première fois uniquement)..."
    npm install -g md-to-pdf --prefix ~/.npm-global
    export PATH="$HOME/.npm-global/bin:$PATH"
  fi
fi

# ─── Génération du PDF ───────────────────────────────────────────────────────

echo "Génération du PDF..."

# Crée un fichier de configuration CSS temporaire pour un rendu propre
CSS_TMP=$(mktemp /tmp/recap-style-XXXX.css)
cat > "$CSS_TMP" << 'ENDCSS'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.7;
  color: #1a1a2e;
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 48px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  color: #7c3aed;
  border-bottom: 2px solid #ede9fe;
  padding-bottom: 10px;
  margin-bottom: 6px;
}

h2 {
  font-size: 16px;
  font-weight: 600;
  color: #4c1d95;
  margin-top: 28px;
  margin-bottom: 6px;
}

h3 {
  font-size: 13px;
  font-weight: 600;
  color: #5b21b6;
  margin-top: 18px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

h4 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 14px;
  margin-bottom: 4px;
}

p { margin: 6px 0; }

strong { color: #1a1a2e; }

code {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 11.5px;
  background: #f5f3ff;
  color: #7c3aed;
  padding: 1px 5px;
  border-radius: 4px;
}

pre {
  background: #1e1b4b;
  color: #e0e7ff;
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 11px;
  overflow-x: auto;
}

pre code {
  background: none;
  color: inherit;
  padding: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 12px;
}

th {
  background: #f5f3ff;
  color: #5b21b6;
  font-weight: 600;
  padding: 7px 12px;
  text-align: left;
  border: 1px solid #ede9fe;
}

td {
  padding: 6px 12px;
  border: 1px solid #ede9fe;
}

tr:nth-child(even) td { background: #fafaf9; }

ul, ol { margin: 6px 0; padding-left: 22px; }
li { margin: 3px 0; }

hr {
  border: none;
  border-top: 1px solid #ede9fe;
  margin: 24px 0;
}

blockquote {
  border-left: 3px solid #7c3aed;
  padding: 4px 16px;
  margin: 10px 0;
  color: #6b7280;
  background: #faf9ff;
}

a { color: #7c3aed; text-decoration: none; }
ENDCSS

md-to-pdf "$RECAP" \
  --stylesheet "$CSS_TMP" \
  --highlight-style github \
  --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"15mm","right":"15mm"}}'

rm -f "$CSS_TMP"

# Déplace le PDF généré (RECAP.pdf) vers le Bureau
mv "$PROJECT_ROOT/RECAP.pdf" "$OUTPUT"

# ─── Archive + reset ─────────────────────────────────────────────────────────

mkdir -p "$ARCHIVE_DIR"
cp "$RECAP" "$ARCHIVE_DIR/$DATE.md"

cat > "$RECAP" << ENDRESET
# Expressions du Monde — Récap de session

**Projet :** [world-expressions](https://github.com/sinsan67/world-expressions)
**Stack :** FastAPI + PostgreSQL/Neon + Next.js 16

---

## Session du $(date '+%-d %B %Y')

_(en cours — mis à jour en temps réel)_

ENDRESET

# ─── Confirmation ────────────────────────────────────────────────────────────

echo ""
echo "PDF sauvegardé sur le Bureau : $OUTPUT"
echo "RECAP.md archivé dans       : $ARCHIVE_DIR/$DATE.md"
echo "RECAP.md réinitialisé pour la prochaine session."
echo ""

# Ouvre le PDF automatiquement
open "$OUTPUT"

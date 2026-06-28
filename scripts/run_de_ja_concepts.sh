#!/usr/bin/env bash
# Attribue des concepts aux expressions allemandes (DE) et japonaises (JA)
# via Claude (Anthropic). Utilise populate_concepts_claude.py.
#
# Chaque langue est traitée séquentiellement. Le script est idempotent :
# les expressions déjà liées à un concept sont ignorées.
#
# Usage :
#   ./scripts/run_de_ja_concepts.sh                      # base dev
#   ./scripts/run_de_ja_concepts.sh --prod               # base production
#   ./scripts/run_de_ja_concepts.sh --prod --limit 50    # test limité
#   ./scripts/run_de_ja_concepts.sh --prod >> /tmp/concepts_de_ja.log 2>&1 &

set -e
cd "$(dirname "$0")/.."

PROD_FLAG=""
LIMIT_FLAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)  PROD_FLAG="--prod"; shift ;;
    --limit) LIMIT_FLAG="--limit $2"; shift 2 ;;
    *)       shift ;;
  esac
done

run_lang() {
  local lang="$1"
  echo ""
  echo "================================================"
  echo "  Concepts Claude : source = $lang"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "================================================"
  python3 -u scripts/populate_concepts_claude.py --source "$lang" $LIMIT_FLAG $PROD_FLAG
}

run_lang de
run_lang ja

echo ""
echo "================================================"
echo "  Enrichissement concepts DE + JA terminé."
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

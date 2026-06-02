#!/usr/bin/env bash
# Attribue des concepts à toutes les expressions qui n'en ont pas encore,
# langue par langue. Appelle populate_concepts.py pour chaque langue.
#
# Le script est idempotent : les expressions déjà liées à un concept sont ignorées.
# Relancez-le librement si une exécution est interrompue.
#
# Usage :
#   ./scripts/run_all_concepts.sh            # toutes les langues
#   ./scripts/run_all_concepts.sh --prod     # base production
#   ./scripts/run_all_concepts.sh --limit 50  # limite par langue (pour tester)

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
  echo "  Concepts : source = $lang"
  echo "================================================"
  python3 scripts/populate_concepts.py --source "$lang" $LIMIT_FLAG $PROD_FLAG
}

# Ordre décroissant par volume (fr > en > es > it > tr)
run_lang fr
run_lang en
run_lang es
run_lang it
run_lang tr

echo ""
echo "================================================"
echo "  Enrichissement concepts terminé.
================================================"

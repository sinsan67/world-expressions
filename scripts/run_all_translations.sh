#!/usr/bin/env bash
# Lance la génération des traductions pour toutes les paires de langues.
# Matrice complète : fr / en / es / it / tr → chacune vers les 4 autres.
#
# Le script est idempotent : il saute les traductions déjà en base.
# Relancez-le librement si une exécution est interrompue.
#
# Usage :
#   ./scripts/run_all_translations.sh
#   ./scripts/run_all_translations.sh --prod
#   ./scripts/run_all_translations.sh --prod --delay 0.5

set -e
cd "$(dirname "$0")/.."

PROD_FLAG=""
DELAY_FLAG="--delay 0.3"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)  PROD_FLAG="--prod"; shift ;;
    --delay) DELAY_FLAG="--delay $2"; shift 2 ;;
    *)       shift ;;
  esac
done

run_pair() {
  local src="$1" tgt="$2"
  echo ""
  echo "================================================"
  echo "  $src → $tgt"
  echo "================================================"
  python3 scripts/populate_translations.py --source "$src" --target "$tgt" $DELAY_FLAG $PROD_FLAG
}

# Vers FR et EN (partiellement déjà faites)
run_pair fr en
run_pair fr es
run_pair en fr
run_pair en es
run_pair es fr
run_pair es en
run_pair it fr
run_pair it en
run_pair tr fr
run_pair tr en

# Vers IT et TR (entièrement manquantes)
run_pair fr it
run_pair fr tr
run_pair en it
run_pair en tr
run_pair es it
run_pair es tr
run_pair it es
run_pair it tr
run_pair tr es
run_pair tr it

# DE vers toutes les langues
run_pair de fr
run_pair de en
run_pair de es
run_pair de it
run_pair de tr

# Toutes les langues vers DE
run_pair fr de
run_pair en de
run_pair es de
run_pair it de
run_pair tr de

echo ""
echo "================================================"
echo "  Matrice complète terminée."
echo "================================================"

#!/usr/bin/env bash
# Lance la génération des traductions pour toutes les paires de langues manquantes.
#
# Paires couvertes (hors FR→EN déjà fait) :
#   FR→ES (399 restantes), EN→FR (499), EN→ES (499),
#   ES→FR (120), ES→EN (120),
#   IT→FR (40),  IT→EN (40),
#   TR→FR (38),  TR→EN (38)
#
# Usage :
#   ./scripts/run_all_translations.sh
#   ./scripts/run_all_translations.sh --delay 0.5   # plus lent, moins de risque rate-limit
#
# Le script est idempotent : relancez-le si une exécution est interrompue.

set -e
cd "$(dirname "$0")/.."  # se placer à la racine du projet

DELAY="${1:---delay}"; DELAY_VAL="${2:-0.3}"
# Support simple du flag --delay N passé en argument
if [[ "$1" == "--delay" ]]; then
  DELAY_FLAG="--delay $2"
else
  DELAY_FLAG="--delay 0.3"
fi

run_pair() {
  local src="$1" tgt="$2"
  echo ""
  echo "================================================"
  echo "  $src → $tgt"
  echo "================================================"
  python3 scripts/populate_translations.py --source "$src" --target "$tgt" $DELAY_FLAG
}

run_pair fr es
run_pair en fr
run_pair en es
run_pair es fr
run_pair es en
run_pair it fr
run_pair it en
run_pair tr fr
run_pair tr en

echo ""
echo "================================================"
echo "  Toutes les traductions sont terminées."
echo "================================================"

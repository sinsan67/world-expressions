#!/usr/bin/env bash
# Lance la génération des traductions pour toutes les paires de langues.
# Matrice complète : fr / en / es / it / tr → chacune vers les 4 autres.
#
# Le script est idempotent : il saute les traductions déjà en base.
# Relancez-le librement si une exécution est interrompue.
#
# Usage :
#   ./scripts/run_all_translations.sh
#   ./scripts/run_all_translations.sh --delay 0.5

set -e
cd "$(dirname "$0")/.."

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

echo ""
echo "================================================"
echo "  Matrice complète terminée."
echo "================================================"

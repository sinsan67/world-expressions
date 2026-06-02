#!/usr/bin/env bash
# Lance la chaîne complète d'enrichissement prod :
#   1. Traductions (matrice 20 paires, idempotent)
#   2. Concepts (5 langues, idempotent)
#
# Usage :
#   ./scripts/run_prod_enrich.sh
#   ./scripts/run_prod_enrich.sh >> /tmp/prod_enrich.log 2>&1
#
# Pour surveiller en live :
#   tail -f /tmp/prod_enrich.log

set -e
cd "$(dirname "$0")/.."

START=$(date "+%Y-%m-%d %H:%M:%S")
echo "=========================================="
echo "  Enrichissement prod démarré : $START"
echo "=========================================="

echo ""
echo ">>> ÉTAPE 1/2 : Traductions (matrice complète)"
./scripts/run_all_translations.sh --prod

echo ""
echo ">>> ÉTAPE 2/2 : Concepts (toutes langues)"
./scripts/run_all_concepts.sh --prod

END=$(date "+%Y-%m-%d %H:%M:%S")
echo ""
echo "=========================================="
echo "  Enrichissement prod terminé : $END"
echo "=========================================="

#!/bin/bash
# Enrichissement IT + TR en arrière-plan — cible 500 expressions par langue.
# Script idempotent : relancez librement en cas d'interruption.
#
# Usage :
#   # DB prod :
#   nohup env DATABASE_URL="postgresql://neondb_owner:npg_LmZEu8Jv4hrk@ep-dawn-smoke-aly41brd-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
#     ./scripts/run_enrichment_it_tr.sh > /tmp/enrichment_it_tr.log 2>&1 &
#
#   # Suivi en direct :
#   tail -f /tmp/enrichment_it_tr.log

set -e
cd "$(dirname "$0")/.."

BATCH_SIZE=5
DELAY=1.0
IT_TARGET=500
TR_TARGET=500

echo "============================================"
echo "  Enrichissement IT — cible ${IT_TARGET} expressions"
echo "  $(date)"
echo "============================================"
python3 scripts/generate_expressions.py \
    --language it \
    --count "${IT_TARGET}" \
    --batch-size "${BATCH_SIZE}" \
    --delay "${DELAY}"

echo ""
echo "============================================"
echo "  Enrichissement TR — cible ${TR_TARGET} expressions"
echo "  $(date)"
echo "============================================"
python3 scripts/generate_expressions.py \
    --language tr \
    --count "${TR_TARGET}" \
    --batch-size "${BATCH_SIZE}" \
    --delay "${DELAY}"

echo ""
echo "============================================"
echo "  Enrichissement IT + TR terminé — $(date)"
echo "============================================"

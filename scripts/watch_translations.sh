#!/bin/bash
# Surveille tous les scripts de traduction en arrière-plan.
# Usage: ./scripts/watch_translations.sh
# Appuyer sur Ctrl+C pour arrêter.

REFRESH=15  # secondes entre chaque refresh

DB_PROD=$(grep DATABASE_URL .env.prod | cut -d= -f2-)

print_header() {
  tput clear 2>/dev/null || clear
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║    TRADUCTIONS EN COURS — $(date '+%H:%M:%S')                       ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
}

print_processes() {
  echo "━━━ PROCESSUS ACTIFS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  local found=0
  while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    time=$(echo "$line" | awk '{print $9}')
    args=$(echo "$line" | grep -o '\-\-source [a-z]* --target [a-z]*' || echo "$line" | grep -o 'translate_proverbs.*--prod')
    if [ -n "$args" ]; then
      printf "  PID %-7s  %s  %s\n" "$pid" "$time" "$args"
      found=1
    fi
  done < <(ps aux | grep -E "populate_translations|translate_proverbs" | grep -v grep)
  [ "$found" -eq 0 ] && echo "  (aucun script actif)"
  echo ""
}

print_db_counts() {
  echo "━━━ CONTENT_TRANSLATIONS PROD (paires JA + gaps) ━━━━━━━━━━━━"
  python3 - <<PYEOF
import os
os.environ['DATABASE_URL'] = '$DB_PROD'
from sqlalchemy import create_engine, text
engine = create_engine('$DB_PROD')
try:
    with engine.connect() as conn:
        r = conn.execute(text("""
            SELECT e.language || '→' || ct.target_lang AS pair,
                   COUNT(*) AS cnt,
                   (SELECT COUNT(*) FROM expressions WHERE language=e.language) AS total
            FROM content_translations ct
            JOIN expressions e ON ct.expression_id=e.id
            WHERE e.language='ja' OR ct.target_lang='ja'
               OR (e.language='de' AND ct.target_lang='tr')
               OR (e.language='it' AND ct.target_lang='ja')
            GROUP BY e.language, ct.target_lang
            ORDER BY e.language, ct.target_lang
        """))
        rows = list(r)
        for row in rows:
            pct = int(100 * row[1] / row[2]) if row[2] > 0 else 0
            bar = '█' * (pct // 5) + '░' * (20 - pct // 5)
            print(f"  {row[0]:<10}  {bar}  {row[1]:>5}/{row[2]:<5} ({pct:>3}%)")
except Exception as e:
    print(f"  Erreur DB: {e}")
PYEOF
  echo ""
}

print_logs() {
  echo "━━━ DERNIÈRES LIGNES DE LOG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  declare -A LOGS=(
    ["ja→fr"]="/tmp/ja_fr_translations.log"
    ["ja→en"]="/tmp/ja_en_translations.log"
    ["ja→es"]="/tmp/ja_es_translations.log"
    ["de→ja"]="/tmp/de_ja_translations.log"
    ["tr→ja"]="/tmp/tr_ja_translations.log"
    ["proverbs"]="/tmp/translate_proverbs_all.log"
  )
  for label in "ja→fr" "ja→en" "ja→es" "de→ja" "tr→ja" "proverbs"; do
    logfile="${LOGS[$label]}"
    if [ -f "$logfile" ]; then
      last=$(tail -1 "$logfile" 2>/dev/null | sed 's/^[[:space:]]*//')
      printf "  %-10s  %s\n" "$label" "$last"
    fi
  done
  echo ""
  echo "  Refresh dans ${REFRESH}s — Ctrl+C pour quitter"
}

# Boucle principale
while true; do
  print_header
  print_processes
  print_db_counts
  print_logs
  sleep $REFRESH
done

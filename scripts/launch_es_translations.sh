#!/usr/bin/env bash
# Traduit toutes les expressions espagnoles vers les 6 autres langues de l'interface.
# Lance 6 scripts en arrière-plan, un par langue cible.
# Logs dans /tmp/es_to_XX_translations.log
# Usage : ./scripts/launch_es_translations.sh
# Arrêt : kill $(cat /tmp/es_translations.pids)

set -euo pipefail

SCRIPT="scripts/populate_translations.py"
PIDS=()

for target in fr en de it ja tr; do
    log="/tmp/es_to_${target}_translations.log"
    echo "Lancement es → ${target} (log: ${log})"
    nohup python3 "$SCRIPT" --source es --target "$target" --prod > "$log" 2>&1 &
    PIDS+=($!)
done

printf "%s\n" "${PIDS[@]}" > /tmp/es_translations.pids
echo ""
echo "PIDs enregistrés dans /tmp/es_translations.pids"
echo ""
echo "Surveiller en live :"
echo "  tail -f /tmp/es_to_fr_translations.log /tmp/es_to_en_translations.log /tmp/es_to_de_translations.log /tmp/es_to_it_translations.log /tmp/es_to_ja_translations.log /tmp/es_to_tr_translations.log"
echo ""
echo "Arrêter tous les scripts :"
echo "  kill \$(cat /tmp/es_translations.pids)"

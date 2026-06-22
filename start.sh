#!/bin/bash
# start.sh — Lance le backend et le frontend en une seule commande
# Usage : ./start.sh
# Arrêt  : Ctrl+C (arrête les deux processus proprement)

PROJECT="$HOME/Projets/expressions-du-monde"

echo ""
echo "=== Expressions du Monde ==="
echo "Backend  → http://localhost:8000"
echo "Frontend → http://localhost:3000"
echo "Ctrl+C pour tout arrêter"
echo ""

# Garde le schéma local aligné avec le code avant de lancer l'API.
# Sans ça, une DB dev un peu en retard peut casser /search ou /facets.
(cd "$PROJECT" && alembic upgrade head && python3 -m uvicorn main:app --reload) &
BACKEND_PID=$!

# Lance le frontend Next.js dans un sous-shell
(cd "$PROJECT/web" && npm run dev) &
FRONTEND_PID=$!

# Ouvre le navigateur automatiquement après 4 secondes
sleep 4 && open http://localhost:3000 &

# Ctrl+C = arrêt propre des deux processus
trap "echo ''; echo 'Arrêt en cours...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Arrêté.'; exit 0" INT TERM

# Reste actif et attend les deux processus
wait $BACKEND_PID $FRONTEND_PID

---
titre: QA Review - Session 4
date: 2026-07-21
tags: [qa, bug-review, app-web]
statut: à traiter avec Claude Code
---

# 🧪 QA Review — Session 4

## 🔴 Bugs

- [ ] **[Ma collection — Compteurs incohérents]** 🔴 **Critique** — En haut à droite de la page "Ma collection" : l'icône ❤️ affiche **17**, alors que le texte en dessous indique **23 expressions**. Les deux chiffres sont incohérents.
  > Demande : identifier l'origine de l'écart entre les deux compteurs (expliquer ce qui se passe), puis proposer une solution de correction. Problème jugé important car l'utilisateur est perdu face à cette incohérence.

## 💡 Améliorations

- [ ] **[Ma collection — Filtres]** Interface des filtres jugée "triste" / peu soignée. Les icônes utilisées pour ces boutons ne reprennent pas celles déjà utilisées ailleurs dans l'app pour les mêmes actions — manque de cohérence visuelle.
  > ⚠️ **Point de coordination important** : un atelier utilisateur est prévu pour retravailler les filtres du jeu "Voyage" (au moment de la composition du voyage). Les choix faits sur les filtres de "Ma collection" doivent rester cohérents avec les décisions qui seront prises lors de cet atelier — ne pas trancher ce point isolément. Mettre à jour l'ordre du jour de l'atelier pour y intégrer explicitement cet objectif de cohérence entre les deux écrans de filtres.

- [ ] **[Ma collection — Affichage "18-18 sur 2437"]** Un autre chiffrage affiché sur le même screenshot n'est pas compréhensible pour l'utilisateur : "18-18 sur 2437".
  > Demande : expliquer d'abord ce que représente cet affichage (pagination ? plage d'IDs ? rang ?), avant de proposer une correction. Doit être rendu clair pour l'utilisateur.

## 📋 Pour la revue avec Claude Code

- [ ] Repartir de ce fichier comme base de la revue.
- [ ] Diagnostiquer l'origine de l'écart entre les deux compteurs avant de corriger.
- [ ] Expliquer la logique derrière l'affichage "18-18 sur 2437" avant toute correction.

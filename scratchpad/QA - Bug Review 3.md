---
titre: QA Review - Session 3
date: 2026-07-21
tags: [qa, bug-review, app-web]
statut: à traiter avec Claude Code
---

# 🧪 QA Review — Session 3

## 🔴 Bugs

- [ ] **[Voyage — Audio]** 🔴 **Critique** — En mode "Voyage", en composant un voyage (ex : Italie + proverbe + un domaine), la première expression affichée ne peut de nouveau pas être écoutée. Signalé à plusieurs reprises par l'utilisateur, priorité absolue.
  > Correction demandée : ajouter l'icône 🔊 haut-parleur dans la fiche, comme celle déjà présente sur la fiche détail d'une expression (clic sur le détail → écoute de l'audio dans la langue de l'expression). Cette fonctionnalité audio doit être présente partout dans le jeu.

- [ ] **[Voyage — Compose your journey / mobile PWA]** Sur mobile (PWA), écran Voyage → « Compose your journey » déplié → section COUNTRY n'affiche que la tuile « All countries », aucun pays individuel en dessous. Capture d'écran fournie en session (S218). Root cause non investiguée — hypothèses à vérifier : bug CSS/overflow, fetch qui échoue silencieusement, régression du retry cold-start `getCountries()` (S204).

## 💡 Améliorations

- [ ] **[Fin de jeu — Récap "Belle pioche"]** La page récap affichée en fin de jeu (expressions gardées par l'utilisateur, ex : 6 dans ce test) contient trop de détails dans la langue de l'interface. Simplifier le contenu par expression à seulement deux lignes :
  1. La traduction littérale de l'expression
  2. Le sens de l'expression
  > Aller à la ligne entre les deux pour bien les distinguer visuellement. Rien d'autre à afficher.

- [ ] **[Fin de jeu — Boutons du bas]** Sur la même page récap, les 3 boutons en bas de page ont chacun un titre sur trois lignes — fonctionnalité jugée excellente, mais présentation à revoir entièrement.
  > Demande : préparer **3 mockups alternatifs**. Contraintes : au moins un emoji par bouton, et une distinction intuitive claire selon l'intention de chaque action — ex. « voir mon carnet » / « changer les filtres » doivent évoquer une continuité/un retour en arrière dans le jeu, tandis que « voir mes favoris » doit évoquer le fait de sortir du jeu pour faire autre chose. L'utilisateur doit ressentir cette différence.

- [ ] **[Ma connexion — Toggle Découverte/Maîtrisée]** L'utilité du toggle « Découverte » / « Maîtrisée » n'est pas comprise. En cliquant sur l'une ou l'autre option, les mêmes expressions semblent s'afficher — le sens et l'effet de ce toggle ne sont pas clairs.

- [ ] **[Récap multi-sessions — Favoris]** Pas de moyen intuitif de faire un récapitulatif global de tous ses favoris à travers plusieurs sessions jouées (cas testé : 3 sessions jouées, envie de retrouver l'ensemble des favoris accumulés). Besoin non couvert actuellement.
  > Demande : imaginer des pistes de solution pour ce besoin, sous forme de maquettes statiques / wireframes.

## 📋 Pour la revue avec Claude Code

- [ ] Repartir de ce fichier comme base de la revue.
- [ ] Traiter ce bug audio en priorité absolue (récurrent sur plusieurs sessions QA).

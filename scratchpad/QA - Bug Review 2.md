---
titre: QA Review - Session 2
date: 2026-07-16
tags: [qa, bug-review, app-web, pwa-android]
statut: à traiter avec Claude Code
testeur: Sinan Serdaroglu
contexte: Utilisation en conditions réelles (PWA Android)
---

# 🧪 QA Review — Session 2

## 🔴 Bugs

- [ ] **[Urgent]** **[Cold start / Pays]** Après installation en PWA sur Android, les pays ne s'affichent pas dans le jeu — probablement lié au cold start.
  > 💡 Piste de mitigation en attendant le fix : afficher un message temporaire rassurant du type « T'inquiète pas, tout va bien, il suffit que tu passes un peu de temps et ça va venir. »
- [ ] **[Moyenne]** **[Publicité]** Une publicité Pinterest s'affiche de manière inattendue et non sollicitée pendant l'utilisation normale de l'app. Origine à investiguer.
- [ ] **[Urgent]** **[Session / PWA Android]** La session en cours est perdue si l'utilisateur bascule vers une autre app (ex. WhatsApp) puis revient — il est redirigé vers l'écran des filtres au lieu de retrouver son écran. Jugé **inacceptable** par le testeur.
- [ ] **[Moyenne]** **[Fin de session]** Un écran blanc s'affiche sans aucun message ni interaction quand la session se termine sans qu'aucune expression n'ait été mise en favori.
- [ ] **[Urgent]** **[Navigation Android]** Le bouton retour natif Android, utilisé depuis la section filtre, redirige vers la home page au lieu de revenir à l'écran précédent (la section filtre elle-même). Les boutons natifs Android doivent être traités en priorité dans la logique de navigation.
- [ ] **[Moyenne]** **[Responsive / PWA Android — testé sur Samsung Galaxy S23]** Les labels "Mode Découverte" et "Maîtrisée" ne tiennent pas sur une seule ligne dans le parcours collection, créant un décalage visuel. À rendre responsive et tester sur plusieurs modèles de téléphones.

## 🟡 Améliorations

- [ ] **[Haute]** **[Navigation globale]** Revoir en profondeur la navigation et la cohérence visuelle entre les pages — parcours jugé peu intuitif, utilisateur "perdu". Pistes mentionnées :
  - Ne pas hésiter à archiver/supprimer d'anciennes pages devenues obsolètes.
  - Idée : lancer le jeu directement depuis les pages Atlas et Concept plutôt que depuis un écran de recherche par carte séparé.
  - Se débarrasser de l'écran de recherche par carte, sauf si un bouton dédié y mène spécifiquement.
  > 🛠️ Organiser un **atelier UX** dédié pour retravailler ce point avant implémentation.
- [ ] **[Urgent]** **[Fiches / Accessibilité]** Absence de bouton audio (icône haut-parleur pour écouter la prononciation) et de transcription phonétique sur les fiches d'expression — jugée fonctionnalité critique pour l'apprentissage et l'accessibilité. Phonétique à afficher dans la langue de l'interface (FR/EN/TR).
- [ ] **[Moyenne]** **[Page filtres]** Refonte ergonomique de la page des filtres — esthétique et intuitivité jugées insuffisantes, manque de cohérence avec les futurs jeux/associations à venir. Des mock-ups sont à proposer lors d'une prochaine session avant implémentation.
- [ ] **[Moyenne]** **[Thèmes / PWA Android]** Ajouter des émojis à chaque thème dans la liste de filtrage par thème (actuellement affichée sans émojis) — à investiguer si c'est une limitation technique ou un oubli.
- [ ] **[Moyenne]** **[Filtres]** Ajouter un filtre par pays dans la section filtre, pour faciliter la sélection quand l'utilisateur a des expressions dans plusieurs pays — trouver une solution qui évite de faire perdre du temps à l'utilisateur pour ce choix.

## 🟢 Idées / Roadmap

*(Rien de nouveau identifié dans cette session — voir le fichier Session 1 pour les idées déjà en cours.)*

## 📋 Pour la revue avec Claude Code

- [ ] Repartir de ce fichier comme base de la revue de la Session 2.
- [ ] Traiter en priorité les 3 points **Urgent** côté bugs (cold start pays, perte de session au retour d'app, bouton retour Android) et le point **Urgent** côté amélioration (bouton audio + phonétique).
- [ ] Planifier l'atelier UX navigation avant de trancher l'implémentation du point 0.
- [ ] Prioriser bugs > améliorations > roadmap, comme pour la Session 1.

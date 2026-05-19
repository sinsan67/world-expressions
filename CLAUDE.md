# Projet — Webapp Expressions du Monde

## Objectif
Créer une application web ludique, intuitive et visuelle autour des expressions idiomatiques internationales : exploration et jeu.

## État
V1 fonctionnelle en local (backend FastAPI + frontend HTML/CSS/JS). Phase de test et itération.

## Vision produit
Un site web (futur PWA) où l'utilisateur tape un mot et découvre des expressions françaises qui y sont liées — soit parce qu'elles contiennent ce mot, soit parce qu'elles s'en rapprochent par le sens. Affichage sexy et informatif des résultats.

## Décisions prises

### Périmètre V1
- Expressions **françaises uniquement**
- Page d'accueil : barre de recherche + illustration
- Résultats : liste d'expressions avec fiche détaillée

### Fiche d'une expression (V1)
- Signification
- Origine
- Exemple d'utilisation en phrase
- (V2+) Équivalent dans d'autres langues

### Recherche
- Par mot exact contenu dans l'expression
- Par sens proche (ex : taper "énerver" trouve "casser les pieds")
- Distinguer visuellement les deux types de résultats

### Données
- Base de ~500-1000 expressions françaises courantes
- Constituée avec Claude à partir de sources publiques
- Format V1 : fichier JSON structuré

### Stack technique (décidée)
- **Backend** : Python + FastAPI
- **Base de données** : JSON (V1) → SQLite → PostgreSQL
- **Frontend** : HTML/CSS + JavaScript
- **PWA** : ajouté en V2

### Déploiement
- V1 en local
- V2 : déploiement sur Internet

## Principes directeurs UX

### Navigabilité (principe central)
L'utilisateur doit pouvoir naviguer librement entre les concepts en cliquant sur des liens — pas seulement chercher. Concrètement :
- Chaque expression a sa propre URL (ex: `/expression/casser-les-pieds`)
- Chaque tag est cliquable → liste des expressions avec ce tag
- Chaque registre est cliquable → navigation par niveau de langue
- Les expressions doivent se relier entre elles (expressions proches, même famille...)

Ce principe oriente l'architecture : il faut un **routeur** côté frontend (navigation sans rechargement de page) dès la V2.

### Design V2
Référence : [ethereum.org](https://ethereum.org) — clarté, illustrations, couleurs pastel.

**Logique visuelle par type de page :**
- Fiches d'expression (pages simples) → **emojis** : légers, textuels, contextuels, pas besoin de fichier image
- Pages d'exploration (tags, thèmes, accueil) → **illustrations SVG** : riches, designées, une par thème

## Historique des versions

### V1 (en cours — local)
- Backend FastAPI + 122 expressions JSON
- Frontend page unique : recherche + cartes résultats
- Recherche exacte + sémantique
- Tags cliquables

### V2 (à venir)
- Routeur frontend (pages par expression, par tag)
- Refonte visuelle inspirée d'ethereum.org (pastel, illustrations SVG)
- PWA

### V3/V4 (vision long terme)

**Carte de France interactive**
- Enrichir la base de données avec l'origine régionale de chaque expression
- Source retenue : **TLFi (Trésor de la Langue Française informatisé)** — CNRS + Université de Lorraine
- Piste : les contacter pour un partenariat (projet pédagogique et culturel, institution publique)
- Page "Carte" : SVG de France avec régions cliquables
- Cliquer sur une région → liste des expressions qui y sont nées ou liées
- Champ `region` déjà présent dans le JSON (null pour l'instant)

**Illustration par expression**
- Une illustration SVG unique pour chaque expression
- Mode de génération à définir : génération IA (Midjourney/DALL-E → vectorisation) ou SVG natif
- Le champ `illustration` est déjà prévu dans la structure JSON pour accueillir l'URL ou le code SVG
- Transforme chaque fiche en véritable carte visuelle

## Contexte
Projet personnel de Sinan, première application web. Approche pédagogique privilégiée. Ambition de faire évoluer le produit version après version.

#!/usr/bin/env python3
"""
Génère data/constellation_graph.json — Jeu 3 "Constellation de proverbes"
(docs/game3-constellation-lot0-contract.md §2).

Sélectionne les tags portés par >=3 langues et >=10 proverbes (kind='proverb'),
calcule un layout hiérarchique déterministe à 3 niveaux — groupe thématique
(DOMAIN_TO_GROUP, via concept_domains) -> sous-grappe géométrique -> nœud
individuel, pur Python sans dépendance (S240) — + des arêtes (2 plus proches
voisins au sein d'une même sous-grappe), embarque les labels localisés
(tag_names, 7 langues) et écrit un artefact JSON statique versionné dans le
repo — pas de calcul serveur à la volée (contract §2).

Usage:
    python3 scripts/build_constellation_graph.py            # DB dev
    python3 scripts/build_constellation_graph.py --prod      # DB prod
    python3 scripts/build_constellation_graph.py --dry-run   # stats seulement, pas d'écriture
    python3 scripts/build_constellation_graph.py --top 60    # cap optionnel, désactivé par défaut
"""
import sys
import json
import math
import random
import hashlib
import argparse
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent.parent))

# Résolution --prod avant import de dotenv/config (config dépend du .env chargé
# à l'import — même ordre obligatoire que scripts/populate_concept_domains.py).
import argparse as _argparse_early
_early = _argparse_early.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / _env_file)

from sqlalchemy import text
from config import engine

UI_LOCALES = ["fr", "en", "es", "it", "tr", "de", "ja"]

# Tags méta (pas des thèmes) — même set que database.py:120 META_TAGS, dupliqué
# ici pour ne pas tirer tout database.py dans un script one-shot.
META_TAGS = {"australian", "british", "slang", "proverb", "communication"}

# Doublons manuels détectés (contract §0 — "tags équivalents en richesse, préférer
# le plus lisible") : slugs quasi-synonymes, on garde le plus riche des deux.
EXCLUDED_TAGS = {"moral", "emotion"}

# Emoji par slug — miroir manuel de web/lib/tagIcons.ts (TS non importable
# depuis un script Python). 75/151 tags candidats (DB dev) reprennent
# directement une entrée existante de TAG_ICONS ; les 76 restants sont une
# curation manuelle légère pour cette session (contract §0 l'autorise
# explicitement). Le script échoue bruyamment si un tag candidat n'a pas
# d'emoji plutôt que d'en livrer un vide.
TAG_EMOJI: dict[str, str] = {
    # --- repris tel quel de web/lib/tagIcons.ts (clé anglaise directe) ---
    "wisdom": "🦉", "patience": "🕐", "nature": "🌿", "humility": "🙏",
    "trust": "🫱", "family": "👨‍👩‍👧", "responsibility": "🎯", "health": "💊",
    "time": "⏰", "justice": "⚖️", "friendship": "🤝", "fate": "🎲",
    "learning": "📚", "poverty": "💰", "love": "❤️", "effort": "💪",
    "work": "💼", "wealth": "💰", "youth": "🌸", "pride": "👑",
    "consequences": "⚖️", "loyalty": "💙", "opportunity": "🚪", "luck": "🍀",
    "perseverance": "🏃", "betrayal": "🗡️", "caution": "⚠️", "faith": "🙏",
    "relationships": "👥", "acceptance": "🤗", "food": "🍽️", "travel": "✈️",
    "resilience": "🔄", "character": "😎", "silence": "🤫", "truth": "✅",
    "tradition": "🏺", "old-age": "👴", "laziness": "😴", "animals": "🐾",
    "success": "🏆", "action": "⚡", "marriage": "💒", "risk": "⚠️",
    "body": "🫀", "destiny": "⭐", "nostalgia": "🕰️", "hope": "🌱",
    "weather": "🌦️", "courage": "🦁", "culture": "🌍", "optimism": "🌟",
    "generosity": "🎁", "honesty": "🫡", "emotions": "🎭", "respect": "🫡",
    "money": "💰", "home": "🏠", "behavior": "🧠", "greed": "🤑",
    "happiness": "😄", "strength": "💪", "conflict": "⚔️", "change": "🦋",
    "joy": "😄", "arrogance": "😤", "failure": "❌", "ambition": "🚀",
    "age": "⏳", "support": "🤲", "experience": "📖", "foolishness": "🤪",
    "power": "👑", "regret": "😔", "hardship": "⛰️", "unity": "🤝",
    "resignation": "🤷",
    # --- curation manuelle légère (76 tags sans entrée directe dans tagIcons.ts) ---
    "morality": "🧭", "community": "🏘️", "seasons": "🍂", "aging": "👵",
    "education": "🎓", "agriculture": "🌾", "parenthood": "👶", "exile": "🧳",
    "hunger": "🍚", "solidarity": "🤲", "knowledge": "🧠", "vanity": "💅",
    "gratitude": "💐", "ignorance": "🙈", "identity": "🪪", "injustice": "🚫",
    "homeland": "🏞️", "parenting": "🍼", "survival": "🏕️", "belonging": "🫂",
    "religion": "🛐", "healing": "🩹", "abundance": "🌻", "balance": "☯️",
    "prudence": "🧐", "preparation": "🎒", "reciprocity": "↔️", "growth": "📈",
    "reward": "🏅", "karma": "☸️", "timing": "⏱️", "contentment": "😌",
    "inequality": "📊", "value": "💎", "spirituality": "🕉️", "listening": "👂",
    "persistence": "🐢", "prevention": "🛡️", "maturity": "🧓", "integrity": "🪨",
    "cooperation": "👐", "discipline": "📏", "judgment": "⚖️", "equality": "🟰",
    "heartbreak": "💔", "fairness": "🎚️", "reflection": "🧘", "productivity": "⚙️",
    "practicality": "🔧", "planning": "🗓️", "decision-making": "🔀", "adaptability": "🦎",
    "teamwork": "🚣", "influence": "🧲", "memory": "📸", "virtue": "😇",
    "observation": "🔭", "law": "🔨", "diligence": "🐝", "self-awareness": "🔍",
    "dignity": "🎩", "simplicity": "🍃", "human-nature": "🧬", "beauty": "🌹",
    "uncertainty": "❓", "passion": "💘", "moderation": "🎛️", "stability": "⚓",
    "words": "📝", "compassion": "💗", "authority": "👮", "charity": "🥫",
    "appreciation": "🙌", "empathy": "🫶",
    # --- ajoutés S242, tags DB prod entrant dans le top 150 par n_proverbes ---
    "advice": "💡", "fear": "😨", "deception": "🃏", "folly": "🤡",
    "humor": "😂", "hospitality": "🛎️", "frugality": "🪙", "ethics": "🧭",
    "homesickness": "🏡", "rural-life": "🚜", "freedom": "🕊️", "perception": "👁️",
    "transience": "🌬️", "inevitability": "⏳", "criticism": "🗯️", "cunning": "🦊",
    "irony": "🙃", "hypocrisy": "🎭", "metaphor": "🖼️",
}

# Layout hiérarchique (S240) — groupe thématique (niveau 1) auquel rattacher
# chaque tag via son premier domaine (concept_domains), fallback "misc" pour
# les tags sans domaine mappé ici. Porté tel quel depuis le prototype S238/239
# (scripts/_prototype_clustered_layout.py, supprimé après intégration).
DOMAIN_TO_GROUP = {
    "wisdom": "wisdom-knowledge", "knowledge": "wisdom-knowledge",
    "time": "time-change", "change": "time-change",
    "morality": "morality-justice", "justice": "morality-justice",
    "speech": "speech-conflict", "humor": "speech-conflict", "conflict": "speech-conflict",
    "relations": "pleasure-love", "pleasure": "pleasure-love", "food": "pleasure-love",
    "work": "effort-ambition", "ambition": "effort-ambition",
    "money": "money-luck", "luck": "money-luck",
    "body": "body-nature", "nature": "body-nature",
    "emotions": "emotions", "travel": "travel",
}
# Rattachement manuel des tags sans entrée dans concept_domains (jamais atteints par
# DOMAIN_TO_GROUP, qui retombe sur le fourre-tout "misc") — validé avec Sinan (QA Review 6,
# S243) pour que les 10 groupes du jeu couvrent 100% des candidats, "travel" inclus (0 nœud
# jusqu'ici). Prioritaire sur DOMAIN_TO_GROUP : même si l'un de ces tags obtient un jour un
# domaine via une repopulation Mistral (populate_concept_domains.py), ce choix éditorial doit
# rester stable plutôt que de dériver silencieusement au run suivant.
TAG_GROUP_OVERRIDE = {
    "abundance": "money-luck", "adaptability": "time-change",
    "injustice": "morality-justice", "exile": "travel",
    "beauty": "pleasure-love", "homeland": "travel",
    "words": "speech-conflict", "community": "pleasure-love",
    "heartbreak": "pleasure-love", "parenting": "pleasure-love",
    "seasons": "body-nature", "parenthood": "pleasure-love",
    "inequality": "morality-justice", "listening": "speech-conflict",
    "reciprocity": "morality-justice", "discipline": "effort-ambition",
    "folly": "speech-conflict", "cooperation": "pleasure-love",
}
TARGET_SUBCLUSTER_SIZE = 6
SPLIT_THRESHOLD = 8  # groupes <= ce seuil : pas de sous-grappe (niveau 2 = niveau 3)


def fetch_candidate_tags(min_langs: int = 3, min_proverbs: int = 10) -> list[dict]:
    sql = """
        SELECT t.id, t.slug, COUNT(DISTINCT e.language) AS n_langs, COUNT(*) AS n_proverbs
        FROM tags t
        JOIN expression_tags et ON et.tag_id = t.id
        JOIN expressions e ON e.id = et.expression_id
        WHERE e.kind = 'proverb'
        GROUP BY t.id, t.slug
        HAVING COUNT(DISTINCT e.language) >= :min_langs AND COUNT(*) >= :min_proverbs
        ORDER BY n_proverbs DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"min_langs": min_langs, "min_proverbs": min_proverbs}).fetchall()
    return [{"id": r.id, "slug": r.slug} for r in rows]


def fetch_labels(tag_ids: list[str]) -> dict[str, dict[str, str]]:
    """slug -> {locale: name}. Même forme LEFT JOIN tag_names / COALESCE-to-slug
    que database.get_top_tags / get_concepts."""
    if not tag_ids:
        return {}
    sql = """
        SELECT t.slug, tn.locale, tn.name
        FROM tags t LEFT JOIN tag_names tn ON tn.tag_id = t.id
        WHERE t.id = ANY(:ids)
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"ids": tag_ids}).fetchall()
    labels: dict[str, dict[str, str]] = {}
    for r in rows:
        labels.setdefault(r.slug, {})
        if r.locale:
            labels[r.slug][r.locale] = r.name
    return labels


def fetch_tag_domains(tag_ids: list[str]) -> dict[str, list[str]]:
    """slug -> [domain_slug, ...] (0-2 domaines par tag, populés via Mistral —
    voir populate_concept_domains.py). ORDER BY cd.domain_slug pour que
    domains[0] soit reproductible d'un run à l'autre pour les tags multi-
    domaines (sans ce tri, l'ordre de retour de Postgres n'est pas garanti et
    le groupe assigné à ces tags varierait d'un run à l'autre)."""
    if not tag_ids:
        return {}
    sql = """
        SELECT t.slug, cd.domain_slug
        FROM tags t JOIN concept_domains cd ON cd.tag_id = t.id
        WHERE t.id = ANY(:ids)
        ORDER BY cd.domain_slug
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"ids": tag_ids}).fetchall()
    domains: dict[str, list[str]] = {}
    for r in rows:
        domains.setdefault(r.slug, []).append(r.domain_slug)
    return domains


def nearest_neighbor_edges(
    positions: list[tuple[float, float]],
    k: int = 2,
    groups: list | None = None,
) -> list[list[int]]:
    """Même logique que le wireframe : 2 plus proches voisins, dédupliqué.
    Purement visuel (effet constellation), aucune signification sémantique.

    `groups` (optionnel, même longueur que `positions`) restreint la recherche
    de voisins aux nœuds partageant la même valeur de groupe — utilisé par le
    layout hiérarchique (S240) pour ne tracer des arêtes qu'au sein d'une même
    sous-grappe `(group, sub_id)`, au lieu de dupliquer cette logique dans une
    fonction séparée. Sans `groups` : comportement inchangé (k plus proches
    voisins sur l'ensemble des positions)."""
    n = len(positions)
    edges = set()
    for i in range(n):
        pool = [
            j for j in range(n)
            if j != i and (groups is None or groups[j] == groups[i])
        ]
        order = sorted(
            pool,
            key=lambda j: math.hypot(positions[i][0] - positions[j][0], positions[i][1] - positions[j][1]),
        )
        for j in order[:k]:
            edges.add((min(i, j), max(i, j)))
    return [list(e) for e in edges]


def stable_seed(*parts) -> int:
    """Seed déterministe entre process à partir d'un nom de groupe/sous-grappe.
    hash() natif sur des str est randomisé par process (PYTHONHASHSEED non fixé
    par défaut) — MD5 sur la représentation str() est stable, condition
    nécessaire pour que le layout hiérarchique reste reproductible d'un run à
    l'autre (docstring du module : "Sans dépendance, déterministe")."""
    key = "|".join(str(p) for p in parts)
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2**32)


def repulsion_center_layout(
    n: int, width: float, height: float, center_coef: float, seed: int, iterations: int = 300
) -> list[tuple[float, float]]:
    """Force-directed générique (répulsion O(n²) + rappel centre + refroidissement
    linéaire) paramétré par la taille de canvas, le coefficient de rappel et la
    seed — réutilisable à toute échelle (groupe, sous-grappe, membres) pour le
    layout hiérarchique à 3 niveaux (S240). Remplace l'ancien force_directed_layout()
    (single-level, supprimé S241 — plus appelé depuis l'intégration du clustering)."""
    if n == 0:
        return []
    if n == 1:
        return [(width / 2, height / 2)]
    rng = random.Random(seed)
    cx, cy = width / 2, height / 2
    pos = [[rng.uniform(0, width), rng.uniform(0, height)] for _ in range(n)]
    k = math.sqrt(width * height / n)
    for it in range(iterations):
        step = 1.0 - it / iterations
        disp = [[0.0, 0.0] for _ in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                dx, dy = pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]
                dist = math.hypot(dx, dy) or 0.01
                force = (k * k) / dist
                fx, fy = dx / dist * force, dy / dist * force
                disp[i][0] += fx
                disp[i][1] += fy
                disp[j][0] -= fx
                disp[j][1] -= fy
        # Centering pull must be ~O(k), not a small fixed fraction of distance —
        # too weak and it's dwarfed by the O(n) aggregate repulsion any node
        # near the boundary receives from every other node, so nothing pulls
        # nodes back off the walls once they reach them and they pile up along
        # the 4 edges. Every call site here passes center_coef=8.0 — keeps
        # nodes off the boundary while preserving an even, non-overlapping
        # spread (tuned empirically, verified at n=151 with an empty-interior
        # regression before the fix).
        for i in range(n):
            disp[i][0] += (cx - pos[i][0]) * center_coef
            disp[i][1] += (cy - pos[i][1]) * center_coef
        max_disp = k * 0.5 * step + 0.1
        for i in range(n):
            dlen = math.hypot(*disp[i]) or 0.01
            capped = min(dlen, max_disp)
            pos[i][0] = min(max(pos[i][0] + disp[i][0] / dlen * capped, 20), width - 20)
            pos[i][1] = min(max(pos[i][1] + disp[i][1] / dlen * capped, 20), height - 20)
    return [(x, y) for x, y in pos]


def layout_members(members: list, span_fn, seed: int) -> tuple[list[tuple[float, float]], float]:
    """Force-directed local centré sur (0,0) — span (taille de canvas local)
    dépend du nombre de membres via span_fn."""
    m = len(members)
    span = span_fn(m)
    raw = repulsion_center_layout(m, span, span, center_coef=8.0, seed=seed, iterations=250)
    return [(x - span / 2, y - span / 2) for x, y in raw], span


def hierarchical_layout(
    candidates: list[dict], tag_domains: dict[str, list[str]]
) -> tuple[list[dict], list[tuple[float, float]], list[str], list[tuple[str, int]]]:
    """Layout 3 niveaux : groupe thématique (DOMAIN_TO_GROUP, fallback "misc")
    -> sous-grappe géométrique (~TARGET_SUBCLUSTER_SIZE nœuds, seulement si le
    groupe dépasse SPLIT_THRESHOLD membres — pur partitionnement spatial sans
    nouvelle donnée) -> nœud individuel. Porté depuis le prototype S238/S239
    (scripts/_prototype_clustered_layout.py, supprimé après intégration), avec
    2 corrections : seeds déterministes entre process (stable_seed, pas hash()
    natif) et canvas de niveau 1 proportionné à len(candidates) au lieu d'une
    constante fixe (pour que --top N reste sain à petite échelle).

    Retourne les candidats réordonnés (groupés par groupe/sous-grappe — l'ordre
    de `candidates` n'est PAS préservé, il n'a pas de sens produit) alignés
    avec positions/groupes/clés de sous-grappe — cette dernière liste est faite
    pour nearest_neighbor_edges(..., groups=...) afin de ne tracer des arêtes
    qu'au sein d'une même sous-grappe."""
    n_total = len(candidates)
    groups: dict[str, list[dict]] = defaultdict(list)
    for c in candidates:
        if c["slug"] in TAG_GROUP_OVERRIDE:
            group = TAG_GROUP_OVERRIDE[c["slug"]]
        else:
            doms = tag_domains.get(c["slug"], [])
            group = DOMAIN_TO_GROUP.get(doms[0], "misc") if doms else "misc"
        groups[group].append(c)

    group_slugs = sorted(groups, key=lambda g: -len(groups[g]))

    # Niveau 1 : centres des groupes. Canvas proportionnel à len(candidates)
    # (scale = sqrt(n/référence), même technique que l'ancien single-level
    # force_directed_layout), avec comme référence n=151 (taille type du jeu
    # complet de candidats, écart discuté contract §0) -> 3600x2300 (tunées
    # empiriquement au prototype) : évite un canvas surdimensionné et des
    # groupes épars quand --top réduit fortement n.
    outer_scale = math.sqrt(max(n_total, 1) / 151)
    outer_w, outer_h = 3600 * outer_scale, 2300 * outer_scale
    group_centers = repulsion_center_layout(
        len(group_slugs), outer_w, outer_h, center_coef=8.0, seed=1, iterations=400
    )

    ordered_candidates: list[dict] = []
    positions: list[tuple[float, float]] = []
    node_groups: list[str] = []
    subcluster_keys: list[tuple[str, int]] = []

    for group, (gx, gy) in zip(group_slugs, group_centers):
        members = groups[group]
        m = len(members)

        if m <= SPLIT_THRESHOLD:
            # Pas de niveau 2 : un seul amas pour tout le groupe.
            local, _ = layout_members(members, lambda mm: 130 + 55 * math.sqrt(mm), seed=stable_seed(group))
            for c, (lx, ly) in zip(members, local):
                ordered_candidates.append(c)
                positions.append((gx + lx, gy + ly))
                node_groups.append(group)
                subcluster_keys.append((group, 0))
            continue

        # Niveau 2 : sous-grappes géométriques (~TARGET_SUBCLUSTER_SIZE nœuds).
        # Découpage arbitraire (aucune similarité sémantique entre tags d'un
        # même domaine dans les données actuelles) — pur chunking visuel.
        n_sub = max(2, round(m / TARGET_SUBCLUSTER_SIZE))
        rng = random.Random(stable_seed(group, "shuffle"))
        shuffled = members[:]
        rng.shuffle(shuffled)
        sub_members = [s for s in (shuffled[i::n_sub] for i in range(n_sub)) if s]

        group_span = 260 + 210 * math.sqrt(len(sub_members))
        sub_centers = repulsion_center_layout(
            len(sub_members), group_span, group_span, center_coef=8.0,
            seed=stable_seed(group, "subcenters"), iterations=300,
        )
        sub_centers = [(x - group_span / 2, y - group_span / 2) for x, y in sub_centers]

        for sub_id, (sub, (scx, scy)) in enumerate(zip(sub_members, sub_centers)):
            local, _ = layout_members(sub, lambda mm: 120 + 50 * math.sqrt(mm), seed=stable_seed(group, sub_id))
            for c, (lx, ly) in zip(sub, local):
                ordered_candidates.append(c)
                positions.append((gx + scx + lx, gy + scy + ly))
                node_groups.append(group)
                subcluster_keys.append((group, sub_id))

    # Normalise dans le cadre positif (mêmes marges que le prototype).
    min_x = min(x for x, _ in positions)
    min_y = min(y for _, y in positions)
    positions = [(round(x - min_x + 60, 1), round(y - min_y + 60, 1)) for x, y in positions]

    return ordered_candidates, positions, node_groups, subcluster_keys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prod", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--top", type=int, default=None)
    args = parser.parse_args()

    candidates = [
        c for c in fetch_candidate_tags()
        if c["slug"] not in EXCLUDED_TAGS and c["slug"] not in META_TAGS
    ]
    print(
        f"{len(candidates)} tags candidats (>=3 langues, >=10 proverbes) — "
        f"référence dev citée au contrat S234 était 44, voir "
        f"docs/game3-constellation-lot0-contract.md §0 (écart discuté et validé avec Sinan, S235)"
    )

    if args.top:
        candidates = candidates[: args.top]
        print(f"--top {args.top} appliqué -> {len(candidates)} nœuds")

    # Vérifié seulement sur les candidats retenus après --top (S242) : un tag
    # capé hors sélection n'a pas besoin d'emoji, inutile de bloquer dessus.
    missing = [c["slug"] for c in candidates if c["slug"] not in TAG_EMOJI]
    if missing:
        print(f"ERREUR : {len(missing)} tags sans entrée TAG_EMOJI : {missing}")
        sys.exit(1)

    labels = fetch_labels([c["id"] for c in candidates])
    tag_domains = fetch_tag_domains([c["id"] for c in candidates])
    ordered_candidates, positions, node_groups, subcluster_keys = hierarchical_layout(candidates, tag_domains)
    edges = nearest_neighbor_edges(positions, groups=subcluster_keys)

    nodes = [
        {
            "tag": c["slug"],
            "emoji": TAG_EMOJI[c["slug"]],
            "labels": {loc: labels.get(c["slug"], {}).get(loc) or c["slug"] for loc in UI_LOCALES},
            "x": x,
            "y": y,
            "group": group,
        }
        for c, (x, y), group in zip(ordered_candidates, positions, node_groups)
    ]
    graph = {"locales": UI_LOCALES, "nodes": nodes, "edges": edges}

    if args.dry_run:
        print(json.dumps(graph, ensure_ascii=False)[:400], "...")
        return

    out = Path(__file__).parent.parent / "data" / "constellation_graph.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {out} — {len(nodes)} nœuds, {len(edges)} arêtes")


if __name__ == "__main__":
    main()

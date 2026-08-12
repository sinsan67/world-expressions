#!/usr/bin/env python3
"""
Génère data/constellation_graph.json — Jeu 3 "Constellation de proverbes"
(docs/game3-constellation-lot0-contract.md §2).

Sélectionne les tags portés par >=3 langues et >=10 proverbes (kind='proverb'),
calcule un layout déterministe (force-directed, pur Python) + des arêtes
(2 plus proches voisins), embarque les labels localisés (tag_names, 7 langues)
et écrit un artefact JSON statique versionné dans le repo — pas de calcul
serveur à la volée (contract §2).

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
import argparse
from pathlib import Path

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
}


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


def force_directed_layout(n: int, seed: int = 42, iterations: int = 500) -> list[tuple[float, float]]:
    """Sans dépendance, déterministe. Répulsion O(n²) entre tous les nœuds
    (n≈150-250 -> quelques dizaines de milliers de paires, trivial) + légère
    attraction vers le centre, refroidissement linéaire. Canvas mis à l'échelle
    pour garder une densité ~constante par rapport à la référence du wireframe
    (1600x1000 pour 41 nœuds)."""
    rng = random.Random(seed)
    scale = math.sqrt(n / 41)
    width, height = 1600 * scale, 1000 * scale
    cx, cy = width / 2, height / 2
    pos = [[rng.uniform(0, width), rng.uniform(0, height)] for _ in range(n)]
    k = math.sqrt(width * height / max(n, 1))

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
        for i in range(n):
            disp[i][0] += (cx - pos[i][0]) * 0.01
            disp[i][1] += (cy - pos[i][1]) * 0.01
        max_disp = k * 0.5 * step + 0.1
        for i in range(n):
            dlen = math.hypot(*disp[i]) or 0.01
            capped = min(dlen, max_disp)
            pos[i][0] = min(max(pos[i][0] + disp[i][0] / dlen * capped, 40), width - 40)
            pos[i][1] = min(max(pos[i][1] + disp[i][1] / dlen * capped, 40), height - 40)
    return [(round(x, 1), round(y, 1)) for x, y in pos]


def nearest_neighbor_edges(positions: list[tuple[float, float]], k: int = 2) -> list[list[int]]:
    """Même logique que le wireframe : 2 plus proches voisins, dédupliqué.
    Purement visuel (effet constellation), aucune signification sémantique."""
    n = len(positions)
    edges = set()
    for i in range(n):
        order = sorted(
            (j for j in range(n) if j != i),
            key=lambda j: math.hypot(positions[i][0] - positions[j][0], positions[i][1] - positions[j][1]),
        )
        for j in order[:k]:
            edges.add((min(i, j), max(i, j)))
    return [list(e) for e in edges]


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

    missing = [c["slug"] for c in candidates if c["slug"] not in TAG_EMOJI]
    if missing:
        print(f"ERREUR : {len(missing)} tags sans entrée TAG_EMOJI : {missing}")
        sys.exit(1)

    if args.top:
        candidates = candidates[: args.top]
        print(f"--top {args.top} appliqué -> {len(candidates)} nœuds")

    labels = fetch_labels([c["id"] for c in candidates])
    positions = force_directed_layout(len(candidates))
    edges = nearest_neighbor_edges(positions)

    nodes = [
        {
            "tag": c["slug"],
            "emoji": TAG_EMOJI[c["slug"]],
            "labels": {loc: labels.get(c["slug"], {}).get(loc) or c["slug"] for loc in UI_LOCALES},
            "x": x,
            "y": y,
        }
        for c, (x, y) in zip(candidates, positions)
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

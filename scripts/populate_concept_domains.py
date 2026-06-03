#!/usr/bin/env python3
"""
Assigne chaque tag thématique (≥5 expressions) à 1-2 domaines parmi 13.
Résultat stocké dans la table concept_domains.

Idempotent : saute les tags déjà assignés à au moins un domaine.

Usage :
    python3 scripts/populate_concept_domains.py --dry-run        # aperçu sans écriture
    python3 scripts/populate_concept_domains.py                   # run sur DB dev
    python3 scripts/populate_concept_domains.py --prod            # run sur DB prod
    python3 scripts/populate_concept_domains.py --prod --limit 50 # 50 tags max (test)
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Résolution --prod avant import de dotenv (config dépend du .env chargé)
import argparse as _argparse_early
_early = _argparse_early.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from sqlalchemy import text
from config import engine

MODEL = "mistral-small-latest"

# 13 domaines thématiques : slug → description courte (pour le prompt Mistral)
DOMAINS = {
    "emotions":  "joy, fear, shame, jealousy, nostalgia, sadness, anger, love, hope",
    "relations": "love, friendship, betrayal, family, solitude, loyalty, conflict, marriage",
    "money":     "wealth, poverty, ambition, greed, debt, generosity, commerce",
    "wisdom":    "intelligence, lies, memory, illusion, truth, knowledge, foolishness",
    "speech":    "silence, secret, rumor, eloquence, gossip, persuasion, argument",
    "morality":  "justice, freedom, honor, courage, duty, sin, pride, humility",
    "nature":    "animals, the human body, water, fire, food, plants, weather, earth",
    "time":      "death, old age, chance, regret, past, future, waiting, transience",
    "work":      "perseverance, laziness, success, fatigue, effort, failure, skill",
    "humor":     "irony, paradox, exaggeration, absurdity, mockery, wit",
    "pleasure":  "alcohol, gluttony, lust, indulgence, leisure, sensuality",
    "travel":    "departure, return, strangeness, exile, migration, adventure, home",
    "luck":      "chance, bet, destiny, deception, risk, fortune, superstition",
    "knowledge": "learning, curiosity, education, research, discovery, understanding, science",
    "justice":   "law, rights, equality, revenge, punishment, fairness, order, authority",
    "conflict":  "war, rivalry, dispute, competition, aggression, violence, power struggle",
    "ambition":  "glory, conquest, leadership, power, social status, vanity, pride",
    "body":      "health, illness, senses, physical appearance, aging, strength, beauty",
    "change":    "transformation, revolution, beginning, ending, transition, adaptation, cycles",
    "food":      "cooking, taste, hunger, feast, nourishment, appetite, drink",
}

DOMAIN_LIST = list(DOMAINS.keys())

# Même liste que database.META_TAGS — ne pas assigner ces tags à un domaine
META_TAGS = {"australian", "british", "slang", "proverb", "communication"}


def build_prompt(tag_name: str, tag_slug: str, sample_exprs: list[str]) -> str:
    domain_lines = "\n".join(
        f"  - {slug}: {desc}"
        for slug, desc in DOMAINS.items()
    )
    samples_str = " | ".join(f'"{e}"' for e in sample_exprs[:5])
    return (
        f'The concept "{tag_name}" (slug: {tag_slug}) groups expressions like: {samples_str}\n\n'
        f"Assign it to 1 or 2 thematic domains from this list:\n{domain_lines}\n\n"
        'Return ONLY a valid JSON array of 1-2 domain slugs, e.g. ["emotions"] or ["emotions","relations"]. '
        "No explanation, no markdown."
    )


def call_mistral(client: Mistral, prompt: str, max_retries: int = 3) -> list[str] | None:
    """Appelle Mistral avec retry exponentiel sur erreur 429."""
    for attempt in range(max_retries):
        try:
            resp = client.chat.complete(
                model=MODEL,
                max_tokens=40,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = resp.choices[0].message.content.strip()
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                return None
            valid = [d for d in parsed if d in DOMAIN_LIST]
            return valid[:2] if valid else None
        except Exception as e:
            msg = str(e)
            if "429" in msg and attempt < max_retries - 1:
                wait = 4 * (2 ** attempt)  # 4s, 8s, 16s
                print(f"  Rate limit — retry dans {wait}s ({attempt+1}/{max_retries})")
                time.sleep(wait)
            else:
                print(f"  Mistral error: {e}")
                return None
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prod",    action="store_true", help="DB production (.env.prod)")
    parser.add_argument("--dry-run", action="store_true", help="Affiche sans écrire en DB")
    parser.add_argument("--limit",   type=int, default=0, help="Limiter à N tags (0 = tous)")
    parser.add_argument("--min-count", type=int, default=5, help="Nb expressions min par tag (défaut: 5)")
    args = parser.parse_args()

    # 1. Récupérer les tags éligibles (≥ min_count expressions, non encore assignés)
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                t.id   AS tag_id,
                t.slug AS tag_slug,
                COALESCE(tn_fr.name, tn_en.name, t.slug) AS tag_name,
                COUNT(et.expression_id) AS expr_count
            FROM tags t
            JOIN expression_tags et ON et.tag_id = t.id
            LEFT JOIN tag_names tn_fr ON tn_fr.tag_id = t.id AND tn_fr.locale = 'fr'
            LEFT JOIN tag_names tn_en ON tn_en.tag_id = t.id AND tn_en.locale = 'en'
            WHERE NOT EXISTS (
                SELECT 1 FROM concept_domains cd WHERE cd.tag_id = t.id
            )
              AND NOT (t.slug = ANY(:meta_tags))
            GROUP BY t.id, t.slug, tn_fr.name, tn_en.name
            HAVING COUNT(et.expression_id) >= :min_count
            ORDER BY expr_count DESC
        """), {"min_count": args.min_count, "meta_tags": list(META_TAGS)}).fetchall()

        # Exemples d'expressions par tag (pour enrichir le prompt)
        sample_map: dict[str, list[str]] = {}
        for row in rows:
            samples = conn.execute(text("""
                SELECT e.text FROM expressions e
                JOIN expression_tags et ON et.expression_id = e.id
                WHERE et.tag_id = :tid
                ORDER BY RANDOM()
                LIMIT 5
            """), {"tid": row.tag_id}).fetchall()
            sample_map[row.tag_id] = [s.text for s in samples]

    total = len(rows)
    if args.limit:
        rows = rows[:args.limit]
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Tags à assigner : {len(rows)} / {total} éligibles")

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    inserted = 0
    errors = 0

    for i, row in enumerate(rows, 1):
        prompt = build_prompt(row.tag_name, row.tag_slug, sample_map.get(row.tag_id, []))
        domains = call_mistral(client, prompt)

        if domains:
            if not args.dry_run:
                # Écriture immédiate → résistant aux interruptions (script idempotent)
                with engine.begin() as conn:
                    for domain_slug in domains:
                        conn.execute(text("""
                            INSERT INTO concept_domains (tag_id, domain_slug)
                            VALUES (:tag_id, :domain_slug)
                            ON CONFLICT DO NOTHING
                        """), {"tag_id": row.tag_id, "domain_slug": domain_slug})
                        inserted += 1
            print(f"  [{i}/{len(rows)}] {row.tag_name} ({row.expr_count} exprs) → {domains}")
        else:
            errors += 1
            print(f"  [{i}/{len(rows)}] {row.tag_name} → ERREUR (ignoré)")

        if i % 20 == 0:
            print(f"  — {i}/{len(rows)} traités, {errors} erreurs, {inserted} insertions")
        time.sleep(1.5)  # ~0.7 req/s pour éviter le rate limit Mistral

    if args.dry_run:
        print(f"\n(dry-run — aucune écriture en base)")
    else:
        print(f"\nTerminé : {inserted} lignes insérées, {errors} erreurs")


if __name__ == "__main__":
    main()

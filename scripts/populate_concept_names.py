#!/usr/bin/env python3
"""
Remplit concepts.name_fr depuis le texte de l'expression française liée.

Stratégie (sans --mistral-fallback) :
1. Expression FR liée au concept via concept_id → meilleur cas, zéro API.
2. Toute expression liée, quelle que soit la langue → fallback lisible.
3. Deslugifie le slug → dernier recours si aucune expression en DB.

Avec --mistral-fallback :
  Les concepts sans expression FR liée sont traités par Mistral : à partir
  du slug, il génère le nom français propre (accents, apostrophes, casse).
  Cible les ~16 cas où le fallback "any" donnerait un texte en ES ou EN.

Idempotent : saute les concepts qui ont déjà un name_fr.

Usage :
    python3 scripts/populate_concept_names.py --dry-run
    python3 scripts/populate_concept_names.py
    python3 scripts/populate_concept_names.py --mistral-fallback
    python3 scripts/populate_concept_names.py --mistral-fallback --dry-run
"""

import sys
import os
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import text
from config import engine


def deslugify(slug: str) -> str:
    return slug.replace("-", " ").capitalize()


def mistral_name_fr(client, slug: str, any_text: str | None) -> str | None:
    """Demande à Mistral le nom FR propre pour un concept identifié par son slug."""
    hint = f' (un équivalent connu : "{any_text}")' if any_text else ""
    prompt = (
        f'Le slug de concept "{slug}" correspond à une expression idiomatique.'
        f'{hint}\n'
        "Donne UNIQUEMENT le texte de l'expression française correspondante, "
        "avec accents et apostrophes corrects, sans explication ni ponctuation autour."
    )
    try:
        resp = client.chat.complete(
            model="mistral-small-latest",
            max_tokens=60,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content.strip().strip('"').strip("'")
    except Exception as e:
        print(f"  Mistral error pour [{slug}]: {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Affiche les mises à jour sans écrire en DB")
    parser.add_argument("--mistral-fallback", action="store_true",
                        help="Utilise Mistral pour les concepts sans expression FR liée (~16 cas)")
    args = parser.parse_args()

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                c.id,
                c.slug,
                (
                    SELECT e.text
                    FROM expressions e
                    WHERE e.concept_id = c.id AND e.language = 'fr'
                    ORDER BY e.concept_confidence DESC NULLS LAST
                    LIMIT 1
                ) AS fr_text,
                (
                    SELECT e.text
                    FROM expressions e
                    WHERE e.concept_id = c.id
                    ORDER BY e.concept_confidence DESC NULLS LAST
                    LIMIT 1
                ) AS any_text
            FROM concepts c
            WHERE c.name_fr IS NULL
            ORDER BY c.slug
        """)).fetchall()

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Concepts sans name_fr : {len(rows)}")

    client = None
    if args.mistral_fallback:
        from mistralai.client import Mistral
        client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    from_fr, from_mistral, from_any, from_slug = 0, 0, 0, 0
    updates = []

    for row in rows:
        if row.fr_text:
            name_fr = row.fr_text
            from_fr += 1
        elif args.mistral_fallback:
            name_fr = mistral_name_fr(client, row.slug, row.any_text)
            if name_fr:
                from_mistral += 1
                if args.dry_run:
                    print(f"  MISTRAL [{row.slug}] → {name_fr!r}")
            else:
                name_fr = row.any_text or deslugify(row.slug)
                from_any += 1
                if args.dry_run:
                    print(f"  FALLBACK [{row.slug}] → {name_fr!r}")
            time.sleep(0.3)
        elif row.any_text:
            name_fr = row.any_text
            from_any += 1
            if args.dry_run:
                print(f"  FALLBACK any  [{row.slug}] → {name_fr!r}")
        else:
            name_fr = deslugify(row.slug)
            from_slug += 1
            if args.dry_run:
                print(f"  FALLBACK slug [{row.slug}] → {name_fr!r}")
        updates.append({"id": row.id, "name_fr": name_fr})

    print(f"\nSource expression FR  : {from_fr}")
    if args.mistral_fallback:
        print(f"Source Mistral        : {from_mistral}")
    print(f"Source autre langue   : {from_any}")
    print(f"Source slug (fallback): {from_slug}")

    if not args.dry_run:
        with engine.begin() as conn:
            for u in updates:
                conn.execute(
                    text("UPDATE concepts SET name_fr = :name_fr WHERE id = :id"),
                    u
                )
        print(f"\nMis à jour : {len(updates)} concepts")
    else:
        print("\n(dry-run — aucune écriture en base)")
        print("\nExemples :")
        for row in rows[:10]:
            name = row.fr_text if row.fr_text else (row.any_text or deslugify(row.slug))
            source = "DB" if row.fr_text else "fallback"
            print(f"  [{source}] {row.slug} → {name!r}")


if __name__ == "__main__":
    main()

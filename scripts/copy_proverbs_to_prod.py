#!/usr/bin/env python3
"""
Copie tous les proverbes (kind='proverb') de la DB dev vers la DB prod.

Tables copiées :
  - expressions         (les proverbes eux-mêmes)
  - expression_content  (sens, origine, exemple en langue native)
  - tags                (nouveaux tags créés pour les proverbes)
  - expression_tags     (liens expression ↔ tag)
  - content_translations (traductions générées par translate_proverbs.py, si présentes)

Idempotent : ON CONFLICT DO NOTHING sur toutes les insertions.
Relancez librement — aucun doublon ne sera créé.

Usage :
    python3 scripts/copy_proverbs_to_prod.py
    python3 scripts/copy_proverbs_to_prod.py --dry-run   # aperçu sans écriture
    python3 scripts/copy_proverbs_to_prod.py --language fr  # une seule langue
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import dotenv_values
from sqlalchemy import create_engine, text

ROOT = Path(__file__).parent.parent

# On charge les deux fichiers .env séparément (sans polluer os.environ)
dev_env = dotenv_values(ROOT / ".env.dev")
prod_env = dotenv_values(ROOT / ".env.prod")

SRC_URL = dev_env.get("DATABASE_URL")
DST_URL = prod_env.get("DATABASE_URL")

if not SRC_URL or not DST_URL:
    print("ERROR: DATABASE_URL manquante dans .env.dev ou .env.prod")
    sys.exit(1)


def copy_proverbs(language_filter: str | None = None, dry_run: bool = False) -> None:
    src = create_engine(SRC_URL)
    dst = create_engine(DST_URL)

    lang_clause = "AND language = :lang" if language_filter else ""
    lang_params = {"lang": language_filter} if language_filter else {}

    with src.connect() as s, dst.begin() as d:

        # 0. Concepts référencés par les proverbes (FK obligatoire avant expressions)
        # Les UUIDs peuvent différer entre dev et prod pour le même slug —
        # on construit un mapping dev_uuid → prod_uuid par slug.
        concept_rows = s.execute(
            text(f"SELECT DISTINCT c.id, c.slug, c.name_fr FROM concepts c JOIN expressions e ON e.concept_id = c.id WHERE e.kind = 'proverb' {lang_clause}"),
            lang_params,
        ).fetchall()

        # Mapping dev UUID → prod UUID (résout les conflits de slug)
        dev_to_prod_concept: dict = {}

        if concept_rows:
            inserted_concepts = skipped_concepts = 0
            for r in concept_rows:
                if dry_run:
                    dev_to_prod_concept[r.id] = r.id
                    continue
                # Vérifier si le slug existe déjà en prod (UUID potentiellement différent)
                existing = d.execute(
                    text("SELECT id FROM concepts WHERE slug = :slug"),
                    {"slug": r.slug},
                ).fetchone()
                if existing:
                    dev_to_prod_concept[r.id] = existing.id
                    skipped_concepts += 1
                else:
                    d.execute(
                        text("INSERT INTO concepts (id, slug, name_fr) VALUES (:id, :slug, :name_fr)"),
                        dict(r._mapping),
                    )
                    dev_to_prod_concept[r.id] = r.id
                    inserted_concepts += 1
            if not dry_run:
                print(f"  → concepts : {inserted_concepts} insérés, {skipped_concepts} déjà présents (mapping UUID ajusté)")
            else:
                print(f"  → [DRY-RUN] concepts : {len(concept_rows)} à traiter")

        # 1. Proverbes (expressions)
        rows = s.execute(
            text(f"SELECT id, text, language, region, register, illustration, concept_id, kind, source, literal_fr, concept_confidence, rationale FROM expressions WHERE kind = 'proverb' {lang_clause}"),
            lang_params,
        ).fetchall()

        print(f"Proverbes trouvés en source : {len(rows)}")
        if not rows:
            print("Rien à copier.")
            return

        expr_ids = [r.id for r in rows]

        if not dry_run:
            for r in rows:
                data = dict(r._mapping)
                # Remplacer le concept_id dev par l'UUID correspondant en prod
                if data.get("concept_id") and data["concept_id"] in dev_to_prod_concept:
                    data["concept_id"] = dev_to_prod_concept[data["concept_id"]]
                d.execute(
                    text("""
                        INSERT INTO expressions (id, text, language, region, register, illustration, concept_id, kind, source, literal_fr, concept_confidence, rationale)
                        VALUES (:id, :text, :language, :region, :register, :illustration, :concept_id, :kind, :source, :literal_fr, :concept_confidence, :rationale)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data,
                )
        print(f"  → {'[DRY-RUN] ' if dry_run else ''}expressions : {len(rows)} proverbes")

        # 2. expression_content
        placeholders = ", ".join(f"'{eid}'" for eid in expr_ids)
        content_rows = s.execute(
            text(f"SELECT expression_id, locale, meaning, origin, example FROM expression_content WHERE expression_id IN ({placeholders})")
        ).fetchall()

        if not dry_run:
            for r in content_rows:
                d.execute(
                    text("""
                        INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
                        VALUES (:expression_id, :locale, :meaning, :origin, :example)
                        ON CONFLICT (expression_id, locale) DO NOTHING
                    """),
                    dict(r._mapping),
                )
        print(f"  → {'[DRY-RUN] ' if dry_run else ''}expression_content : {len(content_rows)} lignes")

        # 3. expression_tags (et tags associés)
        etag_rows = s.execute(
            text(f"SELECT expression_id, tag_id FROM expression_tags WHERE expression_id IN ({placeholders})")
        ).fetchall()

        if etag_rows:
            tag_ids = list({r.tag_id for r in etag_rows})
            tag_placeholders = ", ".join(f"'{t}'" for t in tag_ids)
            tag_rows = s.execute(
                text(f"SELECT id, slug FROM tags WHERE id IN ({tag_placeholders})")
            ).fetchall()

            if not dry_run:
                for r in tag_rows:
                    d.execute(
                        text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT (id) DO NOTHING"),
                        dict(r._mapping),
                    )
                for r in etag_rows:
                    d.execute(
                        text("INSERT INTO expression_tags (expression_id, tag_id) VALUES (:expression_id, :tag_id) ON CONFLICT DO NOTHING"),
                        dict(r._mapping),
                    )
            print(f"  → {'[DRY-RUN] ' if dry_run else ''}tags : {len(tag_rows)} | expression_tags : {len(etag_rows)}")

        # 4. content_translations (traductions si generate ou translate a déjà tourné)
        trans_rows = s.execute(
            text(f"SELECT expression_id, target_lang, meaning, literal, idiomatic, origin, example FROM content_translations WHERE expression_id IN ({placeholders})")
        ).fetchall()

        if trans_rows:
            if not dry_run:
                for r in trans_rows:
                    d.execute(
                        text("""
                            INSERT INTO content_translations (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
                            VALUES (:expression_id, :target_lang, :meaning, :literal, :idiomatic, :origin, :example)
                            ON CONFLICT (expression_id, target_lang) DO NOTHING
                        """),
                        dict(r._mapping),
                    )
            print(f"  → {'[DRY-RUN] ' if dry_run else ''}content_translations : {len(trans_rows)} lignes")
        else:
            print(f"  → content_translations : aucune (translate_proverbs.py n'a pas encore tourné)")

    print("\nCopie terminée." if not dry_run else "\nDRY-RUN terminé — aucune écriture effectuée.")


def main():
    parser = argparse.ArgumentParser(description="Copie les proverbes de dev vers prod")
    parser.add_argument("--dry-run", action="store_true", help="Affiche ce qui serait copié sans écrire")
    parser.add_argument("--language", help="Copier uniquement une langue (fr, en, es, it, tr, de)")
    args = parser.parse_args()

    if args.dry_run:
        print("DRY-RUN MODE — aucune écriture\n")

    lang_display = f" ({args.language})" if args.language else " (toutes langues)"
    src_hint = SRC_URL.split("@")[-1].split("/")[0] if "@" in SRC_URL else "dev"
    dst_hint = DST_URL.split("@")[-1].split("/")[0] if "@" in DST_URL else "prod"
    print(f"Source : {src_hint}")
    print(f"Cible  : {dst_hint}")
    print(f"Filtre : proverbes{lang_display}\n")

    copy_proverbs(language_filter=args.language, dry_run=args.dry_run)


if __name__ == "__main__":
    main()

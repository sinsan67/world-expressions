"""
Migration JSON → PostgreSQL (tables normalisées)

Ce script lit data/expressions.json et insère toutes les expressions
dans les 5 tables du nouveau schéma :
  - expressions      : l'expression dans sa langue d'origine
  - expression_content : le contenu traduit (meaning, origin, example)
  - tags             : tags normalisés (id = slug anglais/universel)
  - tag_names        : nom du tag par langue
  - expression_tags  : jointure many-to-many

À lancer une seule fois (idempotent : ignore les doublons).
"""

import json
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Chemin vers la racine du projet (un niveau au-dessus de scripts/)
ROOT = Path(__file__).parent.parent

# Charger l'URL depuis la variable d'environnement
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERREUR : variable DATABASE_URL manquante.")
    print("Exemple : DATABASE_URL='postgresql://...' python3 scripts/migrate_json_to_postgres.py")
    sys.exit(1)

# Connexion à la base
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Charger les expressions depuis le JSON
with open(ROOT / "data" / "expressions.json", encoding="utf-8") as f:
    expressions = json.load(f)

print(f"Chargement de {len(expressions)} expressions depuis expressions.json...")

# Compteurs pour le rapport final
inserted_expressions = 0
inserted_contents = 0
inserted_tags = 0
skipped = 0

# Dictionnaire pour mémoriser les tags déjà insérés (évite les doublons)
# clé = slug du tag, valeur = id
tags_inserted: dict[str, str] = {}

for expr in expressions:
    expr_id = expr["id"]
    language = expr.get("language", "fr")
    region = expr.get("region", "fr")

    # --- 1. Insérer dans `expressions` (si pas déjà présent) ---
    existing = session.execute(
        text("SELECT id FROM expressions WHERE id = :id"),
        {"id": expr_id}
    ).fetchone()

    if existing:
        skipped += 1
        continue

    session.execute(
        text("""
            INSERT INTO expressions (id, text, language, region, register, illustration, concept_id)
            VALUES (:id, :text, :language, :region, :register, :illustration, NULL)
        """),
        {
            "id": expr_id,
            "text": expr["expression"],
            "language": language,
            "region": region,
            "register": expr.get("register", "informal"),
            "illustration": expr.get("illustration"),
        }
    )
    inserted_expressions += 1

    # --- 2. Insérer dans `expression_content` ---
    # La langue de contenu = la langue de l'expression elle-même
    session.execute(
        text("""
            INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
            VALUES (:expression_id, :locale, :meaning, :origin, :example)
            ON CONFLICT (expression_id, locale) DO NOTHING
        """),
        {
            "expression_id": expr_id,
            "locale": language,
            "meaning": expr.get("meaning", ""),
            "origin": expr.get("origin", ""),
            "example": expr.get("example", ""),
        }
    )
    inserted_contents += 1

    # --- 3. Insérer les tags ---
    tags = expr.get("tags", [])
    for tag_text in tags:
        # Le slug = le texte en minuscules, espaces → tirets
        tag_slug = tag_text.lower().strip().replace(" ", "-")

        # Insérer le tag s'il n'existe pas encore
        if tag_slug not in tags_inserted:
            existing_tag = session.execute(
                text("SELECT id FROM tags WHERE slug = :slug"),
                {"slug": tag_slug}
            ).fetchone()

            if existing_tag:
                tags_inserted[tag_slug] = existing_tag[0]
            else:
                session.execute(
                    text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT DO NOTHING"),
                    {"id": tag_slug, "slug": tag_slug}
                )
                # Insérer le nom du tag dans sa langue d'origine
                session.execute(
                    text("""
                        INSERT INTO tag_names (tag_id, locale, name)
                        VALUES (:tag_id, :locale, :name)
                        ON CONFLICT (tag_id, locale) DO NOTHING
                    """),
                    {"tag_id": tag_slug, "locale": language, "name": tag_text}
                )
                tags_inserted[tag_slug] = tag_slug
                inserted_tags += 1

        # Lier l'expression au tag
        session.execute(
            text("""
                INSERT INTO expression_tags (expression_id, tag_id)
                VALUES (:expression_id, :tag_id)
                ON CONFLICT DO NOTHING
            """),
            {"expression_id": expr_id, "tag_id": tag_slug}
        )

# Valider toutes les insertions
session.commit()
session.close()

# Rapport final
print()
print("=== Migration terminée ===")
print(f"  Expressions insérées  : {inserted_expressions}")
print(f"  Contenus insérés      : {inserted_contents}")
print(f"  Tags insérés          : {inserted_tags}")
print(f"  Expressions ignorées  : {skipped} (déjà présentes)")
print()

# Vérification rapide : compter ce qui est en base
with engine.connect() as conn:
    nb_expr = conn.execute(text("SELECT COUNT(*) FROM expressions")).scalar()
    nb_content = conn.execute(text("SELECT COUNT(*) FROM expression_content")).scalar()
    nb_tags = conn.execute(text("SELECT COUNT(*) FROM tags")).scalar()
    nb_links = conn.execute(text("SELECT COUNT(*) FROM expression_tags")).scalar()

print("=== Vérification en base ===")
print(f"  expressions       : {nb_expr}")
print(f"  expression_content: {nb_content}")
print(f"  tags              : {nb_tags}")
print(f"  expression_tags   : {nb_links}")

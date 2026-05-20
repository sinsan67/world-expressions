"""
Normalise les slugs de tags vers l'anglais (Chemin A — V3A).

Logique :
  - Chaque tag reçoit un slug anglais canonique (ex: travail → work)
  - Les doublons sont fusionnés (animaux + animales → animals)
  - Les expression_tags sont mis à jour en conséquence
  - Les tag_names existants sont nettoyés (ils seront recréés par populate_tag_names.py)

Usage :
  python3 scripts/normalize_tags.py           # dry-run (affiche ce qui serait fait)
  python3 scripts/normalize_tags.py --apply   # applique les changements
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config import engine

DRY_RUN = "--apply" not in sys.argv

# Mapping : old_slug → canonical_english_slug
# Si old_slug == new_slug, rien à faire (tag déjà au bon slug)
MAPPING = {
    # ── Français → Anglais ────────────────────────────────────────────────────
    "travail":          "work",
    "animaux":          "animals",
    "relations":        "relationships",
    "émotions":         "emotions",
    "nourriture":       "food",
    "temps":            "time",
    "santé":            "health",
    "météo":            "weather",
    "argent":           "money",
    "corps":            "body",
    "caractère":        "character",
    "échec":            "failure",
    "réussite":         "success",
    "tristesse":        "sadness",
    "peur":             "fear",
    "amour":            "love",
    "colère":           "anger",
    "mensonge":         "lying",
    "maladresse":       "clumsiness",
    "ironie":           "irony",
    "exagération":      "exaggeration",
    "argot":            "slang",
    "déception":        "disappointment",
    "énergie":          "energy",
    "politique":        "politics",
    "difficulté":       "difficulty",
    "paresse":          "laziness",
    "tromperie":        "deception",
    "erreur":           "mistake",
    "couleurs":         "colors",
    "opportunisme":     "opportunism",
    "fuite":            "escape",
    "méfiance":         "distrust",
    "résilience":       "resilience",
    "conflit":          "conflict",
    "franchise":        "honesty",
    "prudence":         "caution",
    "débrouillardise":  "resourcefulness",
    "chance":           "luck",
    "décision":         "decision",
    "trahison":         "betrayal",
    "optimisme":        "optimism",
    "liberté":          "freedom",
    "rapidité":         "speed",
    "mouvement":        "movement",
    "vulgaire":         "vulgarity",
    "quotidien":        "everyday",
    "départ":           "leaving",
    "proverbe":         "proverb",
    "sagesse":          "wisdom",
    "générosité":       "generosity",
    "responsabilité":   "responsibility",
    "conséquences":     "consequences",
    "moquerie":         "mockery",
    "amitié":           "friendship",
    "ambition":         "ambition",
    "acceptation":      "acceptance",
    "attention":        "attention",
    "autonomie":        "autonomy",
    "hasard":           "luck",
    "critique":         "criticism",
    "culture":          "culture",

    # ── Espagnol → Anglais ────────────────────────────────────────────────────
    "animales":         "animals",
    "esfuerzo":         "effort",
    "trabajo":          "work",
    "tiempo":           "time",
    "prudencia":        "caution",
    "engaño":           "deception",
    "hablar":           "communication",
    "honestidad":       "honesty",
    "consecuencias":    "consequences",

    # ── Doublons anglais à fusionner ──────────────────────────────────────────
    "sports":           "sport",
    "money":            "money",      # absorbera argent
    "failure":          "failure",    # absorbera échec
    "success":          "success",    # absorbera réussite
    "emotions":         "emotions",   # absorbera émotions
    "time":             "time",       # absorbera temps + tiempo
    "work":             "work",       # absorbera travail + trabajo
    "anger":            "anger",      # absorbera colère
    "decision":         "decision",   # absorbera décision
    "difficulty":       "difficulty", # absorbera difficulté
    "deception":        "deception",  # absorbera tromperie + engaño
    "caution":          "caution",    # absorbera prudence + prudencia
    "honesty":          "honesty",    # absorbera franchise + honestidad
    "luck":             "luck",       # absorbera chance
    "mistake":          "mistake",    # absorbera erreur
    "speed":            "speed",      # absorbera rapidité
    "leaving":          "leaving",    # absorbera départ
    "consequences":     "consequences",
    "responsibility":   "responsibility",
}


def normalize(apply: bool = False):
    with engine.begin() as conn:
        # Récupère tous les tags existants
        existing = {r.id for r in conn.execute(text("SELECT id FROM tags")).fetchall()}

        renames = 0
        merges  = 0
        skipped = 0

        for old, new in MAPPING.items():
            if old == new:
                skipped += 1
                continue
            if old not in existing:
                # Tag source inexistant (peut-être déjà migré)
                continue

            if new in existing:
                # Fusion : new existe déjà → on déplace les expression_tags de old vers new
                count = conn.execute(
                    text("SELECT COUNT(*) FROM expression_tags WHERE tag_id = :old"),
                    {"old": old}
                ).scalar()
                print(f"  MERGE  {old:30s} → {new}  ({count} expressions)")
                if apply:
                    # Évite les doublons avec ON CONFLICT DO NOTHING
                    conn.execute(text("""
                        INSERT INTO expression_tags (expression_id, tag_id)
                        SELECT expression_id, :new FROM expression_tags WHERE tag_id = :old
                        ON CONFLICT DO NOTHING
                    """), {"old": old, "new": new})
                    conn.execute(text("DELETE FROM expression_tags WHERE tag_id = :old"), {"old": old})
                    conn.execute(text("DELETE FROM tag_names WHERE tag_id = :old"), {"old": old})
                    conn.execute(text("DELETE FROM tags WHERE id = :old"), {"old": old})
                    existing.discard(old)
                merges += 1
            else:
                # Renommage : new n'existe pas → on crée new, on transfère, on supprime old
                count = conn.execute(
                    text("SELECT COUNT(*) FROM expression_tags WHERE tag_id = :old"),
                    {"old": old}
                ).scalar()
                print(f"  RENAME {old:30s} → {new}  ({count} expressions)")
                if apply:
                    conn.execute(
                        text("INSERT INTO tags (id, slug) VALUES (:new, :new)"),
                        {"new": new}
                    )
                    conn.execute(
                        text("UPDATE expression_tags SET tag_id = :new WHERE tag_id = :old"),
                        {"old": old, "new": new}
                    )
                    conn.execute(
                        text("DELETE FROM tag_names WHERE tag_id = :old"),
                        {"old": old}
                    )
                    conn.execute(
                        text("DELETE FROM tags WHERE id = :old"),
                        {"old": old}
                    )
                    existing.discard(old)
                    existing.add(new)
                renames += 1

        mode = "APPLIQUÉ" if apply else "DRY-RUN"
        print(f"\n[{mode}] Renames: {renames} | Merges: {merges} | Skipped (déjà OK): {skipped}")
        if not apply:
            print("→ Relance avec --apply pour appliquer.")


if __name__ == "__main__":
    print(f"{'[DRY-RUN] ' if DRY_RUN else '[APPLY] '}Normalisation des tags...\n")
    normalize(apply=not DRY_RUN)

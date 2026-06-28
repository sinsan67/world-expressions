#!/usr/bin/env python3
"""
Génère les liens de concept entre expressions de différentes langues via Claude.

Version Claude (Anthropic) du populate_concepts.py — supporte toutes les langues
y compris l'allemand (de) et le japonais (ja).

Logique clé :
- Pour chaque expression source sans concept_id, demande à Claude ses équivalents
  idiomatiques dans les langues cibles (fr, en, es, it, tr).
- Si un équivalent existe déjà en DB ET a déjà un concept_id → on rattache
  l'expression source à ce concept existant (pas de doublon).
- Si aucun équivalent existant n'a de concept_id → on crée un nouveau concept.
- On ne réécrit jamais le concept_id d'une expression qui en a déjà un.

Idempotent : les expressions ayant déjà un concept_id sont ignorées.

Usage :
    python3 scripts/populate_concepts_claude.py --source de --limit 10 --dry-run
    python3 scripts/populate_concepts_claude.py --source ja --limit 5 --dry-run
    python3 scripts/populate_concepts_claude.py --source de --prod
    python3 scripts/populate_concepts_claude.py --source ja --prod
    python3 scripts/populate_concepts_claude.py --source fr --prod  # fonctionne aussi pour les langues historiques
"""

import sys
import json
import time
import uuid
import argparse
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv

_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

import anthropic
from sqlalchemy import text
from config import engine

MODEL = "claude-haiku-4-5"

# Langues source supportées
ALL_LANGS = ["fr", "en", "es", "it", "tr", "de", "ja"]

# Langues cibles pour chercher des équivalents (les 5 langues avec une bonne couverture)
CORE_LANGS = ["fr", "en", "es", "it", "tr"]

LANG_NAMES = {
    "fr": "French",
    "en": "English",
    "es": "Spanish",
    "it": "Italian",
    "tr": "Turkish",
    "de": "German",
    "ja": "Japanese",
}

SYSTEM_PROMPT = """You are an expert in idiomatic expressions across multiple languages.

Your task: given an idiomatic expression in one language, find its idiomatic equivalents in other languages.

IMPORTANT — what counts as an idiomatic equivalent:
- Expressions must share the same metaphorical IMAGE, not just a similar general meaning.
- Valid: "avoir le cafard" (FR) ↔ "to feel blue" (EN) — both use a physical/sensory image to express sadness.
- Not valid: "avoir le cafard" (FR) ↔ "estar triste" (ES) — "estar triste" is a literal statement, not an idiom.
- Not valid: two expressions that merely share a broad theme (e.g. "distance", "time", "money") without a shared metaphor.
- Not valid: a literal word-for-word translation of the source expression into another language.

Confidence scale — be strict and precise:
- 1.00 : The exact same expression, translated verbatim. The metaphor, image, and structure are identical.
- 0.90–0.99 : Same metaphor and register, interchangeable in context.
- 0.65–0.89 : Similar meaning, but the metaphor or register differs. The idea overlaps, the image does not.
- Below 0.65 : Only shares a broad theme or topic — do not include.

Return ONLY a valid JSON array. Each element must have:
- "language": 2-letter code (fr/en/es/it/tr)
- "text": the idiomatic expression in its most natural, common form
- "literal_fr": word-for-word French translation of that expression (even if awkward)
- "meaning_fr": what this expression means, in French, in 1 sentence
- "rationale": one sentence explaining what metaphorical mechanism or image these two expressions share
- "confidence": float 0.0–1.0 following the scale above

Follow this reasoning process strictly — in this order:
1. ANALYZE the source expression: what concrete mechanism does it use? (a physical object, creature, sensation, gesture, spatial image...) — not just what it means, but HOW it creates meaning.
2. SEARCH by mechanism: for each target language, look for idiomatic expressions that use a SIMILAR mechanism.
3. ENUMERATE candidates: think of 2–3 per language, including less famous ones that may be more precise.
4. SELECT all candidates with confidence ≥ 0.65. If several qualify in the same language, include all of them — rank by confidence (highest first).

You may and should return multiple expressions per language when several qualify.
No markdown, no explanation — return only the JSON array."""


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[àáâãäå]", "a", s)
    s = re.sub(r"[èéêë]", "e", s)
    s = re.sub(r"[ìíîï]", "i", s)
    s = re.sub(r"[òóôõö]", "o", s)
    s = re.sub(r"[ùúûü]", "u", s)
    s = re.sub(r"[ç]", "c", s)
    s = re.sub(r"[ñ]", "n", s)
    s = re.sub(r"[ğ]", "g", s)
    s = re.sub(r"[şś]", "s", s)
    s = re.sub(r"[ıİ]", "i", s)
    s = re.sub(r"[äÄ]", "a", s)
    s = re.sub(r"[öÖ]", "o", s)
    s = re.sub(r"[üÜ]", "u", s)
    s = re.sub(r"[ß]", "ss", s)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")[:80]


def get_source_expressions(source_lang: str, limit: int | None) -> list[dict]:
    sql = """
        SELECT e.id, e.text, e.language,
               COALESCE(ec.meaning, ct.meaning) AS meaning
        FROM expressions e
        LEFT JOIN expression_content ec ON ec.expression_id=e.id AND ec.locale=:lang
        LEFT JOIN content_translations ct ON ct.expression_id=e.id AND ct.target_lang=:lang
        WHERE e.language=:lang
          AND e.concept_id IS NULL
          AND e.kind != 'word'
          AND COALESCE(ec.meaning, ct.meaning) IS NOT NULL
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"lang": source_lang}).fetchall()
    return [{"id": r.id, "text": r.text, "language": r.language, "meaning": r.meaning} for r in rows]


def find_existing_expression(expr_text: str, language: str) -> str | None:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id FROM expressions WHERE LOWER(text)=LOWER(:t) AND language=:lang LIMIT 1"),
            {"t": expr_text, "lang": language},
        ).fetchone()
    return row.id if row else None


def get_expression_concept(expression_id: str) -> str | None:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT concept_id FROM expressions WHERE id=:id"),
            {"id": expression_id},
        ).fetchone()
    return row.concept_id if row and row.concept_id else None


def call_claude(client: anthropic.Anthropic, source_expr: dict, target_langs: list[str]) -> list[dict] | None:
    lang_list = ", ".join([LANG_NAMES[l] for l in target_langs])
    user_msg = (
        f'Source expression ({LANG_NAMES[source_expr["language"]]}):\n'
        f'  Text: "{source_expr["text"]}"\n'
        f'  Meaning: {source_expr["meaning"]}\n\n'
        f'Find the closest idiomatic equivalent in: {lang_list}.'
    )
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
        if not raw or not raw.startswith("["):
            print(f"  Claude non-JSON response: {raw[:200]}")
            return None
        return json.loads(raw)
    except Exception as e:
        print(f"  Claude error: {e}")
        return None


def process_expression(client: anthropic.Anthropic, source_expr: dict, dry_run: bool) -> bool:
    source_lang = source_expr["language"]
    # Cherche des équivalents dans les 5 langues core (pas dans la langue source elle-même)
    target_langs = [l for l in CORE_LANGS if l != source_lang]

    equivalents = call_claude(client, source_expr, target_langs)
    if not equivalents:
        return False

    # Filtrer : confiance >= 0.65 et au moins 2 mots
    valid = [
        e for e in equivalents
        if isinstance(e, dict)
        and e.get("confidence", 0) >= 0.65
        and len(e.get("text", "").strip().split()) >= 2
        and e.get("language") in CORE_LANGS
    ]

    if not valid:
        print("  No confident equivalents found")
        return False

    print(f"  {len(valid)} equivalent(s) (confidence >= 0.65):")
    for eq in valid:
        print(f"    [{eq['language']}] {eq['text']!r} — conf={eq.get('confidence', '?')}")
        print(f"      rationale: {eq.get('rationale', '—')}")

    if dry_run:
        return True

    # Rechercher si un équivalent existant a déjà un concept_id
    reused_concept_id = None
    for eq in valid:
        existing_id = find_existing_expression(eq["text"], eq["language"])
        if existing_id:
            cid = get_expression_concept(existing_id)
            if cid:
                reused_concept_id = cid
                print(f"  → Rattachement au concept existant {cid[:8]}... (via {eq['language']} '{eq['text']}')")
                break

    if reused_concept_id:
        # Rattacher la source à un concept existant
        concept_id = reused_concept_id
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE expressions SET concept_id=:cid, concept_confidence=1.0 WHERE id=:eid"),
                {"cid": concept_id, "eid": source_expr["id"]},
            )
    else:
        # Créer un nouveau concept (slug = ID de l'expression source, déjà ASCII-safe)
        concept_id = str(uuid.uuid4())
        # Pour DE/JA : l'ID est déjà un slug romaji ou latin valide
        # Pour FR/EN/...: slugify du texte comme avant
        if source_lang in ("de", "ja"):
            concept_slug = source_expr["id"]
        else:
            concept_slug = slugify(source_expr["text"])

        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO concepts(id, slug) VALUES(:id, :slug) ON CONFLICT (slug) DO NOTHING"),
                {"id": concept_id, "slug": concept_slug},
            )
            row = conn.execute(
                text("SELECT id FROM concepts WHERE slug=:slug"), {"slug": concept_slug}
            ).fetchone()
            concept_id = row.id  # UUID réel (peut différer si conflit de slug)

            # Lier la source
            conn.execute(
                text("UPDATE expressions SET concept_id=:cid, concept_confidence=1.0 WHERE id=:eid"),
                {"cid": concept_id, "eid": source_expr["id"]},
            )

    # Traiter chaque équivalent valide
    for eq in valid:
        lang = eq["language"]
        eq_text = eq["text"].strip()
        confidence = float(eq.get("confidence", 0.7))
        literal_fr = eq.get("literal_fr", "").strip() or None
        meaning_fr = eq.get("meaning_fr", "").strip() or None
        rationale = eq.get("rationale", "").strip() or None

        existing_id = find_existing_expression(eq_text, lang)

        with engine.begin() as conn:
            if existing_id:
                # Ne pas écraser un concept_id existant
                conn.execute(
                    text("""
                        UPDATE expressions
                        SET concept_id = COALESCE(concept_id, :cid),
                            concept_confidence = COALESCE(concept_confidence, :conf),
                            literal_fr = COALESCE(literal_fr, :lf),
                            rationale = COALESCE(rationale, :r)
                        WHERE id = :eid
                    """),
                    {"cid": concept_id, "conf": confidence, "lf": literal_fr, "r": rationale, "eid": existing_id},
                )
            else:
                # Créer l'expression équivalente (dans une langue core FR/EN/ES/IT/TR)
                new_id = slugify(eq_text)
                if not new_id:
                    new_id = f"{lang}-{uuid.uuid4().hex[:8]}"
                # Éviter les collisions de slug
                with engine.connect() as check:
                    if check.execute(text("SELECT 1 FROM expressions WHERE id=:id"), {"id": new_id}).fetchone():
                        new_id = f"{new_id}-{lang}"

                conn.execute(
                    text("""
                        INSERT INTO expressions(id, text, language, concept_id, concept_confidence, literal_fr, rationale)
                        VALUES(:id, :text, :lang, :cid, :conf, :lf, :r)
                    """),
                    {"id": new_id, "text": eq_text, "lang": lang,
                     "cid": concept_id, "conf": confidence, "lf": literal_fr, "r": rationale},
                )

            # Stocker le sens FR si fourni et absent
            if meaning_fr and existing_id:
                conn.execute(
                    text("""
                        INSERT INTO expression_content(expression_id, locale, meaning)
                        VALUES(:eid, 'fr', :meaning)
                        ON CONFLICT (expression_id, locale) DO NOTHING
                    """),
                    {"eid": existing_id, "meaning": meaning_fr},
                )

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Génère les liens de concept via Claude (supporte DE, JA et toutes les langues)"
    )
    parser.add_argument("--source", required=True, choices=ALL_LANGS,
                        help=f"Langue source parmi : {ALL_LANGS}")
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre max d'expressions à traiter (test)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche les résultats sans écrire en base")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Délai entre appels API en secondes (défaut: 0.5)")
    parser.add_argument("--prod", action="store_true",
                        help="Utilise la base production (.env.prod)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Erreur : ANTHROPIC_API_KEY absent du .env")
        sys.exit(1)

    expressions = get_source_expressions(args.source, args.limit)
    total = len(expressions)

    if total == 0:
        print(f"Toutes les expressions {args.source.upper()} ont déjà un concept_id.")
        return

    print(f"{'DRY RUN — ' if args.dry_run else ''}{total} expressions {args.source.upper()} sans concept_id")

    client = anthropic.Anthropic(api_key=api_key)
    ok = err = 0

    for i, expr in enumerate(expressions, 1):
        print(f"\n[{i}/{total}] {expr['text']!r}")
        try:
            success = process_expression(client, expr, args.dry_run)
            if success:
                ok += 1
            else:
                err += 1
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("  RATE LIMIT — pause 60s")
                time.sleep(60)
                try:
                    success = process_expression(client, expr, args.dry_run)
                    if success:
                        ok += 1
                    else:
                        err += 1
                except Exception as e2:
                    print(f"  ERROR retry: {e2}")
                    err += 1
            else:
                print(f"  ERROR: {e}")
                err += 1

        if i < total and args.delay > 0:
            time.sleep(args.delay)

    print(f"\n{'(dry-run) ' if args.dry_run else ''}Terminé : {ok} liées, {err} sans équivalent.")
    if err:
        print("Relancez le script pour réessayer les expressions sans équivalent (idempotent).")


if __name__ == "__main__":
    main()

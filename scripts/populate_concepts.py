#!/usr/bin/env python3
"""
Génère les liens de concept entre expressions de différentes langues.

Pour chaque expression source, appelle Mistral pour trouver l'équivalent
idiomatique dans les autres langues. Crée les expressions manquantes et
les relie via concept_id.

Idempotent : les expressions ayant déjà un concept_id sont ignorées.

Usage :
    python3 scripts/populate_concepts.py --source fr --limit 10 --dry-run
    python3 scripts/populate_concepts.py --source fr --limit 50
    python3 scripts/populate_concepts.py --source en --limit 20
    python3 scripts/populate_concepts.py --ids avoir-le-cafard,casser-les-pieds

Langues cibles générées pour chaque expression : en, es, it, tr (sauf la langue source).
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
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import text
from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"
ALL_LANGS = ["fr", "en", "es", "it", "tr"]

LANG_NAMES = {
    "fr": "French", "en": "English", "es": "Spanish", "it": "Italian", "tr": "Turkish"
}

SYSTEM_PROMPT = """You are an expert in idiomatic expressions across multiple languages.

Given an idiomatic expression in one language, find its closest idiomatic equivalent in other languages.
An idiomatic equivalent shares the SAME metaphorical meaning and usage context — not just a literal translation.

Return ONLY a valid JSON array. Each element must have:
- "language": 2-letter code (en/es/it/tr/fr)
- "text": the idiomatic expression in that language (most natural, common form)
- "literal_fr": word-for-word translation of that expression into French
- "meaning_fr": what the expression means in French (1 sentence)
- "confidence": float 0.0–1.0 (1.0 = perfect equivalent, 0.7 = close but not identical, below 0.6 = skip)

Only include languages where a genuine idiomatic equivalent exists (confidence >= 0.6).
No markdown, no extra text — only the JSON array."""


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[àáâãäå]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[ğ]", "g", text)
    text = re.sub(r"[şś]", "s", text)
    text = re.sub(r"[ıİ]", "i", text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")[:80]


def get_source_expressions(source_lang: str, ids: list[str] | None, limit: int | None) -> list[dict]:
    if ids:
        placeholders = ",".join([f"'{i}'" for i in ids])
        sql = f"""
            SELECT e.id, e.text, e.language,
                   COALESCE(ec.meaning, ct.meaning) AS meaning
            FROM expressions e
            LEFT JOIN expression_content ec ON ec.expression_id=e.id AND ec.locale=:lang
            LEFT JOIN content_translations ct ON ct.expression_id=e.id AND ct.target_lang=:lang
            WHERE e.id IN ({placeholders}) AND e.concept_id IS NULL
        """
    else:
        sql = """
            SELECT e.id, e.text, e.language,
                   COALESCE(ec.meaning, ct.meaning) AS meaning
            FROM expressions e
            LEFT JOIN expression_content ec ON ec.expression_id=e.id AND ec.locale=:lang
            LEFT JOIN content_translations ct ON ct.expression_id=e.id AND ct.target_lang=:lang
            WHERE e.language=:lang AND e.concept_id IS NULL AND e.kind != 'word'
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
            {"t": expr_text, "lang": language}
        ).fetchone()
    return row.id if row else None


def call_mistral(client: Mistral, source_expr: dict, target_langs: list[str]) -> list[dict] | None:
    lang_list = ", ".join([LANG_NAMES[l] for l in target_langs])
    user_msg = (
        f'Source expression ({LANG_NAMES[source_expr["language"]]}):\n'
        f'  Text: "{source_expr["text"]}"\n'
        f'  Meaning: {source_expr["meaning"]}\n\n'
        f'Find the closest idiomatic equivalent in: {lang_list}.'
    )
    try:
        resp = client.chat.complete(
            model=MODEL,
            max_tokens=600,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
        )
        raw = resp.choices[0].message.content.strip()
        return json.loads(raw)
    except Exception as e:
        print(f"  Mistral error: {e}")
        return None


def process_expression(client: Mistral, source_expr: dict, dry_run: bool) -> bool:
    source_lang = source_expr["language"]
    target_langs = [l for l in ALL_LANGS if l != source_lang]

    equivalents = call_mistral(client, source_expr, target_langs)
    if not equivalents:
        return False

    # Filtrer par seuil de confiance
    valid = [e for e in equivalents if isinstance(e, dict) and e.get("confidence", 0) >= 0.65]

    if not valid:
        print(f"  No confident equivalents found")
        return False

    print(f"  {len(valid)} equivalents (confidence >= 0.65):")
    for eq in valid:
        print(f"    [{eq['language']}] {eq['text']!r} — conf={eq.get('confidence', '?')}")
        print(f"      littéral: {eq.get('literal_fr', '')!r}")

    if dry_run:
        return True

    concept_id = str(uuid.uuid4())

    with engine.begin() as conn:
        # Créer le concept
        conn.execute(
            text("INSERT INTO concepts(id, slug) VALUES(:id, :slug) ON CONFLICT DO NOTHING"),
            {"id": concept_id, "slug": slugify(source_expr["text"])}
        )
        # Lier l'expression source
        conn.execute(
            text("UPDATE expressions SET concept_id=:cid, concept_confidence=1.0 WHERE id=:eid"),
            {"cid": concept_id, "eid": source_expr["id"]}
        )
        # Mettre à jour literal_fr pour l'expression source (sa propre formulation en français)
        conn.execute(
            text("UPDATE expressions SET literal_fr=:lf WHERE id=:eid"),
            {"lf": source_expr["text"] if source_lang == "fr" else None, "eid": source_expr["id"]}
        )

    for eq in valid:
        lang = eq["language"]
        eq_text = eq["text"].strip()
        confidence = float(eq.get("confidence", 0.7))
        literal_fr = eq.get("literal_fr", "").strip() or None
        meaning_fr = eq.get("meaning_fr", "").strip() or None

        existing_id = find_existing_expression(eq_text, lang)

        with engine.begin() as conn:
            if existing_id:
                expr_id = existing_id
                conn.execute(
                    text("UPDATE expressions SET concept_id=:cid, concept_confidence=:conf, literal_fr=:lf WHERE id=:eid"),
                    {"cid": concept_id, "conf": confidence, "lf": literal_fr, "eid": expr_id}
                )
            else:
                expr_id = slugify(eq_text)
                # Éviter les collisions de slug
                with engine.connect() as check_conn:
                    if check_conn.execute(text("SELECT 1 FROM expressions WHERE id=:id"), {"id": expr_id}).fetchone():
                        expr_id = f"{expr_id}-{lang}"

                conn.execute(
                    text("""INSERT INTO expressions(id, text, language, concept_id, concept_confidence, literal_fr)
                            VALUES(:id, :text, :lang, :cid, :conf, :lf)"""),
                    {"id": expr_id, "text": eq_text, "lang": lang,
                     "cid": concept_id, "conf": confidence, "lf": literal_fr}
                )

            # Stocker le sens en français dans expression_content si absent
            if meaning_fr:
                conn.execute(
                    text("""INSERT INTO expression_content(expression_id, locale, meaning)
                            VALUES(:eid, 'fr', :meaning)
                            ON CONFLICT (expression_id, locale) DO NOTHING"""),
                    {"eid": expr_id, "meaning": meaning_fr}
                )

    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="fr", choices=ALL_LANGS)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--ids", type=str, default=None, help="Comma-separated expression IDs")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    ids = [i.strip() for i in args.ids.split(",")] if args.ids else None
    expressions = get_source_expressions(args.source, ids, args.limit)

    print(f"{'DRY RUN — ' if args.dry_run else ''}Processing {len(expressions)} {args.source.upper()} expressions")

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    ok, err = 0, 0

    for i, expr in enumerate(expressions, 1):
        print(f"\n[{i}/{len(expressions)}] {expr['text']!r}")
        try:
            success = process_expression(client, expr, args.dry_run)
            if success:
                ok += 1
            else:
                err += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            err += 1
        time.sleep(1.5)

    print(f"\n{'(dry-run) ' if args.dry_run else ''}Done: {ok} linked, {err} failed")


if __name__ == "__main__":
    main()

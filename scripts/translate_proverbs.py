#!/usr/bin/env python3
"""
Génère les traductions des proverbes langue à langue via Mistral.

Différence clé vs populate_translations.py (idiomes) :
- Filtre uniquement kind='proverb'
- Le prompt cherche le PROVERBE ÉQUIVALENT dans la langue cible,
  pas une traduction mot à mot. Si "L'argent ne fait pas le bonheur"
  (FR) → "Money can't buy happiness" (EN), pas "The money does not make happiness".
- Le champ 'idiomatic' stocke ce proverbe équivalent (null si aucun n'existe).
- La traduction littérale est quand même fournie pour montrer l'image d'origine.
- Le source_hint est transmis à Mistral pour ancrer la réponse culturellement.

Idempotent : les proverbes déjà traduits sont ignorés.
Relancez librement si interrompu.

Usage :
    python3 scripts/translate_proverbs.py --source fr --target en
    python3 scripts/translate_proverbs.py --source tr --target fr --limit 10 --dry-run
    python3 scripts/translate_proverbs.py --source fr --target all
    python3 scripts/translate_proverbs.py --all-pairs --prod

Langues supportées : fr, en, es, it, tr, de
"""

import sys
import json
import time
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv
from sqlalchemy import text

_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"

SUPPORTED = ["fr", "en", "es", "it", "tr", "de"]

# Ordre de traitement pour --all-pairs :
# on finit TOUTES les traductions d'une langue source avant de passer à la suivante.
# fr en entier → en en entier → es en entier → it en entier → tr en entier → de en entier
SOURCE_ORDER = ["fr", "en", "es", "it", "tr", "de"]

LANG_NAMES = {
    "fr": {"en": "French",  "native": "français"},
    "en": {"en": "English", "native": "English"},
    "es": {"en": "Spanish", "native": "español"},
    "it": {"en": "Italian", "native": "italiano"},
    "tr": {"en": "Turkish", "native": "Türkçe"},
    "de": {"en": "German",  "native": "Deutsch"},
}

# Sources spécialisées par paire de langues (symétrique : FR↔EN = EN↔FR).
# Clé = frozenset des deux codes langue. Utilisées dans le system prompt pour ancrer
# Mistral sur les ressources bilingues les plus pertinentes pour trouver un proverbe équivalent.
PAIR_SOURCES: dict[frozenset, str] = {
    frozenset({"fr", "en"}): (
        "Linguee (linguee.fr) — traductions contextuelles avec exemples réels ; "
        "WordReference Forums (forum.wordreference.com) — équivalents discutés par des natifs ; "
        "Reverso Context (context.reverso.net) — proverbes en contexte ; "
        "ProZ (proz.com) — base de données de traducteurs professionnels ; "
        "Wiktionnaire bilingue FR/EN (fr.wiktionary.org)"
    ),
    frozenset({"fr", "es"}): (
        "Linguee FR-ES (linguee.fr) — traductions et exemples ; "
        "WordReference Forums FR-ES (forum.wordreference.com) — équivalents par des natifs ; "
        "Reverso Context FR-ES (context.reverso.net) ; "
        "ProZ FR-ES (proz.com) ; "
        "Wiktionnaire bilingue FR/ES (fr.wiktionary.org)"
    ),
    frozenset({"fr", "it"}): (
        "Linguee FR-IT (linguee.fr) ; "
        "Reverso Context FR-IT (context.reverso.net) ; "
        "WordReference Forums FR-IT (forum.wordreference.com) ; "
        "ProZ FR-IT (proz.com) ; "
        "Wiktionnaire bilingue FR/IT (fr.wiktionary.org)"
    ),
    frozenset({"fr", "de"}): (
        "Linguee FR-DE (linguee.fr) ; "
        "Reverso Context FR-DE (context.reverso.net) ; "
        "LEO dictionnaire FR-DE (dict.leo.org) — inclut expressions et proverbes ; "
        "ProZ FR-DE (proz.com) ; "
        "Wiktionnaire bilingue FR/DE (fr.wiktionary.org)"
    ),
    frozenset({"fr", "tr"}): (
        "Reverso Context FR-TR (context.reverso.net) ; "
        "ProZ FR-TR (proz.com) ; "
        "Turkish-English-French Proverb Database (academia.edu — recherche 'French Turkish proverbs') ; "
        "Wiktionnaire bilingue FR/TR (fr.wiktionary.org) ; "
        "Turkish Language Association / TDK (tdk.gov.tr)"
    ),
    frozenset({"en", "es"}): (
        "SpanishDict — section dédiée aux refranes (spanishdict.com) ; "
        "Linguee EN-ES (linguee.com) ; "
        "WordReference Forums EN-ES (forum.wordreference.com) ; "
        "Reverso Context EN-ES (context.reverso.net) ; "
        "ProZ EN-ES (proz.com)"
    ),
    frozenset({"en", "it"}): (
        "Italian-Proverbs.com — équivalents et explications anglais-italien ; "
        "Linguee EN-IT (linguee.com) ; "
        "Reverso Context EN-IT (context.reverso.net) ; "
        "WordReference Forums EN-IT (forum.wordreference.com) ; "
        "ProZ EN-IT (proz.com)"
    ),
    frozenset({"en", "de"}): (
        "Dict.cc — section Redewendungen (dict.cc) ; "
        "Linguee EN-DE (linguee.com) ; "
        "LEO dictionnaire EN-DE (dict.leo.org) ; "
        "Reverso Context EN-DE (context.reverso.net) ; "
        "ProZ EN-DE (proz.com)"
    ),
    frozenset({"en", "tr"}): (
        "Turkish Council proverb list (turkishcouncil.org) — équivalents culturels EN-TR ; "
        "Reverso Context EN-TR (context.reverso.net) ; "
        "ProZ EN-TR (proz.com) ; "
        "Wiktionnaire bilingue EN/TR (en.wiktionary.org) ; "
        "Academia.edu — recherche 'English Turkish proverbs'"
    ),
    frozenset({"es", "it"}): (
        "Linguee ES-IT (linguee.com) ; "
        "Reverso Context ES-IT (context.reverso.net) ; "
        "WordReference Forums ES-IT (forum.wordreference.com) ; "
        "ProZ ES-IT (proz.com) ; "
        "Wiktionnaire bilingue ES/IT (es.wiktionary.org)"
    ),
    frozenset({"es", "de"}): (
        "Linguee ES-DE (linguee.com) ; "
        "LEO dictionnaire ES-DE (dict.leo.org) ; "
        "Reverso Context ES-DE (context.reverso.net) ; "
        "ProZ ES-DE (proz.com) ; "
        "Wiktionnaire bilingue ES/DE (es.wiktionary.org)"
    ),
    frozenset({"es", "tr"}): (
        "Reverso Context ES-TR (context.reverso.net) ; "
        "ProZ ES-TR (proz.com) ; "
        "Academia.edu — recherche 'Spanish Turkish proverbs' ; "
        "Wiktionnaire bilingue ES/TR (es.wiktionary.org) ; "
        "Turkish Language Association / TDK (tdk.gov.tr)"
    ),
    frozenset({"it", "de"}): (
        "Linguee IT-DE (linguee.com) ; "
        "LEO dictionnaire IT-DE (dict.leo.org) ; "
        "Reverso Context IT-DE (context.reverso.net) ; "
        "ProZ IT-DE (proz.com) ; "
        "Wiktionnaire bilingue IT/DE (it.wiktionary.org)"
    ),
    frozenset({"it", "tr"}): (
        "Reverso Context IT-TR (context.reverso.net) ; "
        "ProZ IT-TR (proz.com) ; "
        "Academia.edu — recherche 'Italian Turkish proverbs' ; "
        "Wiktionnaire bilingue IT/TR (it.wiktionary.org) ; "
        "Turkish Language Association / TDK (tdk.gov.tr)"
    ),
    frozenset({"de", "tr"}): (
        "Reverso Context DE-TR (context.reverso.net) ; "
        "ProZ DE-TR (proz.com) ; "
        "LEO dictionnaire DE-TR (dict.leo.org) ; "
        "Wiktionnaire bilingue DE/TR (de.wiktionary.org) ; "
        "Academia.edu — recherche 'German Turkish proverbs'"
    ),
}


def build_system_prompt(source_lang: str, target_lang: str) -> str:
    source_name = LANG_NAMES[source_lang]["en"]
    target_name = LANG_NAMES[target_lang]["en"]
    pair_sources = PAIR_SOURCES.get(
        frozenset({source_lang, target_lang}),
        "Linguee, Reverso Context, WordReference Forums, ProZ, Wiktionary"
    )

    return f"""You are an expert in {source_name} and {target_name} proverb traditions and cultural linguistics.

Your task: for each {source_name} proverb provided, produce a {target_name}-language card
that helps a {target_name} speaker fully understand and relate to it.

CRITICAL DISTINCTION — this is about proverbs, not idioms:
- Do NOT produce a word-for-word translation as the main output.
- Instead, search the {target_name} proverb tradition for the CLOSEST EQUIVALENT PROVERB —
  the one that expresses the same wisdom with the same cultural weight.
- Draw on these bilingual {source_name}↔{target_name} reference sources: {pair_sources}
- If a true equivalent proverb exists (even if the imagery is completely different), use it.
- If no equivalent proverb exists, set "equivalent_proverb" to null.

Return ONLY a valid JSON object with exactly these fields (all values in {target_name}):
- "meaning": 2-3 sentences explaining the wisdom and cultural context of the original proverb
- "literal": word-for-word {target_name} translation of the original text
  (preserves the original imagery even if awkward — helps the reader see the source metaphor)
- "equivalent_proverb": the closest authentic {target_name} proverb expressing the same wisdom,
  or null if none exists. Must be a real, documented proverb — not a paraphrase.
- "equivalent_note": if equivalent_proverb is not null, 1 sentence explaining how the two
  proverbs relate (same wisdom, different imagery). Null if no equivalent.
- "origin": 1-2 sentences on the cultural/historical origin of the original proverb,
  in {target_name}, for a {target_name}-speaking reader
- "example": a natural {target_name} sentence that either quotes the equivalent proverb
  (if one exists) or uses the literal translation in context

No markdown, no extra text — only the JSON object."""


def build_user_message(expr: dict, source_lang: str) -> str:
    source_name = LANG_NAMES[source_lang]["en"]
    source_hint = f"\nDocumented source: {expr['source_hint']}" if expr.get("source_hint") else ""
    return f"""{source_name} proverb: "{expr['text']}"
{source_hint}
Original {source_name} meaning: {expr['meaning']}
Original {source_name} origin: {expr['origin']}
Original {source_name} example: {expr['example']}"""


def get_untranslated_proverbs(source_lang: str, target_lang: str, limit: int | None = None) -> list[dict]:
    """
    Retourne les proverbes source_lang sans traduction vers target_lang.
    Inclut le source_hint (colonne 'source' de expressions) pour enrichir le prompt.
    """
    sql = """
        SELECT e.id, e.text, e.source AS source_hint,
               COALESCE(ec.meaning, '(meaning not available)') AS meaning,
               COALESCE(ec.origin,  '(origin unknown)')        AS origin,
               COALESCE(ec.example, '(no example)')            AS example
        FROM expressions e
        LEFT JOIN expression_content ec
            ON ec.expression_id = e.id AND ec.locale = :source_lang
        WHERE e.language = :source_lang
          AND e.kind = 'proverb'
          AND e.id NOT IN (
              SELECT expression_id FROM content_translations
              WHERE target_lang = :target_lang
          )
        ORDER BY e.id
    """
    if limit:
        sql += f" LIMIT {limit}"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"source_lang": source_lang, "target_lang": target_lang}).fetchall()
    return [
        {
            "id": r.id,
            "text": r.text,
            "source_hint": r.source_hint,
            "meaning": r.meaning,
            "origin": r.origin,
            "example": r.example,
        }
        for r in rows
    ]


def call_mistral(client: Mistral, expr: dict, source_lang: str, target_lang: str) -> dict:
    response = client.chat.complete(
        model=MODEL,
        max_tokens=800,
        messages=[
            {"role": "system", "content": build_system_prompt(source_lang, target_lang)},
            {"role": "user",   "content": build_user_message(expr, source_lang)},
        ],
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    return json.loads(raw)


def insert_translation(expression_id: str, target_lang: str, t: dict) -> None:
    # 'idiomatic' column stores the equivalent_proverb (same schema as populate_translations)
    # 'meaning' gets the meaning + equivalent_note appended if present
    meaning = t.get("meaning", "")
    note = t.get("equivalent_note")
    if note:
        meaning = f"{meaning}\n\n{note}"

    sql = """
        INSERT INTO content_translations
            (expression_id, target_lang, meaning, literal, idiomatic, origin, example)
        VALUES
            (:id, :target_lang, :meaning, :literal, :idiomatic, :origin, :example)
        ON CONFLICT (expression_id, target_lang) DO UPDATE SET
            meaning   = EXCLUDED.meaning,
            literal   = EXCLUDED.literal,
            idiomatic = EXCLUDED.idiomatic,
            origin    = EXCLUDED.origin,
            example   = EXCLUDED.example
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {
            "id":          expression_id,
            "target_lang": target_lang,
            "meaning":     meaning,
            "literal":     t.get("literal"),
            "idiomatic":   t.get("equivalent_proverb"),
            "origin":      t.get("origin"),
            "example":     t.get("example"),
        })


def run_pair(client: Mistral, source_lang: str, target_lang: str, limit: int | None,
             dry_run: bool, delay: float) -> dict:
    source_name = LANG_NAMES[source_lang]["en"]
    target_name = LANG_NAMES[target_lang]["en"]
    flags = {"fr": "🇫🇷", "en": "🇬🇧", "es": "🇪🇸", "it": "🇮🇹", "tr": "🇹🇷", "de": "🇩🇪"}
    pair_label = f"{flags.get(source_lang, source_lang)} {source_name} → {flags.get(target_lang, target_lang)} {target_name}"

    print(f"\n{'='*60}", flush=True)
    print(f"  {pair_label}", flush=True)
    print(f"{'='*60}", flush=True)

    proverbs = get_untranslated_proverbs(source_lang, target_lang, limit=limit)
    total = len(proverbs)

    if total == 0:
        print(f"  Tous les proverbes {source_lang.upper()} ont déjà une traduction {target_lang.upper()}.", flush=True)
        return {"pair": f"{source_lang}→{target_lang}", "ok": 0, "errors": 0}

    print(f"  {total} proverbe(s) à traduire\n", flush=True)

    if dry_run:
        for i, p in enumerate(proverbs, 1):
            hint = f" [{p['source_hint']}]" if p.get("source_hint") else ""
            print(f"  [{i:3}/{total}] {p['text']}{hint}", flush=True)
        return {"pair": f"{source_lang}→{target_lang}", "ok": 0, "errors": 0}

    ok = errors = 0
    for i, expr in enumerate(proverbs, 1):
        hint = f" [{expr['source_hint']}]" if expr.get("source_hint") else ""
        print(f"  [{i:3}/{total}] {expr['text']}{hint} ... ", end="", flush=True)
        try:
            t = call_mistral(client, expr, source_lang, target_lang)
            insert_translation(expr["id"], target_lang, t)
            equiv = t.get("equivalent_proverb")
            print(f"OK{' → «' + equiv + '»' if equiv else ''}", flush=True)
            ok += 1
        except json.JSONDecodeError as e:
            print(f"ERREUR JSON ({e})", flush=True)
            errors += 1
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("RATE LIMIT — pause 60s", flush=True)
                time.sleep(60)
                try:
                    t = call_mistral(client, expr, source_lang, target_lang)
                    insert_translation(expr["id"], target_lang, t)
                    ok += 1
                    print(f"  [{i:3}/{total}] retry OK", flush=True)
                except Exception as e2:
                    print(f"ERREUR retry ({e2})", flush=True)
                    errors += 1
            else:
                print(f"ERREUR ({e})", flush=True)
                errors += 1

        if i < total and delay > 0:
            time.sleep(delay)

    return {"pair": f"{source_lang}→{target_lang}", "ok": ok, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Traduit les proverbes langue à langue via Mistral")
    parser.add_argument("--source", choices=SUPPORTED,
                        help="Langue source (ex: fr)")
    parser.add_argument("--target", choices=SUPPORTED + ["all"],
                        help="Langue cible ou 'all' pour toutes les langues sauf la source")
    parser.add_argument("--all-pairs", action="store_true",
                        help="Traite toutes les paires (6×5 = 30 directions)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Nombre max de proverbes par paire (test)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Liste les proverbes sans appeler l'API")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Délai entre appels API en secondes (défaut: 0.5)")
    parser.add_argument("--watch", type=int, default=0, metavar="SECONDS",
                        help="Mode watch : relance toutes les N secondes quand il n'y a rien à traduire. "
                             "Utile pour tourner en parallèle de generate_proverbs.py (ex: --watch 30)")
    parser.add_argument("--prod", action="store_true",
                        help="Utilise la base production (.env.prod)")
    args = parser.parse_args()

    # Construire la liste des paires à traiter
    if args.all_pairs:
        # Ordre garanti : fr en entier, puis en en entier, puis es, it, tr, de.
        # Pour chaque source, toutes les cibles sont traitées avant de passer à la suivante.
        pairs = [
            (src, tgt)
            for src in SOURCE_ORDER
            for tgt in SOURCE_ORDER
            if src != tgt
        ]
    elif args.source and args.target == "all":
        pairs = [(args.source, t) for t in SUPPORTED if t != args.source]
    elif args.source and args.target:
        if args.source == args.target:
            print("Erreur : source et target doivent être différents.")
            sys.exit(1)
        pairs = [(args.source, args.target)]
    else:
        print("Erreur : spécifiez --source et --target, ou --all-pairs.")
        parser.print_help()
        sys.exit(1)

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key and not args.dry_run:
        print("Erreur : MISTRAL_API_KEY absent du .env")
        sys.exit(1)

    client = Mistral(api_key=api_key) if not args.dry_run else None

    if args.dry_run:
        print("DRY-RUN MODE — aucun appel API ni écriture en base\n", flush=True)

    pass_num = 0
    while True:
        pass_num += 1
        if args.watch:
            print(f"\n[ Passe {pass_num} — {time.strftime('%H:%M:%S')} ]", flush=True)

        results = []
        for source_lang, target_lang in pairs:
            result = run_pair(client, source_lang, target_lang, args.limit, args.dry_run, args.delay)
            results.append(result)

        total_ok  = sum(r["ok"]     for r in results)
        total_err = sum(r["errors"] for r in results)

        if len(results) > 1:
            print(f"\n{'='*60}", flush=True)
            print(f"  RÉSUMÉ{'  (passe ' + str(pass_num) + ')' if args.watch else ''}", flush=True)
            print(f"{'='*60}", flush=True)
            for r in results:
                if r["ok"] or r["errors"]:
                    print(f"  {r['pair']:8}  traduits={r['ok']:4}  erreurs={r['errors']:4}", flush=True)
            print(f"  {'─'*40}", flush=True)
            print(f"  TOTAL     traduits={total_ok:4}  erreurs={total_err:4}", flush=True)
            if total_err:
                print("\n  Relancez pour réessayer (idempotent).", flush=True)

        if not args.watch:
            break

        # En mode watch : attendre que generate_proverbs insère de nouveaux proverbes
        print(f"\n  Rien de nouveau — prochaine vérification dans {args.watch}s  (Ctrl+C pour arrêter)", flush=True)
        try:
            time.sleep(args.watch)
        except KeyboardInterrupt:
            print("\n  Arrêt.", flush=True)
            break


if __name__ == "__main__":
    main()

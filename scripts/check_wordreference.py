#!/usr/bin/env python3
"""
check_wordreference.py — Vérifie la qualité des données (sens + traduction)
en croisant chaque expression IT ou TR avec WordReference.com.

Pour chaque expression :
1. Fetche la page WR de l'expression
2. Extrait les traductions anglaises (section "Principal Translations")
3. Compare notre sens stocké avec celui de WR via Mistral
4. Produit un rapport CSV classé par divergence (MISMATCH en tête)

Usage :
    python3 scripts/check_wordreference.py --language it --limit 50
    python3 scripts/check_wordreference.py --language tr --limit 100 --output /tmp/wr_tr.csv
    python3 scripts/check_wordreference.py --language it --no-mistral   # juste fetch WR, sans verdict

Colonnes du CSV :
    id, expression, our_meaning, wr_translations, wr_qualifier, verdict, reason
    verdict : MATCH | PARTIAL | MISMATCH | NOT_FOUND | ERROR
"""

import argparse
import csv
import os
import sys
import time
import urllib.parse
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.dev")
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from config import engine

# ── Config ────────────────────────────────────────────────────────────────────

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
DELAY_SECONDS = 2.0  # politesse envers WR

WR_LANG_CODE = {"it": "iten", "tr": "tren"}

# Mots grammaticaux à supprimer de la traduction WR (bruit)
GRAMMAR_NOISE = ["vi + adj", "vi", "vtr", "vi + n", "vtr + n", "n", "adj", "vtr + adj", "loc v"]


# ── Fetch WordReference ────────────────────────────────────────────────────────

def fetch_wr(lang: str, expression: str) -> dict:
    """
    Retourne un dict :
      found       : bool
      translations: liste des traductions anglaises principales (max 4)
      qualifier   : contexte éventuel, ex. "(senza soldi)(informal)"
    """
    code = WR_LANG_CODE.get(lang)
    if not code:
        return {"found": False, "translations": [], "qualifier": ""}

    url = f"https://www.wordreference.com/{code}/{urllib.parse.quote(expression)}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
    except requests.RequestException as e:
        return {"found": False, "translations": [], "qualifier": "", "error": str(e)}

    if r.status_code == 404:
        return {"found": False, "translations": [], "qualifier": ""}

    soup = BeautifulSoup(r.text, "html.parser")
    table = soup.find("table", class_="WRD")
    if not table:
        return {"found": False, "translations": [], "qualifier": ""}

    translations = []
    qualifiers = []
    in_principal = False

    for row in table.find_all("tr"):
        row_class = row.get("class", [])

        # Détection section "Principal Translations" — classe sur le <tr>
        if "wrtopsection" in row_class:
            in_principal = True
            continue

        # Nouvelle section → on s'arrête
        if "wrtopsection" in row_class and in_principal:
            break

        # Hors section principale : skip
        if not in_principal:
            continue

        # Ligne d'en-tête langue (Italiano / Inglese)
        if "langHeader" in row_class:
            continue

        cells = row.find_all("td", recursive=False)
        if len(cells) < 3:
            continue

        # Lignes d'exemples (FrEx / ToEx) → skip
        if cells[1].get("class") and any("Ex" in c for c in cells[1].get("class", [])):
            continue
        if cells[1].get("colspan"):
            continue

        # Extraction de la traduction depuis <td class="ToWrd">
        twd = row.find("td", class_="ToWrd")
        if not twd:
            continue

        # Supprime les balises de grammaire <em class="POS2">
        for em in twd.find_all("em", class_="POS2"):
            em.decompose()
        tgt = twd.get_text(strip=True)

        if not tgt:
            continue

        # Qualificateur (registre, contexte)
        qual_cell = cells[1]
        qual = qual_cell.get_text(strip=True)

        # Sépare "be broke, be flat broke" en entrées distinctes
        parts = [p.strip() for p in tgt.split(",") if p.strip() and len(p.strip()) > 1]
        translations.extend(p for p in parts if p not in translations)

        if qual:
            qualifiers.append(qual)

        if len(translations) >= 4:
            break

    return {
        "found": bool(translations),
        "translations": translations[:4],
        "qualifier": "; ".join(dict.fromkeys(qualifiers))[:120],
    }


# ── Comparaison Mistral ────────────────────────────────────────────────────────

def compare_with_mistral(client, expression: str, our_meaning: str, wr_translations: list[str], lang: str) -> tuple[str, str]:
    """
    Retourne (verdict, raison).
    verdict : MATCH | PARTIAL | MISMATCH
    """
    lang_name = {"it": "Italian", "tr": "Turkish"}.get(lang, lang)
    wr_text = " / ".join(wr_translations)

    prompt = f"""You are a linguistics expert. Compare the meaning of this {lang_name} idiomatic expression from two sources.

Expression: "{expression}"

Source A (our database): "{our_meaning}"
Source B (WordReference): "{wr_text}"

Are these descriptions compatible? Reply EXACTLY in this format (no other text):
VERDICT: MATCH
REASON: one sentence

Use:
  MATCH   = both describe the same concept (even with different wording)
  PARTIAL = similar concept but different nuance, register, or scope
  MISMATCH = they describe contradictory or unrelated meanings"""

    try:
        resp = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=80,
            temperature=0.0,
        )
        text = resp.choices[0].message.content.strip()
        verdict = reason = ""
        for line in text.splitlines():
            if line.startswith("VERDICT:"):
                verdict = line.replace("VERDICT:", "").strip()
            elif line.startswith("REASON:"):
                reason = line.replace("REASON:", "").strip()
        return (verdict or "UNKNOWN"), (reason or text[:120])
    except Exception as e:
        return "ERROR", str(e)[:120]


# ── Chargement DB ─────────────────────────────────────────────────────────────

def load_expressions(language: str, limit: int, offset: int) -> list[dict]:
    """Charge les expressions + leur sens depuis expression_content."""
    sql = """
        SELECT e.id, e.text, ec.meaning
        FROM expressions e
        JOIN expression_content ec ON ec.expression_id = e.id AND ec.locale = e.language
        WHERE e.language = :lang
          AND e.kind != 'word'
          AND ec.meaning IS NOT NULL AND ec.meaning != ''
        ORDER BY e.id
        LIMIT :limit OFFSET :offset
    """
    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"lang": language, "limit": limit, "offset": offset}).fetchall()
    return [{"id": r.id, "text": r.text, "meaning": r.meaning} for r in rows]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Vérifie sens + traduction via WordReference")
    parser.add_argument("--language", required=True, choices=["it", "tr"], help="Langue à vérifier (it ou tr)")
    parser.add_argument("--limit", type=int, default=60, help="Nombre d'expressions à vérifier (défaut: 60)")
    parser.add_argument("--offset", type=int, default=0, help="Décalage pour reprendre (défaut: 0)")
    parser.add_argument("--output", type=str, default="", help="Fichier CSV de sortie (défaut: stdout)")
    parser.add_argument("--no-mistral", action="store_true", help="Ne pas appeler Mistral — juste fetcher WR")
    args = parser.parse_args()

    use_mistral = not args.no_mistral
    mistral_client = None
    if use_mistral:
        from mistralai import Mistral
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            print("ERROR: MISTRAL_API_KEY non défini dans .env.dev", file=sys.stderr)
            sys.exit(1)
        mistral_client = Mistral(api_key=api_key)

    print(f"Chargement des expressions {args.language.upper()} (limit={args.limit}, offset={args.offset})...", file=sys.stderr)
    expressions = load_expressions(args.language, args.limit, args.offset)
    print(f"→ {len(expressions)} expressions chargées\n", file=sys.stderr)

    fieldnames = ["id", "expression", "our_meaning", "wr_translations", "wr_qualifier", "verdict", "reason"]
    out = open(args.output, "w", newline="", encoding="utf-8") if args.output else sys.stdout
    writer = csv.DictWriter(out, fieldnames=fieldnames)
    writer.writeheader()

    results = []
    for i, expr in enumerate(expressions, 1):
        print(f"[{i:3}/{len(expressions)}] {expr['text'][:55]}", end="  ", file=sys.stderr)

        wr = fetch_wr(args.language, expr["text"])
        time.sleep(DELAY_SECONDS)

        if not wr["found"]:
            verdict, reason = "NOT_FOUND", "Expression absente de WordReference"
            print("NOT_FOUND", file=sys.stderr)
        elif not use_mistral:
            verdict, reason = "", ""
            print(f"WR: {', '.join(wr['translations'][:2])}", file=sys.stderr)
        else:
            verdict, reason = compare_with_mistral(
                mistral_client, expr["text"], expr["meaning"], wr["translations"], args.language
            )
            print(f"{verdict} — {reason[:60]}", file=sys.stderr)
            time.sleep(0.5)  # petite pause Mistral

        results.append({
            "id": expr["id"],
            "expression": expr["text"],
            "our_meaning": expr["meaning"],
            "wr_translations": " / ".join(wr["translations"]),
            "wr_qualifier": wr.get("qualifier", ""),
            "verdict": verdict,
            "reason": reason,
        })

    # Tri : MISMATCH → PARTIAL → NOT_FOUND → MATCH → reste
    ORDER = {"MISMATCH": 0, "PARTIAL": 1, "NOT_FOUND": 2, "MATCH": 3, "ERROR": 4, "UNKNOWN": 5, "": 6}
    results.sort(key=lambda r: ORDER.get(r["verdict"], 9))

    for row in results:
        writer.writerow(row)

    if args.output:
        out.close()
        print(f"\nRapport sauvegardé : {args.output}", file=sys.stderr)

    # Résumé
    from collections import Counter
    counts = Counter(r["verdict"] for r in results)
    print(f"\nRésumé : {dict(counts)}", file=sys.stderr)


if __name__ == "__main__":
    main()

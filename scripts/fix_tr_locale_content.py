#!/usr/bin/env python3
"""
BUG-005 — Supprime les lignes expression_content où locale='tr'
mais le contenu est en français ou en anglais (écrit par erreur par le script de génération).

Heuristique : une ligne est considérée "non-turque" si son champ `meaning`
ne contient aucun caractère spécifique au turc (ğ, ş, ı = dotless-i).
Ces caractères sont quasi-systématiquement présents dans tout texte turc réel.

Les traductions correctes de ces expressions existent déjà dans content_translations
(FR/EN/IT/ES), donc la suppression est sans perte d'information.

Usage :
    python3 scripts/fix_tr_locale_content.py           # dry-run sur dev
    python3 scripts/fix_tr_locale_content.py --prod    # dry-run sur prod
    python3 scripts/fix_tr_locale_content.py --execute          # exécute sur dev
    python3 scripts/fix_tr_locale_content.py --prod --execute   # exécute sur prod
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import argparse as _argparse_early
_early = _argparse_early.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()

from dotenv import load_dotenv
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

from sqlalchemy import text
from config import engine

# Caractères spécifiques au turc — absents du français et de l'anglais
TR_SPECIFIC_CHARS = 'ğĞşŞı'  # ı = dotless i (U+0131)


def is_non_turkish(meaning: str) -> bool:
    """Retourne True si le texte de sens ne contient aucun caractère turc spécifique."""
    if not meaning:
        return False
    return not any(c in TR_SPECIFIC_CHARS for c in meaning)


def detect_language(meaning: str) -> str:
    """Détection approximative de la langue pour l'affichage."""
    fr_chars = set('éèêàâëïœæ')
    if any(c in fr_chars for c in meaning):
        return 'FR'
    # Débuts typiques de l'anglais
    en_words = ('to ', 'the ', 'a ', 'an ', 'it ', 'when ', 'this ', 'that ',
                 'one ', 'who ', 'in ', 'of ', 'an expression', 'refers ', 'means ')
    if any(meaning.lower().startswith(w) for w in en_words):
        return 'EN'
    return '?'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prod', action='store_true', help='Cible la DB prod (ep-dawn-smoke)')
    parser.add_argument('--execute', action='store_true', help='Exécute la suppression (sans ce flag = dry-run)')
    args = parser.parse_args()

    env_label = 'PROD (ep-dawn-smoke)' if args.prod else 'DEV (ep-frosty-dew)'
    mode = 'EXÉCUTION' if args.execute else 'DRY-RUN'
    print(f'=== fix_tr_locale_content.py — {mode} sur {env_label} ===\n')

    with engine.connect() as conn:
        # Charger toutes les lignes expression_content locale='tr' pour expressions de langue 'tr'
        rows = conn.execute(text("""
            SELECT ec.expression_id, ec.meaning, ec.origin, ec.example
            FROM expression_content ec
            JOIN expressions e ON e.id = ec.expression_id
            WHERE ec.locale = 'tr' AND e.language = 'tr'
        """)).fetchall()

        total = len(rows)
        print(f'Total lignes locale=tr à analyser : {total}')

        bad_ids_raw = [r.expression_id for r in rows if is_non_turkish(r.meaning or '')]

        # Sécurité : exclure les expressions sans content_translations
        # (supprimer leur seule source de contenu serait une perte irréversible)
        if bad_ids_raw:
            ct_result = conn.execute(text("""
                SELECT DISTINCT expression_id
                FROM content_translations
                WHERE expression_id = ANY(:ids)
            """), {'ids': bad_ids_raw}).fetchall()
            with_translations = {r.expression_id for r in ct_result}
            excluded = [eid for eid in bad_ids_raw if eid not in with_translations]
            bad_ids = [eid for eid in bad_ids_raw if eid in with_translations]

            if excluded:
                print(f'Exclus (pas de content_translations — à régénérer manuellement) : {len(excluded)}')
                for eid in excluded:
                    print(f'  {eid}')
        else:
            bad_ids = []

        print(f'Lignes à supprimer (meaning sans ğ/ş/ı + avec content_translations) : {len(bad_ids)}\n')

        # Afficher des exemples
        print('Exemples de lignes détectées :')
        sample = min(20, len(bad_ids))
        for expr_id in bad_ids[:sample]:
            row = next(r for r in rows if r.expression_id == expr_id)
            lang = detect_language(row.meaning or '')
            print(f'  [{lang}] {expr_id}')
            print(f'       {(row.meaning or "")[:90]}')

        if not bad_ids:
            print('Rien à supprimer.')
            return

        if not args.execute:
            print(f'\nDry-run terminé — aucune modification. Relancer avec --execute pour supprimer les {len(bad_ids)} lignes.')
            return

        # Confirmation avant suppression sur prod
        if args.prod:
            confirm = input(f'\nATTENTION : suppression de {len(bad_ids)} lignes sur PROD. Confirmer ? (oui/non) : ')
            if confirm.strip().lower() != 'oui':
                print('Annulé.')
                return

        # Suppression par lots
        BATCH = 100
        deleted = 0
        for i in range(0, len(bad_ids), BATCH):
            batch = bad_ids[i:i + BATCH]
            result = conn.execute(
                text("DELETE FROM expression_content WHERE expression_id = ANY(:ids) AND locale = 'tr'"),
                {'ids': batch}
            )
            deleted += result.rowcount
            conn.commit()
            print(f'  Batch {i // BATCH + 1} : {result.rowcount} lignes supprimées ({deleted}/{len(bad_ids)} total)')

        print(f'\nTerminé — {deleted} lignes supprimées sur {env_label}.')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Test direct de l'API Resend — diagnostique le bug d'envoi email.

Usage :
    RESEND_API_KEY=re_xxxx python3 scripts/test_resend.py --to ssin@protonmail.com
    RESEND_API_KEY=re_xxxx python3 scripts/test_resend.py --to worldexpressionsapp@gmail.com

Sans RESEND_API_KEY : lit depuis les variables d'environnement déjà chargées.
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.request


def test_resend(to: str, api_key: str, from_address: str) -> None:
    print(f"  From  : {from_address}")
    print(f"  To    : {to}")
    print(f"  Key   : {api_key[:8]}...{api_key[-4:]} (longueur : {len(api_key)})")
    print()

    payload = json.dumps({
        "from": from_address,
        "to": [to],
        "subject": "Test Resend — World Expressions",
        "html": "<p>Si tu vois cet email, Resend fonctionne correctement. ✅</p>",
    }).encode()

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    # macOS Python (installeur officiel) n'a pas les certificats système — bypass SSL en local uniquement
    ctx = ssl._create_unverified_context()

    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            body = resp.read().decode()
            data = json.loads(body)
            print("SUCCESS — Resend a accepté l'email ✅")
            print(f"  ID Resend : {data.get('id', '(pas d\'id)')}")
            print()
            print("Prochaine étape : vérifier resend.com/emails pour voir s'il apparaît.")
            print("Si l'email n'arrive pas en boîte = cause B (onboarding@resend.dev limité à l'adresse du compte).")

    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"ERREUR HTTP {e.code} — Resend a rejeté la requête ❌")
        print(f"  Réponse : {body}")
        print()
        if e.code == 401:
            print("→ Cause probable : clé API invalide ou révoquée (cause C).")
            print("  Générer une nouvelle clé sur resend.com/api-keys")
        elif e.code == 403:
            print("→ Cause probable : domaine expéditeur non vérifié pour cette clé.")
        elif e.code == 422:
            print("→ Cause probable : format email invalide ou domaine expéditeur non autorisé.")
        else:
            print("→ Voir la documentation Resend : https://resend.com/docs")
        sys.exit(1)

    except urllib.error.URLError as e:
        print(f"ERREUR RÉSEAU — impossible de joindre api.resend.com ❌")
        print(f"  Détail : {e.reason}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Test direct API Resend")
    parser.add_argument("--to", required=True, help="Adresse email de destination")
    parser.add_argument(
        "--from",
        dest="from_addr",
        default=os.getenv("RESEND_FROM", "onboarding@resend.dev"),
        help="Adresse expéditeur (défaut : env RESEND_FROM ou onboarding@resend.dev)",
    )
    args = parser.parse_args()

    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        print("ERREUR : RESEND_API_KEY non définie.")
        print("Usage : RESEND_API_KEY=re_xxxx python3 scripts/test_resend.py --to <email>")
        sys.exit(1)

    print("=== Test Resend API ===")
    print()
    test_resend(args.to, api_key, args.from_addr)


if __name__ == "__main__":
    main()

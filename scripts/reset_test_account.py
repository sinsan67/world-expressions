"""
Supprime un compte utilisateur de test de la base de données.
Les tables associées (user_favorites, email_tokens) sont supprimées en cascade.

Usage :
    DATABASE_URL=<url> python3 scripts/reset_test_account.py --email ssin@protonmail.com
"""

import argparse
import os
import sys

from sqlalchemy import create_engine, text


def main() -> None:
    parser = argparse.ArgumentParser(description="Supprime un compte de test de la DB")
    parser.add_argument("--email", required=True, help="Email du compte à supprimer")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("Erreur : DATABASE_URL non défini", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(database_url)
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": args.email},
        )
        count = result.rowcount

    if count:
        print(f"Compte supprimé : {args.email} ({count} ligne)")
    else:
        print(f"Aucun compte trouvé pour : {args.email}")


if __name__ == "__main__":
    main()

"""
Configuration de la connexion base de données.
L'URL de connexion est lue depuis la variable d'environnement DATABASE_URL.
En local, elle est chargée automatiquement depuis le fichier .env (jamais commité).
En production, DATABASE_URL est définie directement dans l'environnement du serveur.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Charge .env si présent — sans effet si DATABASE_URL est déjà définie.
# ATTENTION : ce fichier charge .env (DB locale). Les scripts generate_*/translate_*/copy_* chargent
# explicitement .env.dev ou .env.prod. Pour des vérifications manuelles ciblant la DB cloud,
# faire load_dotenv('.env.dev', override=True) AVANT d'importer config.
load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://localhost/expressions_dev"  # fallback : DB locale (start.sh, dev sans .env)
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """Générateur de session — utilisé par FastAPI (dependency injection)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
Définition du schéma de base de données avec SQLAlchemy.

Chaque classe = une table PostgreSQL.
Alembic lit ce fichier pour générer les migrations SQL.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, ForeignKey, UniqueConstraint, create_engine, DateTime
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Concept(Base):
    """
    L'idée abstraite qui relie des expressions de langues différentes.
    Ex : le concept "tristesse mélancolique" relie "avoir le cafard" (fr)
    et "feeling blue" (en).
    """
    __tablename__ = "concepts"

    id   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(120), unique=True, nullable=False)

    expressions = relationship("Expression", back_populates="concept")


class Expression(Base):
    """
    Une expression dans sa langue d'origine.
    Le texte (ex: "Avoir le cafard") ne se traduit jamais — c'est un artefact culturel.
    Le contenu explicatif (sens, origine, exemple) vit dans ExpressionContent.
    """
    __tablename__ = "expressions"

    id           = Column(String(120), primary_key=True)  # kebab-case slug
    text         = Column(Text, nullable=False)            # texte original, jamais traduit
    language     = Column(String(10), nullable=False)      # ISO 639-1 : fr, en, es, ar...
    region       = Column(String(10))                      # ISO 3166-1 : fr, gb, us, au...
    register     = Column(String(20))                      # standard, informal, slang, vulgar, formal
    illustration = Column(Text)                            # URL ou code SVG
    kind         = Column(String(20), nullable=False, server_default="idiom")  # idiom | word | proverb | locution
    source       = Column(Text)                                                     # URL vers la source (TDK, Treccani...)

    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"), nullable=True)

    concept  = relationship("Concept", back_populates="expressions")
    contents = relationship("ExpressionContent", back_populates="expression", cascade="all, delete-orphan")
    tags     = relationship("Tag", secondary="expression_tags", back_populates="expressions")


class ExpressionContent(Base):
    """
    Contenu traduit d'une expression.
    Une ligne par langue : locale='fr' pour le français, 'en' pour l'anglais, etc.
    Si la traduction n'existe pas encore, on retombe sur la langue d'origine.
    """
    __tablename__ = "expression_content"

    expression_id = Column(String(120), ForeignKey("expressions.id", ondelete="CASCADE"), primary_key=True)
    locale        = Column(String(10), primary_key=True)  # ISO 639-1
    meaning       = Column(Text)
    origin        = Column(Text)
    example       = Column(Text)

    expression = relationship("Expression", back_populates="contents")


class Tag(Base):
    """
    Tag thématique, indépendant de toute langue.
    Le slug est la référence stable (ex: "animals"), le nom affiché est dans TagName.
    """
    __tablename__ = "tags"

    id   = Column(String(60), primary_key=True)   # slug anglais, ex: "animals"
    slug = Column(String(60), unique=True, nullable=False)

    names       = relationship("TagName", back_populates="tag", cascade="all, delete-orphan")
    expressions = relationship("Expression", secondary="expression_tags", back_populates="tags")


class TagName(Base):
    """Nom d'un tag dans une langue donnée. Ex: tag "animals" → "animaux" en français."""
    __tablename__ = "tag_names"

    tag_id = Column(String(60), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    locale = Column(String(10), primary_key=True)
    name   = Column(String(120), nullable=False)

    tag = relationship("Tag", back_populates="names")


class ExpressionTag(Base):
    """Table de jointure expressions ↔ tags (relation many-to-many)."""
    __tablename__ = "expression_tags"

    expression_id = Column(String(120), ForeignKey("expressions.id", ondelete="CASCADE"), primary_key=True)
    tag_id        = Column(String(60),  ForeignKey("tags.id",        ondelete="CASCADE"), primary_key=True)


class ContentTranslation(Base):
    """
    Traduction d'une expression dans une langue cible.
    Différent de ExpressionContent (contenu natif) : ici on stocke aussi
    la traduction littérale et l'équivalent idiomatique pour contextualiser
    l'expression originale pour un lecteur qui ne la connaît pas.
    """
    __tablename__ = "content_translations"

    expression_id = Column(String(120), ForeignKey("expressions.id", ondelete="CASCADE"), primary_key=True)
    target_lang   = Column(String(10), primary_key=True)  # langue cible : en, fr, es, it, tr
    meaning       = Column(Text)      # sens dans la langue cible
    literal       = Column(Text)      # traduction mot à mot
    idiomatic     = Column(Text)      # équivalent idiomatique dans la langue cible
    origin        = Column(Text)      # origine expliquée dans la langue cible
    example       = Column(Text)      # exemple d'usage dans la langue cible


class NewsletterSubscriber(Base):
    """Abonné à la newsletter — une expression par jour."""
    __tablename__ = "newsletter_subscribers"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), unique=True, nullable=False)
    language   = Column(String(10), nullable=False, server_default="en")  # langue préférée : fr, en, es, it, tr
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

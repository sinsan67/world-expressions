"""
Définition du schéma de base de données avec SQLAlchemy.

Chaque classe = une table PostgreSQL.
Alembic lit ce fichier pour générer les migrations SQL.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, Float, ForeignKey, String, Text,
    UniqueConstraint, DateTime
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
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

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug    = Column(String(120), unique=True, nullable=False)
    name_fr = Column(String)  # legacy — conservé en DB, non utilisé activement

    expressions = relationship("Expression", back_populates="concept")


class Country(Base):
    """Référentiel des pays (ISO 3166-1 alpha-2). Ex: fr, uk, us."""
    __tablename__ = "countries"

    code    = Column(String(10), primary_key=True)
    name_en = Column(String(100), nullable=False)

    expressions = relationship("Expression", back_populates="country_ref",
                               foreign_keys="Expression.country")
    regions     = relationship("Region", back_populates="country_ref")
    languages   = relationship("CountryLanguage", back_populates="country_ref")


class CountryLanguage(Base):
    """Jonction pays ↔ langues. Ex: Canada → [fr, en]."""
    __tablename__ = "country_languages"

    country_code  = Column(String(10), ForeignKey("countries.code", ondelete="CASCADE"), primary_key=True)
    language_code = Column(String(10), primary_key=True)

    country_ref = relationship("Country", back_populates="languages")


class Region(Base):
    """Sous-régions rattachées à un pays (alsace, bretagne...)."""
    __tablename__ = "regions"

    code         = Column(String(50), primary_key=True)
    country_code = Column(String(10), ForeignKey("countries.code", ondelete="SET NULL"), nullable=True)
    name_en      = Column(String(100), nullable=False)

    country_ref = relationship("Country", back_populates="regions")
    expressions = relationship("Expression", back_populates="region_ref",
                               foreign_keys="Expression.region")


class Expression(Base):
    """
    Une expression dans sa langue d'origine.
    Le texte (ex: "Avoir le cafard") ne se traduit jamais — c'est un artefact culturel.
    Le contenu explicatif (sens, origine, exemple) vit dans ExpressionContent.
    """
    __tablename__ = "expressions"

    id           = Column(String(120), primary_key=True)
    text         = Column(Text, nullable=False)
    language     = Column(String(10), nullable=False)
    country      = Column(String(20), ForeignKey("countries.code", ondelete="SET NULL"), nullable=False)
    region       = Column(String(10), ForeignKey("regions.code",  ondelete="SET NULL"))
    register     = Column(String(20))
    illustration = Column(Text)
    kind         = Column(String(20), nullable=False, server_default="idiom")
    source       = Column(Text)
    # legacy columns — present in DB, kept to avoid accidental drops via autogenerate
    literal_fr         = Column(Text)
    rationale          = Column(Text)
    concept_confidence = Column(Float)

    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"), nullable=True)

    concept     = relationship("Concept", back_populates="expressions")
    country_ref = relationship("Country", back_populates="expressions",
                               foreign_keys=[country])
    region_ref  = relationship("Region", back_populates="expressions",
                               foreign_keys=[region])
    contents    = relationship("ExpressionContent", back_populates="expression",
                               cascade="all, delete-orphan")
    tags        = relationship("Tag", secondary="expression_tags", back_populates="expressions")


class ExpressionContent(Base):
    """
    Contenu traduit d'une expression.
    Une ligne par langue : locale='fr' pour le français, 'en' pour l'anglais, etc.
    Si la traduction n'existe pas encore, on retombe sur la langue d'origine.
    """
    __tablename__ = "expression_content"

    expression_id = Column(String(120), ForeignKey("expressions.id", ondelete="CASCADE"), primary_key=True)
    locale        = Column(String(10), primary_key=True)
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

    id   = Column(String(60), primary_key=True)
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
    target_lang   = Column(String(10), primary_key=True)
    meaning       = Column(Text)
    literal       = Column(Text)
    idiomatic     = Column(Text)
    origin        = Column(Text)
    example       = Column(Text)


class User(Base):
    """Compte utilisateur créé via Google OAuth ou inscription email."""
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id     = Column(String(255), unique=True, nullable=True)   # nullable pour les comptes email
    email         = Column(String(255), unique=True, nullable=False)
    name          = Column(String(255))
    avatar_url    = Column(Text)
    ui_lang       = Column(String(10), nullable=False, server_default="en")
    created_at    = Column(DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    # Auth email
    password_hash  = Column(Text)
    email_verified = Column(Boolean, nullable=False, server_default="false")
    # Préférences utilisateur
    explore_mode  = Column(String(20), nullable=False, server_default="multilingual")
    learning_langs = Column(ARRAY(String(10)), nullable=False, server_default="{}")
    content_type  = Column(String(20), nullable=False, server_default="all")
    native_lang   = Column(String(10))
    user_goal     = Column(String(30))

    favorites = relationship("UserFavorite", back_populates="user",
                             cascade="all, delete-orphan")


class UserFavorite(Base):
    """Expression mise en favori par un utilisateur connecté."""
    __tablename__ = "user_favorites"

    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    expression_id = Column(String(120), ForeignKey("expressions.id", ondelete="CASCADE"), primary_key=True)
    saved_at      = Column(DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="favorites")


class EmailToken(Base):
    """Token à usage unique pour vérification email et réinitialisation de mot de passe."""
    __tablename__ = "email_tokens"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token      = Column(String(64), unique=True, nullable=False)
    purpose    = Column(String(16), nullable=False)  # 'verify' | 'reset'
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, nullable=False, server_default="false")


class ConceptDomain(Base):
    """Assigne un tag thématique à 1-2 domaines parmi 13 (populé via Mistral)."""
    __tablename__ = "concept_domains"

    tag_id      = Column(String(60), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    domain_slug = Column(String(30), nullable=False, primary_key=True)

    tag = relationship("Tag")


class NewsletterSubscriber(Base):
    """Abonné à la newsletter — une expression par jour."""
    __tablename__ = "newsletter_subscribers"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), unique=True, nullable=False)
    language   = Column(String(10), nullable=False, server_default="en")
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))

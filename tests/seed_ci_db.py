"""
Seeds a minimal but representative dataset into a THROWAWAY Postgres instance
(never a remote/dev/prod DB) so that the full pytest suite can run against a
real Postgres, matching this project's test setup (tests hit a live FastAPI
server backed by Postgres; there is no metadata-only / sqlite mode).

Used by the backend-tests CI job (service container) after `alembic upgrade
head`. Run from the repo root with DATABASE_URL pointing at the throwaway DB:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expressions_test \
        python3 tests/seed_ci_db.py
"""
import os
import sys

# rely on cwd being the repo root (config.py lives there)
sys.path.insert(0, os.getcwd())

from sqlalchemy import text
from config import engine

COUNTRIES = [
    ("fr", "France"),
    ("uk", "United Kingdom"),
    ("tr", "Turkey"),
    ("jp", "Japan"),
]
COUNTRY_LANGUAGES = [
    ("fr", "fr"),
    ("uk", "en"),
    ("tr", "tr"),
    ("jp", "ja"),
]

TAGS = [
    "sadness", "money", "body", "honesty", "patience", "misc",
    "frugality", "decision", "timing", "shortcuts", "character",
    "business", "energy", "bluntness", "mood",
]

TAG_NAMES = {
    "sadness": {"en": "sadness", "fr": "tristesse"},
    "money": {"en": "money", "fr": "argent"},
}

# tag -> domain_slug
CONCEPT_DOMAINS = [
    ("sadness", "emotions"),
]

# id, text, language, country, register, kind, tags, meaning, origin, example
EXPRESSIONS = [
    (
        "avoir-le-cafard", "Avoir le cafard", "fr", "fr", "informal", "idiom",
        ["sadness"],
        "Se sentir triste, avoir des idées noires, ressentir de la mélancolie.",
        "Popularisée par Baudelaire au XIXe siècle.",
        "Depuis qu'il pleut sans arrêt, j'ai le cafard.",
    ),
    (
        "jeter-son-argent-par-les-fenetres", "Jeter son argent par les fenêtres", "fr", "fr", "standard", "idiom",
        ["money"],
        "Dépenser sans compter, gaspiller de l'argent.",
        "Image du geste absurde de jeter des pièces par la fenêtre.",
        "Il jette son argent par les fenêtres depuis qu'il a gagné au loto.",
    ),
    (
        "avoir-un-chat-dans-la-gorge", "Avoir un chat dans la gorge", "fr", "fr", "informal", "idiom",
        ["body"],
        "Avoir la voix enrouée, avoir du mal à parler clairement.",
        "Sensation d'irritation dans la gorge comparée à la présence d'un chat.",
        "Excuse-moi, j'ai un chat dans la gorge ce matin.",
    ),
    (
        "appeler-un-chat-un-chat", "Appeler un chat un chat", "fr", "fr", "standard", "idiom",
        ["honesty"],
        "Dire les choses clairement, sans détour.",
        "Expression classique de franc-parler, attestée depuis le XVIIe siècle.",
        "Il faut appeler un chat un chat : ce projet est un échec.",
    ),
    (
        "mettre-les-pieds-dans-le-plat", "Mettre les pieds dans le plat", "fr", "fr", "informal", "idiom",
        ["bluntness"],
        "Aborder une question délicate sans tact, gaffer.",
        "Image culinaire du geste maladroit et grossier.",
        "Il a encore mis les pieds dans le plat en posant cette question.",
    ),
    (
        "se-lever-du-pied-gauche", "Se lever du pied gauche", "fr", "fr", "informal", "idiom",
        ["mood"],
        "Être de mauvaise humeur dès le matin, mal commencer sa journée.",
        "Croyance populaire associant le pied gauche à la malchance.",
        "Il a dû se lever du pied gauche, il est agressif depuis ce matin.",
    ),
    (
        "petit-a-petit-loiseau-fait-son-nid", "Petit à petit, l'oiseau fait son nid", "fr", "fr", "standard", "proverb",
        ["patience"],
        "À force de patience et de petits efforts, on arrive à ses fins.",
        "Proverbe populaire français.",
        "Continue comme ça : petit à petit, l'oiseau fait son nid.",
    ),
    (
        "quant-a-moi", "Quant à moi", "fr", "fr", "formal", "locution",
        ["misc"],
        "En ce qui me concerne.",
        "Locution figée introduisant un point de vue personnel.",
        "Quant à moi, je préfère partir tôt.",
    ),
    (
        "avoir-la-peche", "Avoir la pêche", "fr", "fr", "slang", "idiom",
        ["energy"],
        "Être plein d'énergie, être en forme.",
        "Expression familière moderne.",
        "Ce matin j'ai la pêche !",
    ),
    (
        "make-do-and-mend", "Make do and mend", "en", "uk", "standard", "idiom",
        ["frugality"],
        "To manage with what you have and repair rather than replace.",
        "Popularised as a UK wartime rationing slogan.",
        "During the shortage, everyone had to make do and mend.",
    ),
    (
        "make-up-your-mind", "Make up your mind", "en", "uk", "standard", "idiom",
        ["decision"],
        "To decide something definitely.",
        "Common English idiom about resolving indecision.",
        "You need to make up your mind before the shop closes.",
    ),
    (
        "the-early-bird-catches-the-worm", "The early bird catches the worm", "en", "uk", "standard", "proverb",
        ["timing"],
        "Success comes to those who prepare well and act promptly.",
        "Traditional English proverb.",
        "She always arrives first — the early bird catches the worm.",
    ),
    (
        "cut-corners", "Cut corners", "en", "uk", "slang", "idiom",
        ["shortcuts"],
        "To do something in the easiest, cheapest or fastest way, often sacrificing quality.",
        "Originates from the idea of taking a shorter, less careful path.",
        "They cut corners on the renovation and it shows.",
    ),
    (
        "agzi-var-dili-yok", "Ağzı var dili yok", "tr", "tr", "informal", "idiom",
        ["character"],
        "Aşırı derecede sessiz, çekingen biri için kullanılır.",
        "Geleneksel bir Türkçe deyim.",
        "O kadar sessiz ki, ağzı var dili yok.",
    ),
    (
        "damlaya-damlaya-gol-olur", "Damlaya damlaya göl olur", "tr", "tr", "standard", "proverb",
        ["patience"],
        "Küçük birikimler zamanla büyük bir bütün oluşturur.",
        "Türk atasözü.",
        "Her gün biraz çalış: damlaya damlaya göl olur.",
    ),
    (
        "neko-no-te-mo-karitai", "猫の手も借りたい", "ja", "jp", "informal", "idiom",
        ["business"],
        "とても忙しくて、誰の助けでも欲しいこと。",
        "日本の伝統的な表現。",
        "繁忙期は猫の手も借りたいほど忙しい。",
    ),
]


def main() -> None:
    with engine.begin() as conn:
        for code, name in COUNTRIES:
            conn.execute(text(
                "INSERT INTO countries (code, name_en) VALUES (:c, :n) ON CONFLICT DO NOTHING"
            ), {"c": code, "n": name})
        for country_code, lang in COUNTRY_LANGUAGES:
            conn.execute(text(
                "INSERT INTO country_languages (country_code, language_code) VALUES (:c, :l) ON CONFLICT DO NOTHING"
            ), {"c": country_code, "l": lang})
        for slug in TAGS:
            conn.execute(text(
                "INSERT INTO tags (id, slug) VALUES (:s, :s) ON CONFLICT DO NOTHING"
            ), {"s": slug})
        for slug, names in TAG_NAMES.items():
            for locale, name in names.items():
                conn.execute(text(
                    "INSERT INTO tag_names (tag_id, locale, name) VALUES (:s, :l, :n) ON CONFLICT DO NOTHING"
                ), {"s": slug, "l": locale, "n": name})
        for tag_slug, domain_slug in CONCEPT_DOMAINS:
            conn.execute(text(
                "INSERT INTO concept_domains (tag_id, domain_slug) VALUES (:t, :d) ON CONFLICT DO NOTHING"
            ), {"t": tag_slug, "d": domain_slug})

        for expr_id, expr_text, language, country, register, kind, tags, meaning, origin, example in EXPRESSIONS:
            conn.execute(text("""
                INSERT INTO expressions (id, text, language, country, register, kind)
                VALUES (:id, :text, :language, :country, :register, :kind)
                ON CONFLICT DO NOTHING
            """), {
                "id": expr_id, "text": expr_text, "language": language,
                "country": country, "register": register, "kind": kind,
            })
            conn.execute(text("""
                INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
                VALUES (:id, :locale, :meaning, :origin, :example)
                ON CONFLICT DO NOTHING
            """), {
                "id": expr_id, "locale": language,
                "meaning": meaning, "origin": origin, "example": example,
            })
            for tag_slug in tags:
                conn.execute(text(
                    "INSERT INTO expression_tags (expression_id, tag_id) VALUES (:e, :t) ON CONFLICT DO NOTHING"
                ), {"e": expr_id, "t": tag_slug})

    print(f"Seeded {len(EXPRESSIONS)} expressions, {len(COUNTRIES)} countries, {len(TAGS)} tags.")


if __name__ == "__main__":
    main()

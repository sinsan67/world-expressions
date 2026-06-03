"""
Seed script — Expressions d'Alsace
Inserts 36 Alsace expressions into the DB with region="alsace".
All expressions are language="fr" (Alsatian words embedded in French speech).
Section tags prefixed with "als-" are used for page filtering.

Usage:
    python3 scripts/seed_alsace.py          # dev DB (.env.dev)
    python3 scripts/seed_alsace.py --prod   # prod DB (.env.prod)
"""

import argparse
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Load the correct env file before importing config
parser = argparse.ArgumentParser()
parser.add_argument("--prod", action="store_true")
args = parser.parse_args()

env_file = ".env.prod" if args.prod else ".env.dev"
if not os.path.exists(env_file):
    print(f"ERROR: {env_file} not found. Run from project root.")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(env_file)

from sqlalchemy import text
from config import engine

# ─── Data ────────────────────────────────────────────────────────────────────
# Tags: (slug, name_fr, name_en)
ALL_TAGS = [
    ("affection",      "Affection",          "Affection"),
    ("boire",          "Boire",              "Drinking"),
    ("etat",           "État",               "State"),
    ("objet",          "Objet",              "Object"),
    ("germanisme",     "Germanisme",         "Germanism"),
    ("maison",         "Maison",             "Home"),
    ("parole",         "Parole",             "Speech"),
    ("nourriture",     "Nourriture",         "Food"),
    ("gastronomie",    "Gastronomie",        "Gastronomy"),
    ("vin",            "Vin",                "Wine"),
    ("humour",         "Humour",             "Humour"),
    ("vetement",       "Vêtement",           "Clothing"),
    ("couleur",        "Couleur",            "Colour"),
    ("boulangerie",    "Boulangerie",        "Bakery"),
    ("restauration",   "Restauration",       "Restaurant"),
    ("saucisse",       "Saucisse",           "Sausage"),
    ("elan",           "Élan",               "Momentum"),
    ("sante",          "Santé",              "Health"),
    ("surprise",       "Surprise",           "Surprise"),
    ("repas",          "Repas",              "Meal"),
    ("politesse",      "Politesse",          "Politeness"),
    ("salutation",     "Salutation",         "Greeting"),
    ("melange",        "Mélange",            "Blend"),
    ("grammaire",      "Grammaire",          "Grammar"),
    ("tic-verbal",     "Tic verbal",         "Verbal tic"),
    ("superstition",   "Superstition",       "Superstition"),
    ("voiture",        "Voiture",            "Car"),
    ("fatigue",        "Fatigue",            "Fatigue"),
    # Section tags (internal, used by /regions page for filtering)
    ("als-quotidien",   "Mots du quotidien", "Everyday words"),
    ("als-table",       "À table",           "At the table"),
    ("als-interjection","Interjections",     "Interjections"),
    ("als-calque",      "Français d'Alsace", "Alsatian French"),
]

# Expressions: each dict has the keys needed for DB insertion
EXPRESSIONS = [
    # ─── Section 1 : Mots du quotidien ──────────────────────────────────────
    {
        "id": "faire-un-schmutz",
        "text": "Faire un schmutz",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "locution",
        "meaning": "Faire un bisou, un baiser rapide",
        "origin": "Du germanique Schmutz. Un schmutz, c'est le baiser qu'on donne à mamie en partant ou à un enfant en passant. La partie gênante, c'est d'expliquer le mot à un Parisien.",
        "tags": ["affection", "als-quotidien"],
    },
    {
        "id": "prendre-un-schluk",
        "text": "Prendre un schluk",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "locution",
        "meaning": "Boire une gorgée",
        "origin": "De l'allemand Schluck. « Tu veux un schluk de riesling ? » s'entend naturellement en français alsacien. Un Parisien entendra la question et comprendra qu'il est en voyage.",
        "tags": ["boire", "als-quotidien"],
    },
    {
        "id": "etre-schlass",
        "text": "Être schlass",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "idiom",
        "meaning": "Être fatigué, mou, sans énergie",
        "origin": "De l'allemand schlaff (flasque). Peut aussi désigner un état légèrement alcoolisé — le contexte tranche. Dans les deux cas, mieux vaut ne pas avoir un rendez-vous important l'après-midi.",
        "tags": ["fatigue", "etat", "als-quotidien"],
    },
    {
        "id": "le-foehn",
        "text": "Le foehn",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le sèche-cheveux",
        "origin": "En Alsace, le « sèche-cheveux » n'existe pas. Tout le monde a un Föhn. À l'origine, c'est un vent chaud et sec qui descend des Alpes — le nom a migré vers l'appareil qui fait la même chose, en plus bruyant et moins romantique.",
        "tags": ["objet", "germanisme", "als-quotidien"],
    },
    {
        "id": "les-schloppas",
        "text": "Les schloppas",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Les pantoufles, les chaussons",
        "origin": "Incontournables dans les foyers alsaciens. On enlève ses chaussures à l'entrée et on enfile ses schloppas — règle non écrite mais absolument universelle. Variantes régionales : schlappa, schlopp.",
        "tags": ["maison", "als-quotidien"],
    },
    {
        "id": "ratcher",
        "text": "Ratcher",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Papoter, cancaner, tailler une bavette",
        "origin": "De l'alsacien Ratscha. « On a ratché une bonne heure devant la boulangerie. » Connotation conviviale plutôt que médisante — on ratch entre voisins, pas contre eux.",
        "tags": ["parole", "als-quotidien"],
    },
    {
        "id": "un-stuck",
        "text": "Un stück",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Un morceau, une part",
        "origin": "De l'allemand Stück (pièce). « Tu veux un stück de kugelhopf ? » — la question rituelle chez mamie alsacienne à laquelle la bonne réponse est toujours oui.",
        "tags": ["nourriture", "als-quotidien"],
    },
    {
        "id": "le-knack",
        "text": "Le knack",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "La saucisse de Strasbourg",
        "origin": "Son nom vient du bruit qu'elle fait quand on croque dans son boyau naturel. Symbole culinaire de la région, servie avec de la choucroute ou dans un petit pain — le fast food alsacien, depuis toujours.",
        "tags": ["gastronomie", "saucisse", "als-quotidien"],
    },
    {
        "id": "le-cornet",
        "text": "Le cornet",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le sac plastique (ou en papier)",
        "origin": "En Alsace, on met ses courses dans un cornet. Hors de la région, « tu as un cornet ? » peut déclencher des regards perplexes — voire une proposition de glace à l'italienne.",
        "tags": ["objet", "als-quotidien"],
    },
    {
        "id": "la-tirette",
        "text": "La tirette",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "La fermeture éclair",
        "origin": "« Ma tirette est cassée » — parfaitement compris par tout Alsacien, mystérieux ailleurs. Le mot décrit bien le geste : on tire. Une logique imparable que Paris n'a pas suivie.",
        "tags": ["objet", "als-quotidien"],
    },
    {
        "id": "suffig",
        "text": "Süffig",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Qui se laisse boire, agréable et facile à boire",
        "origin": "Un riesling süffig, c'est le compliment suprême : il glisse tout seul, sans effort, presque sans s'en rendre compte — ce qui peut expliquer certaines fins de repas de famille.",
        "tags": ["vin", "als-quotidien"],
    },
    {
        "id": "une-schnapsidee",
        "text": "Une schnapsidee",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Une idée farfelue, un plan loufoque",
        "origin": "Littéralement « idée de gnôle » — l'idée brillante qu'on a après le troisième verre. Utilisé avec affection autant qu'avec ironie. Si quelqu'un traite votre projet de schnapsidee, prenez-le comme un compliment ambigu.",
        "tags": ["humour", "als-quotidien"],
    },
    {
        "id": "la-finette",
        "text": "La finette",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le marcel, le maillot de corps",
        "origin": "Curiosité : ce mot ne vient pas de l'allemand. À l'origine, c'était le nom d'un tissu. En Alsace, on ne connaissait pas tous les mots du français parisien — « alors on a pris des mots parisiens pour faire français » (Mathieu Avanzi). Un emprunt qui a manqué sa cible.",
        "tags": ["vetement", "als-quotidien"],
    },
    {
        "id": "brun",
        "text": "Brun",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "La couleur marron",
        "origin": "En Alsace, on dit « brun » là où le reste de la France dit « marron ». « Marron », ici, évoque spontanément les marchands de marrons chauds du marché de Noël — une vocation bien plus noble qu'une simple couleur.",
        "tags": ["couleur", "als-quotidien"],
    },

    # ─── Section 2 : À table ─────────────────────────────────────────────────
    {
        "id": "le-petit-pain",
        "text": "Le petit pain",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le pain au chocolat",
        "origin": "Le grand oublié du débat chocolatine/pain au chocolat. Pendant que le reste de la France se déchire, l'Alsace observe poliment — et appelle ça « un petit pain » depuis toujours. C'est l'usage originel, conservé en périphérie.",
        "tags": ["boulangerie", "als-table"],
    },
    {
        "id": "l-escargot",
        "text": "L'escargot",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le pain aux raisins",
        "origin": "Logique imparable : ça ressemble à un escargot. L'Alsace l'a bien cherché avec sa façon de nommer les choses exactement pour ce qu'elles sont.",
        "tags": ["boulangerie", "als-table"],
    },
    {
        "id": "le-doner",
        "text": "Le döner",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Le kebab",
        "origin": "On peut s'entendre avec une bonne partie du reste de la France : döner ou kebab, tout le monde se comprend. Par contre, « un grec » ? Jamais. Strasbourg a sa terminologie, elle s'y tient.",
        "tags": ["restauration", "als-table"],
    },
    {
        "id": "manger-des-gendarmes",
        "text": "Manger des gendarmes",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "idiom",
        "meaning": "Manger des saucisses (type cervelas ou landjaeger)",
        "origin": "À ne surtout pas annoncer à voix haute hors d'Alsace. « J'aurais bien mangé deux-trois gendarmes » peut générer une visite domiciliaire à six heures du matin. En Alsace, c'est juste la collation.",
        "tags": ["humour", "saucisse", "als-table"],
    },
    {
        "id": "la-tarte-flambee",
        "text": "La tarte flambée",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "La flammekuche",
        "origin": "L'Alsacien a ici pris le contre-pied du reste de la France : il préfère le nom français « tarte flambée » à l'alsacien « flammekuche » — pendant que les restaurants parisiens font l'inverse pour paraître authentiques.",
        "tags": ["gastronomie", "als-table"],
    },

    # ─── Section 3 : Interjections ───────────────────────────────────────────
    {
        "id": "hopla",
        "text": "Hopla !",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Allez ! En avant ! On y va !",
        "origin": "L'interjection alsacienne par excellence. Peut exprimer l'élan, l'entrain, la surprise bienveillante, ou simplement meubler le silence au moment d'agir. Intraduisible avec la même énergie compacte.",
        "tags": ["elan", "als-interjection"],
    },
    {
        "id": "hopla-geiss",
        "text": "Hopla Geiss !",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Allez, c'est parti ! (litt. « allez, la chèvre ! »)",
        "origin": "Version renforcée de hopla. La chèvre (Geiss) incarne l'énergie un peu brouillonne et l'enthousiasme débordant. Pour les grandes occasions qui méritent plus qu'un simple hopla.",
        "tags": ["elan", "als-interjection"],
    },
    {
        "id": "gsundheit",
        "text": "Gsundheit !",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "À vos souhaits ! / Santé !",
        "origin": "De l'allemand Gesundheit (santé). Après un éternuement, mais aussi pour trinquer. En Alsace, la santé est une obsession bienveillante — chaque conversation se termine souvent par « et surtout, la santé ! »",
        "tags": ["sante", "als-interjection"],
    },
    {
        "id": "oh-bab",
        "text": "Oh bab !",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "word",
        "meaning": "Tiens donc ! Quelle surprise !",
        "origin": "Interjection d'étonnement chaleureuse. « Oh bab, tu es déjà là ! » — la surprise sincère de quelqu'un qui vous attendait mais pas si tôt. Toujours bienveillant, jamais accusateur.",
        "tags": ["surprise", "als-interjection"],
    },
    {
        "id": "a-guata",
        "text": "A Guata !",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "Bon appétit ! (litt. « un bon ! »)",
        "origin": "Rituel de table obligatoire. La réponse codifiée est A Bessra — « meilleur appétit ». Ne pas répondre est remarqué. Ne pas dire a guata est impensable.",
        "tags": ["repas", "als-interjection"],
    },
    {
        "id": "service",
        "text": "Service !",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "word",
        "meaning": "De rien (en réponse à un merci)",
        "origin": "Vient probablement de l'allemand Bitte (je vous en prie). Étrange la première fois qu'on l'entend, puis touchant, puis absolument indispensable. « Merci ! » → « Service ! » — transaction complète.",
        "tags": ["politesse", "als-interjection"],
    },

    # ─── Section 4 : Français d'Alsace (calques) ────────────────────────────
    {
        "id": "ca-gehts",
        "text": "Ça geht's ?",
        "language": "fr",
        "region": "alsace",
        "register": "informal",
        "kind": "locution",
        "meaning": "Ça va ?",
        "origin": "Mélange spontané de français et d'alsacien (geht's = ça marche ?). Pas un effort de bilinguisme — juste la salutation naturelle entre voisins. Le welsch-alémanique à l'état pur.",
        "tags": ["salutation", "melange", "als-calque"],
    },
    {
        "id": "ou-bien",
        "text": "Ou bien ?",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "N'est-ce pas ? Tu vois ? (en fin de phrase)",
        "origin": "Calque de l'allemand oder?. Ponctue les phrases pour chercher l'approbation. « C'était bien, ou bien ? » Signature sonore absolue du parler alsacien — les Alsaciens eux-mêmes ne s'en rendent pas compte.",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "comme-dit",
        "text": "Comme dit…",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Tic verbal de transition en début de phrase",
        "origin": "Vient de l'allemand wie gesagt. 100 % alsacien — « ça ne fonctionne pas du tout en français standard » (Mathieu Avanzi). « C'est pourtant une expression tellement utile, elle n'a pas forcément d'équivalent : même ‘du coup’ ne la remplace pas vraiment. »",
        "tags": ["grammaire", "tic-verbal", "als-calque"],
    },
    {
        "id": "venir-avec",
        "text": "Venir avec",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Accompagner quelqu'un, venir aussi",
        "origin": "Calque de l'allemand mitkommen. « J'ai vu Marie, elle vient avec. » En Alsace, le sens est limpide. Le « avec » orphelin laisse le Français de l'intérieur dans un vide grammatical inconfortable.",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "tenir-les-pouces",
        "text": "Tenir les pouces",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Croiser les doigts (pour porter chance)",
        "origin": "Calque de l'allemand Daumen drücken (presser le pouce). Le geste est différent : on serre le pouce dans la paume. Pas de croisement de doigts — la même intention, un autre geste.",
        "tags": ["superstition", "als-calque"],
    },
    {
        "id": "avoir-un-plat",
        "text": "Avoir un plat",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "idiom",
        "meaning": "Avoir un pneu crevé",
        "origin": "De l'allemand einen Platten haben. Hors d'Alsace, « j'ai un plat » évoque la cuisine. En Alsace, ça veut dire qu'on va être en retard et qu'on doit appeler quelqu'un.",
        "tags": ["voiture", "als-calque"],
    },
    {
        "id": "il-a-anniversaire",
        "text": "Il a anniversaire",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "C'est son anniversaire",
        "origin": "Calque direct de Er hat Geburtstag. En allemand, on « a » un anniversaire ; en français standard, on le « fête ». L'Alsace, elle, l'a — et trouve la question absurde, ou bien ?",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "chercher-quelquun",
        "text": "Chercher quelqu'un",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Aller chercher quelqu'un, le récupérer",
        "origin": "De l'allemand jemanden abholen. « Je viens te chercher à 18h » = je passe te prendre. En français standard, « chercher seul » est ambigu — en Alsace, le sens est limpide et la voiture est garée devant.",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "jattends-sur-le-bus",
        "text": "J'attends sur le bus",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "J'attends le bus",
        "origin": "Calque de l'allemand ich warte auf den Bus — « auf » (sur) se traduit littéralement. En français standard, ça implique d'être monté dessus. Si vous dites ça à Lyon, on vous suggérera poliment de descendre.",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "ca-tire",
        "text": "Ça tire",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Il y a un courant d'air",
        "origin": "De l'allemand es zieht (ça tire). À utiliser impérativement avec un regard vers la fenêtre ouverte et un léger frémissement. La réponse habituelle : « c'est égal » — qui signifie « ça m'est égal, j'ai froid aussi ».",
        "tags": ["grammaire", "als-calque"],
    },
    {
        "id": "ils-veulent-de-la-pluie",
        "text": "Ils veulent de la pluie",
        "language": "fr",
        "region": "alsace",
        "register": "standard",
        "kind": "locution",
        "meaning": "Il va pleuvoir (dit par la météo)",
        "origin": "Construction impersonnelle calquée de l'allemand où « ils » peut renvoyer à un sujet imprécis. En Alsace, « ils veulent de la pluie » s'entend sans que personne demande qui sont ces « ils » mystérieux.",
        "tags": ["grammaire", "als-calque"],
    },
]

# ─── Insert logic ─────────────────────────────────────────────────────────────

def run():
    with engine.connect() as conn:
        # 1. Insert tags
        print("Inserting tags...")
        for slug, name_fr, name_en in ALL_TAGS:
            conn.execute(text("""
                INSERT INTO tags (id, slug)
                VALUES (:id, :slug)
                ON CONFLICT DO NOTHING
            """), {"id": slug, "slug": slug})
            for locale, name in [("fr", name_fr), ("en", name_en)]:
                conn.execute(text("""
                    INSERT INTO tag_names (tag_id, locale, name)
                    VALUES (:tag_id, :locale, :name)
                    ON CONFLICT DO NOTHING
                """), {"tag_id": slug, "locale": locale, "name": name})

        # 2. Insert expressions + content + tags
        inserted = 0
        skipped = 0

        for expr in EXPRESSIONS:
            existing = conn.execute(
                text("SELECT id FROM expressions WHERE id = :id"),
                {"id": expr["id"]}
            ).fetchone()

            if existing:
                skipped += 1
                continue

            conn.execute(text("""
                INSERT INTO expressions
                    (id, text, language, region, register, kind, source)
                VALUES
                    (:id, :text, :language, :region, :register, :kind, :source)
            """), {
                "id":       expr["id"],
                "text":     expr["text"],
                "language": expr["language"],
                "region":   expr["region"],
                "register": expr["register"],
                "kind":     expr["kind"],
                "source":   "spike-alsace.html",
            })

            conn.execute(text("""
                INSERT INTO expression_content
                    (expression_id, locale, meaning, origin, example)
                VALUES
                    (:expression_id, :locale, :meaning, :origin, :example)
                ON CONFLICT DO NOTHING
            """), {
                "expression_id": expr["id"],
                "locale":        "fr",
                "meaning":       expr["meaning"],
                "origin":        expr.get("origin", ""),
                "example":       None,
            })

            for tag_slug in expr["tags"]:
                conn.execute(text("""
                    INSERT INTO expression_tags (expression_id, tag_id)
                    VALUES (:expression_id, :tag_id)
                    ON CONFLICT DO NOTHING
                """), {"expression_id": expr["id"], "tag_id": tag_slug})

            inserted += 1

        conn.commit()

    db_label = "PROD" if args.prod else "dev"
    print(f"\nDone [{db_label}]")
    print(f"  Inserted : {inserted}")
    print(f"  Skipped  : {skipped} (already in DB)")
    print(f"  Total    : {len(EXPRESSIONS)} expressions")


if __name__ == "__main__":
    run()

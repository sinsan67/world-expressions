"""
Seed script — Expressions de Bretagne
Inserts 42 Breton expressions into the DB with region="bretagne".
All expressions are language="fr" (Breton words embedded in French speech).
Section tags prefixed with "brt-" are used for page filtering.

Usage:
    python3 scripts/seed_bretagne.py          # dev DB (.env.dev)
    python3 scripts/seed_bretagne.py --prod   # prod DB (.env.prod)
"""

import argparse
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

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

# ─── Tags ─────────────────────────────────────────────────────────────────────
ALL_TAGS = [
    ("musique",         "Musique",           "Music"),
    ("fete",            "Fête",              "Celebration"),
    ("danse",           "Danse",             "Dance"),
    ("langue",          "Langue",            "Language"),
    ("identite",        "Identité",          "Identity"),
    ("juron",           "Juron",             "Exclamation"),
    ("mer",             "Mer",               "Sea"),
    ("peche",           "Pêche",             "Fishing"),
    ("meteo",           "Météo",             "Weather"),
    ("vent",            "Vent",              "Wind"),
    ("navigation",      "Navigation",        "Navigation"),
    ("danger",          "Danger",            "Danger"),
    ("courage",         "Courage",           "Courage"),
    ("difficulte",      "Difficulté",        "Difficulty"),
    ("gastronomie",     "Gastronomie",       "Gastronomy"),
    ("nourriture",      "Nourriture",        "Food"),
    ("boisson",         "Boisson",           "Drink"),
    ("crepe",           "Crêpe",             "Crêpe"),
    ("beurre",          "Beurre",            "Butter"),
    ("tradition",       "Tradition",         "Tradition"),
    ("pluie",           "Pluie",             "Rain"),
    ("geographie",      "Géographie",        "Geography"),
    ("ruralite",        "Ruralité",          "Rural life"),
    ("vetement",        "Vêtement",          "Clothing"),
    ("humour",          "Humour",            "Humour"),
    ("salutation",      "Salutation",        "Greeting"),
    ("sante",           "Santé",             "Health"),
    ("vie-quotidienne", "Vie quotidienne",   "Everyday life"),
    # Section tags
    ("brt-breizh",  "Mots bretons",     "Breton words"),
    ("brt-mer",     "Mer & marine",     "Sea & maritime"),
    ("brt-table",   "À table",          "At the table"),
    ("brt-vie",     "Vie quotidienne",  "Everyday life"),
]

# ─── Expressions ──────────────────────────────────────────────────────────────
EXPRESSIONS = [

    # ── Section 1 : Mots bretons (brt-breizh) ─────────────────────────────────
    {
        "id": "kenavo",
        "text": "Kenavo",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Au revoir",
        "origin": "Le seul mot breton que tout le monde connaît — y compris les Parisiens de passage. 'Ken' signifie 'jusqu'à' et 'avo' vient de 'bevoañ' (vivre). Littéralement : jusqu'à ce que tu vives à nouveau. Une façon poétique de dire à bientôt.",
        "tags": ["salutation", "brt-breizh"],
    },
    {
        "id": "demat",
        "text": "Demat",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Bonjour",
        "origin": "La salutation matinale bretonne. 'De mat' signifie littéralement 'bon jour'. Moins universel que kenavo mais tout aussi authentique. Un Breton qui vous dit demat vous a déjà adopté.",
        "tags": ["salutation", "brt-breizh"],
    },
    {
        "id": "yechead-mat",
        "text": "Yec'hed mat !",
        "language": "fr",
        "region": "bretagne",
        "register": "informal",
        "kind": "word",
        "meaning": "À votre santé ! Tchin !",
        "origin": "Le toast breton incontournable, prononcé 'yéhé ma'. Signifie 'bonne santé'. S'utilise avec un verre de chouchen ou de cidre, de préférence dans une maison en granit sous la pluie. Le contexte idéal.",
        "tags": ["sante", "boisson", "brt-breizh"],
    },
    {
        "id": "penn-kaled",
        "text": "Un penn-kaled",
        "language": "fr",
        "region": "bretagne",
        "register": "informal",
        "kind": "word",
        "meaning": "Une tête de mule, quelqu'un d'entêté",
        "origin": "Du breton penn (tête) et kaled (dur). Le Breton n'a pas inventé l'entêtement, mais il lui a donné un nom propre. Se dit avec affection autant qu'exaspération. « C'est un vrai penn-kaled » est souvent un compliment déguisé.",
        "tags": ["humour", "brt-breizh"],
    },
    {
        "id": "fest-noz",
        "text": "Un fest-noz",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Fête nocturne traditionnelle avec danses et chants bretons",
        "origin": "Littéralement 'fête de nuit' en breton. Inscrit au patrimoine culturel immatériel de l'UNESCO depuis 2012. Le fest-noz c'est la bombarde, le biniou, la gavotte en cercle et quelques verres de cidre. On n'y échappe pas en Bretagne — et on n'a aucune raison de vouloir y échapper.",
        "tags": ["fete", "musique", "danse", "brt-breizh"],
    },
    {
        "id": "bagad",
        "text": "Un bagad",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Formation de musique bretonne (bombarde, biniou, caisse claire)",
        "origin": "Du breton 'bagad' (groupe, troupe). Un bagad, c'est entre 50 et 80 musiciens qui font trembler les vitres. Défilent aux pardons et compétitions Inter-Bagadoù. Reconnaissable à 500 mètres. Et à 1 kilomètre par temps calme.",
        "tags": ["musique", "tradition", "brt-breizh"],
    },
    {
        "id": "kan-ha-diskan",
        "text": "Le kan ha diskan",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Chant alterné breton à deux voix, sans instrument",
        "origin": "Kan = chanter, diskan = répondre. Deux voix s'échangent les phrases, la seconde reprenant la fin de la première avant que l'autre commence la suivante. Un jeu de miroir vocal hypnotique, typiquement breton, qui peut durer des heures dans les bonnes compagnies.",
        "tags": ["musique", "tradition", "brt-breizh"],
    },
    {
        "id": "gast",
        "text": "Gast !",
        "language": "fr",
        "region": "bretagne",
        "register": "informal",
        "kind": "word",
        "meaning": "Juron breton (de léger à vigoureux selon le contexte)",
        "origin": "Le juron universel du Bretonnant. Étymologiquement, signifie 'chienne' — mais dans la bouche d'un Breton, c'est tout un spectre de l'expression : de la légère contrariété à la franche colère. 'Oh gast !' en tapant son marteau sur son pouce : parfaitement calibré.",
        "tags": ["juron", "humour", "brt-breizh"],
    },
    {
        "id": "brezhoneg",
        "text": "Le brezhoneg",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "La langue bretonne",
        "origin": "Le breton est une langue celtique, plus proche du gallois et du cornique que du français. Parlé par environ 200 000 personnes aujourd'hui, il connaît un renouveau via les écoles Diwan. 'Parler brezhoneg' est une fierté — et parfois un acte de résistance culturelle.",
        "tags": ["langue", "identite", "brt-breizh"],
    },
    {
        "id": "vro",
        "text": "La vro",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "La région, la patrie, le pays natal en breton",
        "origin": "Du vieux breton bro (pays, contrée). Présent dans l'hymne breton 'Bro Gozh ma Zadoù' (Vieille terre de mes pères). 'La vro' s'emploie aussi en français régional pour désigner la Bretagne avec une tendresse particulière.",
        "tags": ["identite", "geographie", "brt-breizh"],
    },

    # ── Section 2 : Mer & marine (brt-mer) ────────────────────────────────────
    {
        "id": "aller-a-la-maree",
        "text": "Aller à la marée",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "locution",
        "meaning": "Aller récolter coquillages et crustacés à marée basse",
        "origin": "Activité quasi-rituelle sur les côtes bretonnes. On y va en famille, armé d'un couteau à huîtres et d'un seau. Les palourdes, coques et couteaux n'ont aucune chance. Pratique millénaire, totalement libre dans les limites légales — et potentiellement addictive.",
        "tags": ["peche", "mer", "tradition", "brt-mer"],
    },
    {
        "id": "avoir-le-pied-marin",
        "text": "Avoir le pied marin",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "idiom",
        "meaning": "Ne pas être sujet au mal de mer ; se sentir à l'aise sur un bateau",
        "origin": "Expression maritime passée dans le langage courant bien au-delà de la Bretagne. Mais ici, elle prend tout son sens : sur un chalutier par mer agitée, avoir le pied marin n'est pas une métaphore — c'est une condition de survie sociale.",
        "tags": ["navigation", "mer", "courage", "brt-mer"],
    },
    {
        "id": "le-nordet",
        "text": "Le nordet",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Le vent du nord-est, redouté des pêcheurs bretons",
        "origin": "Contraction de 'nord-est'. En Bretagne, les vents ont des noms propres et des personnalités. Le nordet est le plus redouté : froid, violent, il arrive par surprise. 'Ça sent le nordet' est une façon polie de dire qu'on va prendre cher.",
        "tags": ["vent", "meteo", "danger", "brt-mer"],
    },
    {
        "id": "la-greve",
        "text": "La grève",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "La plage de sable ou de galets",
        "origin": "Terme historique de l'Ouest de la France pour désigner la plage. 'Faire la grève' — au sens ouvrier — vient de la place de Grève à Paris, où les débardeurs attendaient du travail sur le rivage de la Seine. En Bretagne, la grève, c'est d'abord l'endroit où on ramasse des coquillages.",
        "tags": ["geographie", "mer", "brt-mer"],
    },
    {
        "id": "aller-au-large",
        "text": "Aller au large",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "locution",
        "meaning": "Partir loin des côtes ; s'éloigner, prendre ses distances",
        "origin": "Expression maritime devenue métaphorique. 'Au large' désigne la haute mer, loin des côtes et des abris. 'Il est parti au large' peut autant signifier qu'un pêcheur est en mer que qu'un adolescent a quitté le foyer. La frontière est souvent floue.",
        "tags": ["navigation", "mer", "brt-mer"],
    },
    {
        "id": "etre-en-perdition",
        "text": "Être en perdition",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "idiom",
        "meaning": "Être dans une situation très difficile, en grand danger",
        "origin": "Terme maritime pour un navire qui ne peut plus manœuvrer et risque de couler. Passé dans la langue courante pour toute situation désespérée. En Bretagne, la métaphore n'est pas anodine : les naufrages ont ponctué l'histoire locale depuis des siècles.",
        "tags": ["danger", "difficulte", "navigation", "brt-mer"],
    },
    {
        "id": "la-basse-mer",
        "text": "La basse mer",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "La marée basse ; « être en basse mer » = être à plat, sans ressources",
        "origin": "La basse mer, c'est le moment où la mer se retire au maximum. Expression passée dans la langue : 'être en basse mer' = être à sec, sans énergie ou sans argent. La métaphore marémotrice bretons est naturellement tirée de la réalité quotidienne.",
        "tags": ["meteo", "mer", "difficulte", "brt-mer"],
    },
    {
        "id": "haler",
        "text": "Haler",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Tirer fort sur un cordage, une amarre ; forcer",
        "origin": "Terme nautique entré dans le langage courant breton : 'Hale un peu !' = tire fort ! On hale une corde, un filet, une voile. En dehors d'un port, 'halez-vous' peut aussi s'entendre pour 'poussez-vous' ou 'bougez de là'.",
        "tags": ["navigation", "peche", "brt-mer"],
    },
    {
        "id": "la-criee",
        "text": "La criée",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "La vente aux enchères du poisson à quai, au débarquement",
        "origin": "Carrefour incontournable de la vie bretonne. Les criées de Lorient, Concarneau ou Douarnenez sont parmi les plus actives de France. La criée, c'est le lieu où se fixent les prix, où se négocie la survie des pêcheurs. Certaines se visitent — avec des bottes.",
        "tags": ["peche", "tradition", "brt-mer"],
    },

    # ── Section 3 : À table (brt-table) ───────────────────────────────────────
    {
        "id": "kouign-amann",
        "text": "Le kouign-amann",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Gâteau breton caramélisé à base de pâte levée, beurre demi-sel et sucre",
        "origin": "Littéralement 'gâteau au beurre' en breton. Inventé à Douarnenez en 1860 par le boulanger Yves-René Scordia, à court de farine, avec ce qu'il avait. L'accident de cuisine le plus célèbre de Bretagne. Le résultat : une pâte feuilletée caramélisée, croustillante dehors, fondante dedans. On ne s'en remet pas.",
        "tags": ["gastronomie", "beurre", "tradition", "brt-table"],
    },
    {
        "id": "le-chouchen",
        "text": "Le chouchen",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Hydromel breton à base de miel fermenté",
        "origin": "La boisson des Celtes, remise au goût du jour en Bretagne. Du miel et de l'eau, fermentés — c'est tout. Mais le résultat peut varier de 10 à 18 degrés selon le producteur. 'Tu veux encore un verre de chouchen ?' est une question pièges dans certaines maisons bretonnes.",
        "tags": ["boisson", "tradition", "brt-table"],
    },
    {
        "id": "la-galette-saucisse",
        "text": "La galette-saucisse",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Galette de sarrasin roulée autour d'une saucisse grillée",
        "origin": "Le hot-dog breton. Vendu dans les stades, les marchés, les pardons. La galette doit être fine et croustillante, la saucisse bien grillée. Se mange debout, en marchant. C'est le plat de rue breton par excellence — et sérieusement sous-estimé par le reste de la France.",
        "tags": ["gastronomie", "crepe", "nourriture", "brt-table"],
    },
    {
        "id": "la-complete",
        "text": "La complète",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Galette de sarrasin garnie oeuf-jambon-fromage",
        "origin": "La galette complète, c'est le triumvirat : œuf cassé sur la galette, jambon blanc, fromage fondu. Dans une bonne crêperie bretonne, c'est souvent suffisant pour un repas. Commander autre chose après passe pour de la gourmandise — ce qui n'est pas une insulte.",
        "tags": ["gastronomie", "crepe", "nourriture", "brt-table"],
    },
    {
        "id": "le-far-breton",
        "text": "Le far breton",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Flan dense aux pruneaux, spécialité bretonne",
        "origin": "Le far (du latin 'far', farine) est un clafoutis dense et lourd, souvent servi tiède. Les pruneaux sont optionnels mais presque obligatoires selon les familles. Chaque mamie bretonne a sa recette et considère celle des autres comme légèrement inférieure.",
        "tags": ["gastronomie", "tradition", "brt-table"],
    },
    {
        "id": "le-kig-ha-farz",
        "text": "Le kig ha farz",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Pot-au-feu breton avec des dumplings de sarrasin cuits dans une poche de lin",
        "origin": "Kig = viande, farz = farce/quenelle. C'est le plat dominical du Léon (nord-Finistère). La poche de lin contenant la pâte de sarrasin cuit dans le bouillon avec les légumes et la viande. Plat rustique, nourrissant, profondément territorial.",
        "tags": ["gastronomie", "tradition", "nourriture", "brt-table"],
    },
    {
        "id": "le-beurre-demi-sel",
        "text": "Le beurre demi-sel",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Le beurre salé breton — la norme, pas l'exception",
        "origin": "En Bretagne, le beurre demi-sel est le beurre. Le beurre 'doux' est une anomalie. La fleur de sel de Guérande ou de l'île de Ré finit dans le beurre, sur les crêpes, les kouign-amann, les radis. Si on vous sert du beurre non salé en Bretagne, vous êtes dans un restaurant qui ne comprend rien.",
        "tags": ["gastronomie", "beurre", "tradition", "brt-table"],
    },
    {
        "id": "la-crepe-dentelle",
        "text": "La crêpe dentelle",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Fine gaufrette croustillante roulée, originaire de Quimper",
        "origin": "Inventée à Quimper vers 1886 par Marie-Catherine Cornic — un accident heureux, une crêpe trop fine qui s'est roulée en séchant. Elle a fondé la maison Kerfeunteun. Aujourd'hui la Gavotte (marque principale) est vendue dans le monde entier. La Bretagne a ses brevets culinaires.",
        "tags": ["gastronomie", "crepe", "tradition", "brt-table"],
    },
    {
        "id": "la-bolee",
        "text": "La bolée",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Bol traditionnel en grès ou céramique pour servir le cidre breton",
        "origin": "Boire le cidre dans une bolée, c'est respecter le rituel. Le bol rustique, légèrement évasé, tient bien dans les mains. 'Une bolée de cidre' est aussi l'unité de mesure du bien-vivre breton. On ne dit pas 'un verre de cidre' — c'est de la bolée.",
        "tags": ["boisson", "tradition", "brt-table"],
    },
    {
        "id": "le-cidre-bouche",
        "text": "Le cidre bouché",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Cidre pétillant breton en bouteille capsulée, servi frais",
        "origin": "Le cidre breton est une alternative sérieuse au vin dans les crêperies. 'Bouché' signifie mis en bouteille avec refermentation — d'où les bulles. Doux, brut ou extra-brut. Se boit dans une bolée avec une galette complète. Le duo est patrimonial.",
        "tags": ["boisson", "gastronomie", "brt-table"],
    },

    # ── Section 4 : Vie quotidienne (brt-vie) ─────────────────────────────────
    {
        "id": "il-mouille",
        "text": "Il mouille",
        "language": "fr",
        "region": "bretagne",
        "register": "informal",
        "kind": "locution",
        "meaning": "Il pleut",
        "origin": "La tournure préférée au simple 'il pleut' dans le parler breton. Plus précis, en quelque sorte : 'mouiller' décrit l'état de saturation générale plutôt que la chute d'eau. Avec 1 200 à 1 400 mm de pluie annuelle en moyenne à Brest, les nuances s'imposent.",
        "tags": ["meteo", "pluie", "vie-quotidienne", "brt-vie"],
    },
    {
        "id": "le-bout-du-monde",
        "text": "C'est le bout du monde",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "idiom",
        "meaning": "Endroit reculé et isolé — mais ici, assumé avec fierté",
        "origin": "Le Finistère vient du latin Finis Terrae : la fin de la terre. Pour le Breton, ce n'est pas une insulte — c'est une géographie. Le bout du monde, c'est chez lui. La pointe du Raz, Ouessant, l'île de Sein. Là où l'Europe s'arrête et où l'Atlantique commence.",
        "tags": ["geographie", "identite", "humour", "brt-vie"],
    },
    {
        "id": "aller-au-bourg",
        "text": "Aller au bourg",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "locution",
        "meaning": "Aller au village centre, au bourg principal",
        "origin": "En Bretagne rurale, 'le bourg' désigne le centre bourg — là où se trouve l'église, la mairie, le café. On n'habite pas 'au bourg' ; on va 'au bourg'. La distinction entre le bourg et les écarts (hameaux) structure encore l'espace mental breton.",
        "tags": ["ruralite", "vie-quotidienne", "geographie", "brt-vie"],
    },
    {
        "id": "le-penn-ar-bed",
        "text": "Le Penn ar Bed",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Le bout du monde en breton — nom breton du Finistère",
        "origin": "Penn (tête, bout) + ar bed (du monde). Le Finistère a donc deux noms qui disent la même chose : Finis Terrae en latin, Penn ar Bed en breton. La compagnie maritime Penn ar Bed assure les liaisons vers Ouessant et les îles — là où le bout du monde est encore plus au bout.",
        "tags": ["geographie", "identite", "langue", "brt-vie"],
    },
    {
        "id": "cest-garanti",
        "text": "C'est garanti !",
        "language": "fr",
        "region": "bretagne",
        "register": "informal",
        "kind": "locution",
        "meaning": "Formule d'approbation enthousiaste et assurée",
        "origin": "Tic verbal très breton pour valider une affirmation avec force. 'C'est garanti !' = c'est sûr, c'est certain, je l'atteste. L'étymologie commerciale (garantie de qualité) s'est transformée en marqueur d'enthousiasme. Un 'c'est garanti !' breton vaut toutes les certifications.",
        "tags": ["humour", "vie-quotidienne", "brt-vie"],
    },
    {
        "id": "la-coiffe",
        "text": "La coiffe",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Coiffe traditionnelle bretonne en dentelle portée par les femmes",
        "origin": "Chaque pays breton a sa coiffe : haute bigoudène, plate léonarde, en ailes de papillon... Longtemps signe du dimanche et des fêtes, la coiffe a aujourd'hui valeur de symbole culturel. 'Porter la coiffe' = être attaché aux traditions — dans le bon sens du terme.",
        "tags": ["vetement", "tradition", "identite", "brt-vie"],
    },
    {
        "id": "bigouden",
        "text": "Bigouden",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Du Pays Bigouden (Cornouaille) ; coiffe très haute, style emblématique",
        "origin": "Le Pays Bigouden, autour de Pont-l'Abbé, a la coiffe la plus haute et la plus reconnaissable de Bretagne — jusqu'à 33 cm. 'C'est du bigouden' peut vouloir dire 'c'est typiquement breton' avec une pointe d'affection. La coiffe bigoudène est classée au patrimoine culturel immatériel.",
        "tags": ["vetement", "tradition", "identite", "humour", "brt-vie"],
    },
    {
        "id": "le-pardon",
        "text": "Le pardon",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "word",
        "meaning": "Fête religieuse et populaire célébrée en l'honneur du saint patron d'une paroisse",
        "origin": "Les pardons bretons combinent procession religieuse, festin communautaire et retrouvailles familiales. Le plus célèbre : le Pardon de Sainte-Anne-d'Auray. Ni tout à fait fête, ni tout à fait cérémonie, le pardon est un moment de cohésion sociale unique à la Bretagne.",
        "tags": ["tradition", "fete", "vie-quotidienne", "brt-vie"],
    },
    {
        "id": "il-fait-gris",
        "text": "Il fait gris",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "locution",
        "meaning": "Le temps est couvert, nuageux — l'état normal du ciel breton",
        "origin": "En Bretagne, 'il fait gris' n'est pas une lamentation — c'est un constat météorologique neutre. La lumière grise de l'Atlantique est d'ailleurs ce que les peintres de la côte bretonne (Gauguin à Pont-Aven, par exemple) sont venus chercher. Le gris breton a sa propre qualité lumineuse.",
        "tags": ["meteo", "pluie", "humour", "brt-vie"],
    },
    {
        "id": "en-breizh",
        "text": "En Breizh",
        "language": "fr",
        "region": "bretagne",
        "register": "standard",
        "kind": "locution",
        "meaning": "En Bretagne — la désignation en langue bretonne",
        "origin": "Breizh, c'est Bretagne en breton. Le sticker 'BZH' collé à l'arrière de milliers de voitures est l'abréviation de Breizh. Dire 'en Breizh' ou 'Breizh ar vro' (Bretagne pays) est un marqueur identitaire fort. On n'est pas 'en Bretagne' — on est 'en Breizh'.",
        "tags": ["identite", "langue", "geographie", "brt-vie"],
    },
]

# ─── Insert logic ──────────────────────────────────────────────────────────────

def run():
    with engine.connect() as conn:
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
                "source":   "spike-bretagne.html",
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

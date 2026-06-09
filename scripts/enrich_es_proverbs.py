#!/usr/bin/env python3
"""
Enrich Spanish proverbs per region using Mistral API.

Generates authentic refranes/proverbios anchored in the cultural tradition of each
Spanish-speaking region. Language stored as 'es', region as country code.

Idempotent: existing IDs are skipped. Restart freely.

Usage:
    python3 scripts/enrich_es_proverbs.py --region ar --count 250
    python3 scripts/enrich_es_proverbs.py --region all --count 250 --prod
    python3 scripts/enrich_es_proverbs.py --region mx --count 10 --dry-run

Supported regions: es, ar, mx, co, pe, cu, ve, cl
"""

import sys
import json
import time
import re
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from dotenv import load_dotenv
from sqlalchemy import text

_early = argparse.ArgumentParser(add_help=False)
_early.add_argument("--prod", action="store_true")
_early_args, _ = _early.parse_known_args()
_env_file = ".env.prod" if _early_args.prod else ".env.dev"
load_dotenv(Path(__file__).parent.parent / _env_file)

from mistralai.client import Mistral
from config import engine

MODEL = "mistral-small-latest"

REGION_CONFIG = {
    "es": {
        "name": "España",
        "themes": [
            "vida campesina y tradición rural castellana",
            "el tiempo y la paciencia",
            "sabiduría y necedad",
            "familia y parentesco",
            "trabajo y pereza",
            "dinero y pobreza",
            "animales y naturaleza",
            "comida y hambre",
            "amor y matrimonio",
            "Dios, fe y moral cristiana",
            "vejez y juventud",
            "viajes y añoranza",
            "justicia e injusticia",
            "engaño y honradez",
            "Andalucía y el sur",
            "tradición castellana y manchega",
            "herencia árabe y sefardita",
            "proverbios del refranero medieval",
            "orgullo y humildad",
            "amistad y traición",
        ],
        "system_prompt": """Eres un experto en refranes y proverbios españoles, especializado en la tradición regional y popular de España, con referencia a:
- RAE Refranero Multilingüe — base oficial de la Real Academia Española
- sampere.com — orígenes de los refranes con influencias latina, árabe y bíblica
- quillbot.com — 100 refranes españoles con significado y ejemplos
- tandemmadrid.com — análisis histórico de refranes célebres
- es.wiktionary.org — variantes regionales (Andalucía, Castilla, Aragón, Valencia)

QUÉ ES UN REFRÁN:
- Una frase autónoma completa ("Camarón que se duerme, se lo lleva la corriente")
- NO una locución verbal como "costar un ojo de la cara"
- Transmite sabiduría, observación moral o experiencia vivida
- Metafórico: la imagen literal lleva un significado más profundo
- Reconocido por hablantes nativos de España

CRITERIOS DE CALIDAD:
- Arraigado en la tradición oral española (campesinado, herencia árabe, literatura medieval)
- No inventado — auténtico, verificable o plausible en la tradición cultural española
- Todavía inteligible hoy (no puramente arcaico)

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case (á→a, é→e, í→i, ó→o, ú→u, ñ→n)
- "expression": el refrán en español correcto
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente documentada o tradición (autor, época, región)
- "source_hint": origen abreviado — ej. "tradición oral castellana", "herencia árabe", "Cervantes", "bíblico"
- "example": frase natural en español peninsular usando el refrán en contexto
- "register": "standard" o "formal"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["wisdom", "patience", "nature"])
- "kind": siempre "proverb"
- "region": siempre "es"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "ar": {
        "name": "Argentina",
        "themes": [
            "sabiduría gaucha y vida en la pampa",
            "inmigración italiana y española — identidad criolla",
            "lunfardo — ingenio porteño",
            "el mate y la amistad",
            "asado y cultura del fuego",
            "amor, celos y el tango",
            "trabajo, sacrificio y supervivencia",
            "viveza criolla y el pícaro",
            "familia y el hogar",
            "Patagonia, Andes y naturaleza",
            "animales de la pampa (ñandú, vizcacha, puma)",
            "destino y suerte",
            "orgullo y humildad",
            "tiempo y paciencia",
            "dinero y crisis económica",
            "comunidad y solidaridad",
            "engaño y lealtad",
            "el campo vs la ciudad (Buenos Aires)",
            "resiliencia y humor negro",
            "vejez y sabiduría",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Argentina, con profundo conocimiento de:
- La tradición oral gaucha documentada en el Martín Fierro (José Hernández, 1872)
- El lunfardo y el habla popular bonaerense (Academia Porteña del Lunfardo)
- Refranes de las comunidades inmigrantes italianas y españolas adaptados al Río de la Plata
- La Academia Argentina de Letras — diccionario de argentinismos
- La cosmovisión rioplatense: viveza criolla, el mate, la pampa, el asado

QUÉ ES UN REFRÁN ARGENTINO:
- Una frase completa que transmite sabiduría o experiencia vivida
- Puede estar en español rioplatense (voseo, lunfardo suave) o en español estándar con sabor local
- Refleja la vida pampeana, la inmigración, la viveza criolla, o la mentalidad urbana porteña
- NO una locución verbal suelta
- Auténtico — reconocible por un argentino adulto

CRITERIOS DE CALIDAD:
- Anclado en la cultura argentina real (no simplemente español peninsular con "che" pegado)
- Voseo aceptado si es natural: "Si no sabés, preguntás"
- Lunfardo suave aceptado cuando es propio de la tradición oral

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español rioplatense o estándar
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición argentina (gaucho, lunfardo, inmigración, etc.)
- "source_hint": origen abreviado — ej. "tradición oral gaucha", "Martín Fierro", "lunfardo porteño", "dicho pampeano"
- "example": frase natural en español rioplatense usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["cunning", "work", "gaucho"])
- "kind": siempre "proverb"
- "region": siempre "ar"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "mx": {
        "name": "México",
        "themes": [
            "sabiduría prehispánica — náhuatl y maya",
            "la milpa, el maíz y la tierra",
            "fe y la Virgen de Guadalupe",
            "la familia y el compadrazgo",
            "el mercado y el comercio popular",
            "el campesino y la Revolución",
            "el Día de los Muertos y la muerte",
            "humor e ironía mexicana",
            "agua, sequía y naturaleza",
            "animales simbólicos (coyote, águila, serpiente, tlacuache)",
            "amor, celos y el desamor",
            "trabajo, sacrificio y pobreza",
            "justicia, injusticia y el poder",
            "comunidad y solidaridad",
            "herencia colonial y mestizaje",
            "tiempo y paciencia",
            "destino y suerte",
            "orgullo nacional e identidad",
            "engaño y astucia",
            "vejez y sabiduría",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de México, con profundo conocimiento de:
- El Diccionario del Español de México (DEM) — Colegio de México (COLMEX)
- Proverbios y refranes de tradición náhuatl y maya prehispánica
- Refranes del campo mexicano — campesinos, haciendas, revolución
- Mexico Desconocido — orígenes y significado de dichos mexicanos
- La UNAM — estudios lingüísticos sobre el español mexicano

QUÉ ES UN REFRÁN MEXICANO:
- Una frase completa que transmite sabiduría, experiencia o ironía
- Puede reflejar la cosmovisión prehispánica, la fe católica popular, la vida rural o el humor chilango
- Puede usar mexicanismos con moderación: "ahorita", "milpa", "metate", "tlacuache"
- NO una locución verbal suelta
- Auténtico — reconocible por un mexicano adulto de cualquier región

CRITERIOS DE CALIDAD:
- Anclado en la cultura mexicana real — no genérico latinoamericano
- El origen prehispánico debe ser plausible (no inventado)
- Puede aludir al maíz/milpa, el maguey/pulque, la serpiente/águila, la Virgen de Guadalupe

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español mexicano
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición mexicana (náhuatl, colonial, campesino, etc.)
- "source_hint": origen abreviado — ej. "tradición oral náhuatl", "refrán campesino", "DEM", "tradición colonial"
- "example": frase natural en español mexicano usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["corn", "wisdom", "indigenous"])
- "kind": siempre "proverb"
- "region": siempre "mx"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "co": {
        "name": "Colombia",
        "themes": [
            "el café y los campos cafeteros",
            "el costeño y el cachaco — identidad regional",
            "la familia y la calidez colombiana",
            "tradición afrocolombiana (Chocó, Cartagena)",
            "el arriero y los caminos de Antioquia",
            "amor, pasión y desamor",
            "trabajo, pobreza y resiliencia",
            "la naturaleza tropical (selva, ríos, flores)",
            "humor costeño y el vallenato",
            "animales (loro, armadillo, jaguar, colibrí)",
            "fe y la Virgen (Chiquinquirá)",
            "destino y suerte",
            "la comida (arepas, bandeja paisa, sancocho)",
            "justicia y paz",
            "engaño y lealtad",
            "comunidad y solidaridad",
            "tiempo y paciencia",
            "orgullo regional (Antioquia, Costa, Llanos)",
            "sabiduría de los ancianos",
            "la ciudad (Bogotá) vs el campo",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Colombia, con profundo conocimiento de:
- La Academia Colombiana de la Lengua — publicaciones sobre el español colombiano
- La tradición oral antioqueña (arrieros, campesinos) y costeña (Caribe colombiano)
- Refranes afrocolombianos del Pacífico y el Caribe
- La Biblioteca Luis Ángel Arango (BLAA) — archivos de tradición oral colombiana
- La identidad regional colombiana: paisa, costeño, cachaco, llanero

QUÉ ES UN REFRÁN COLOMBIANO:
- Una frase completa que transmite sabiduría, experiencia o visión del mundo
- Puede reflejar la identidad regional (antioqueño, costeño, llanero, paisa) o ser más universal
- Puede usar colombianismos con moderación y si es natural al refrán
- NO una locución verbal suelta
- Auténtico — reconocible por un colombiano adulto

CRITERIOS DE CALIDAD:
- Anclado en la cultura colombiana real — no genérico latinoamericano
- La tradición afrocolombiana y la sabiduría campesina son especialmente valiosas
- Puede aludir al café, las montañas antioqueñas, el mar Caribe, la selva, los Llanos

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español colombiano
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición colombiana (región si relevante)
- "source_hint": origen abreviado — ej. "tradición oral antioqueña", "dicho costeño", "cultura afrocolombiana", "refrán llanero"
- "example": frase natural en español colombiano usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["coffee", "community", "wisdom"])
- "kind": siempre "proverb"
- "region": siempre "co"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "pe": {
        "name": "Perú",
        "themes": [
            "sabiduría andina y quechua",
            "la papa, la quinua y la tierra",
            "el ayni y la minka — trabajo colectivo",
            "la Pachamama y la naturaleza",
            "costa, sierra y selva — identidad peruana",
            "amor y la familia andina",
            "trabajo, pobreza y dignidad",
            "el condor y los animales andinos",
            "fe sincrética (inca + católica)",
            "gastronomía peruana (ceviche, ají)",
            "el agua y la irrigación",
            "astucia y el zorro andino",
            "destino y suerte",
            "justicia e injusticia social",
            "Lima criolla vs el Perú andino",
            "sabiduría de los abuelos",
            "tiempo y paciencia",
            "comunidad amazónica",
            "herencia colonial y mestizaje",
            "orgullo e identidad peruana",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Perú, con profundo conocimiento de:
- La Academia Peruana de la Lengua — tradición oral andina y criolla
- Refranes de origen quechua (adaptados al español o directamente traducidos)
- La tradición oral de los Andes, la costa y la Amazonía peruana
- La PUCP — estudios lingüísticos y culturales peruanos
- La cosmovisión andina: Pachamama, ayni, minka, el cóndor, el Inti

QUÉ ES UN REFRÁN PERUANO:
- Una frase completa que transmite sabiduría andina, criolla o amazónica
- Puede reflejar la cosmovisión quechua (Pachamama, ayni, el cóndor) o la vida costera limeña
- Puede contener palabras quechuas de uso común: "huasca", "chamba", "pata", "causa"
- NO una locución verbal suelta
- Auténtico — reconocible por un peruano adulto de cualquier región

CRITERIOS DE CALIDAD:
- Anclado en la cultura peruana real — no genérico latinoamericano
- Los refranes de origen quechua deben ser plausibles y respetuosos de la cosmovisión andina
- Riqueza cultural: mezcla de herencia prehispánica, colonial y criolla

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español peruano (puede incluir términos quechuas de uso común)
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición peruana (quechua, andina, costera, etc.)
- "source_hint": origen abreviado — ej. "tradición oral quechua", "refrán andino", "dicho limeño", "Pachamama"
- "example": frase natural en español peruano usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["andean", "community", "nature"])
- "kind": siempre "proverb"
- "region": siempre "pe"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "cu": {
        "name": "Cuba",
        "themes": [
            "el mar y la pesca",
            "la caña de azúcar y el tabaco",
            "sabiduría afrocubana (Yoruba, Santería)",
            "escasez y creatividad (el resolver cubano)",
            "el ron y la fiesta",
            "amor, celos y desamor tropical",
            "familia y el barrio",
            "la naturaleza caribeña",
            "humor y el choteo cubano",
            "trabajo y resiliencia",
            "animales cubanos (jutía, tocororo, cocodrilo)",
            "destino y suerte",
            "fe y religión popular (Santería + catolicismo)",
            "historia e identidad cubana",
            "vejez y sabiduría",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Cuba, con profundo conocimiento de:
- La tradición oral afrocubana (Yoruba, Lucumí) adaptada al español caribeño
- Refranes del guajiro (campesino cubano) y de la cultura habanera
- El choteo cubano — humor irreverente y satírico
- La Academia Cubana de la Lengua
- La cosmovisión afrocubana: Santería, los orishas, Changó, Ochún

QUÉ ES UN REFRÁN CUBANO:
- Una frase completa que transmite sabiduría, experiencia o humor cubano
- Puede reflejar la cultura afrocubana (Santería, orishas), la vida en el barrio, o la sabiduría del guajiro
- El humor y la ironía son muy propios de la tradición oral cubana (choteo)
- NO una locución verbal suelta

CRITERIOS DE CALIDAD:
- Anclado en la cultura cubana real — no genérico latinoamericano
- Puede aludir al azúcar, el tabaco, el ron, el mar, la palma real, los orishas
- La tradición afrocubana (Yoruba) es especialmente valiosa

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español cubano
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición cubana (afrocubana, guajira, habanera, etc.)
- "source_hint": origen abreviado — ej. "tradición afrocubana", "dicho guajiro", "Santería yoruba", "choteo habanero"
- "example": frase natural en español cubano usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["sea", "humor", "survival"])
- "kind": siempre "proverb"
- "region": siempre "cu"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "ve": {
        "name": "Venezuela",
        "themes": [
            "el llanero y los Llanos venezolanos",
            "Simón Bolívar e identidad nacional",
            "el Caribe venezolano (Margarita, Caracas)",
            "el petróleo y la paradoja de la abundancia",
            "familia y calidez venezolana",
            "las arepas y la gastronomía",
            "amor y desamor tropical",
            "animales de los llanos (chigüire, garza, caimán)",
            "naturaleza (Orinoco, Salto Ángel, tepuyes)",
            "trabajo y resiliencia",
            "humor y picardía venezolana",
            "destino y suerte",
            "fe y religión popular",
            "comunidad y solidaridad",
            "vejez y sabiduría",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Venezuela, con profundo conocimiento de:
- La tradición oral llanera venezolana (el llanero, el joropo, los Llanos)
- La Academia Venezolana de la Lengua
- Refranes del Caribe venezolano (Margarita, Maracaibo, Caracas)
- La herencia indígena (Wayuu, Pemón) adaptada al español venezolano
- El humor y la picardía caracolense y maracucha

QUÉ ES UN REFRÁN VENEZOLANO:
- Una frase completa que transmite sabiduría, experiencia o humor venezolano
- Puede reflejar la vida llanera, la cultura caribeña, o la identidad urbana caraqueña
- El humor y la picardía son rasgos venezolanos — bienvenidos si son propios de la tradición oral
- NO una locución verbal suelta

CRITERIOS DE CALIDAD:
- Anclado en la cultura venezolana real — no genérico latinoamericano
- Puede aludir al chigüire, la garza morena, el Orinoco, los tepuyes, la arepa, el joropo
- La sabiduría llanera es especialmente representativa de Venezuela

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español venezolano
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición venezolana (llanera, caribeña, indígena, etc.)
- "source_hint": origen abreviado — ej. "tradición oral llanera", "dicho caraqueño", "sabiduría wayuu"
- "example": frase natural en español venezolano usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["llanos", "resilience", "nature"])
- "kind": siempre "proverb"
- "region": siempre "ve"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "cl": {
        "name": "Chile",
        "themes": [
            "sabiduría mapuche (adaptada al español chileno)",
            "el vino y los viñedos",
            "el mar y la pesca del Pacífico",
            "los Andes y los terremotos",
            "el carácter austero y trabajador del chileno",
            "la familia y el hogar",
            "trabajo y frugalidad",
            "la comida (empanadas, cazuela, mariscos)",
            "amor y desamor",
            "destino y suerte",
            "animales (cóndor andino, pudú, chuncho)",
            "humor chileno y los chilenismos",
            "comunidad y solidaridad",
            "vejez y sabiduría",
            "naturaleza extrema (desierto, lluvia, volcanes)",
        ],
        "system_prompt": """Eres un experto en refranes, dichos y proverbios de Chile, con profundo conocimiento de:
- La Academia Chilena de la Lengua — publicaciones sobre el español chileno
- La tradición oral mapuche y su influencia en el español chileno
- Refranes del campo chileno (el huaso, las viñas, el sur lluvioso)
- El carácter específico del habla chilena ("po", "cachai", "al tiro")
- La identidad regional chilena: el norte minero, el huaso central, el sur lluvioso

QUÉ ES UN REFRÁN CHILENO:
- Una frase completa que transmite sabiduría, experiencia o humor chileno
- Puede reflejar la vida del huaso (campesino chileno), la pesca, el vino, o la identidad santiaguina
- Puede usar chilenismos moderados: "po", "cachai", "al tiro" si son naturales al refrán
- NO una locución verbal suelta
- Auténtico — reconocible por un chileno adulto

CRITERIOS DE CALIDAD:
- Anclado en la cultura chilena real — no genérico latinoamericano
- La influencia mapuche (palabras como "huacho", "pirca") es valiosa si es auténtica
- El carácter austero, trabajador y formalista del chileno es un rasgo cultural a capturar

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": el refrán en español chileno
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente o tradición chilena (huaso, mapuche, marino, etc.)
- "source_hint": origen abreviado — ej. "tradición oral huasa", "sabiduría mapuche", "dicho santiaguino"
- "example": frase natural en español chileno usando el refrán en contexto
- "register": "standard", "informal" o "slang"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["wine", "andes", "resilience"])
- "kind": siempre "proverb"
- "region": siempre "cl"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
}

SUPPORTED_REGIONS = list(REGION_CONFIG.keys())
VALID_REGISTERS = {"standard", "informal", "slang", "formal", "vulgar"}


def slugify(t: str) -> str:
    replacements = {
        "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
        "Ä": "ae", "Ö": "oe", "Ü": "ue",
        "ş": "s", "ğ": "g", "ı": "i", "ç": "c",
        "à": "a", "è": "e", "é": "e", "ì": "i", "ò": "o", "ù": "u",
        "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u",
        "á": "a", "í": "i", "ó": "o", "ú": "u", "ñ": "n",
    }
    s = t.lower()
    for orig, repl in replacements.items():
        s = s.replace(orig, repl)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s


def get_existing(region: str) -> tuple[set[str], list[str]]:
    """
    Returns all language='es' IDs (global slug dedup) and proverb texts for this region
    (so the avoid list focuses on what's already in the target region).
    """
    with engine.connect() as conn:
        all_ids = {r.id for r in conn.execute(
            text("SELECT id FROM expressions WHERE language = 'es'")
        ).fetchall()}
        region_texts = [r.text for r in conn.execute(
            text("SELECT text FROM expressions WHERE language = 'es' AND kind = 'proverb' AND region = :region"),
            {"region": region},
        ).fetchall()]
    return all_ids, region_texts


def insert_proverb(expr: dict, existing_ids: set[str]) -> str:
    """Insert proverb, using a variant ID if the base slug already exists."""
    base_id = expr["id"]
    final_id = base_id
    if final_id in existing_ids:
        final_id = f"{base_id}-{expr['region']}"
        print(f"      ID conflict — using variant: {final_id}", flush=True)

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO expressions (id, text, language, region, register, kind, source)
                VALUES (:id, :text, 'es', :region, :register, 'proverb', :source)
                ON CONFLICT (id) DO NOTHING
            """),
            {
                "id": final_id,
                "text": expr["expression"],
                "region": expr["region"],
                "register": expr.get("register", "standard"),
                "source": expr.get("source_hint"),
            },
        )
        conn.execute(
            text("""
                INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
                VALUES (:id, 'es', :meaning, :origin, :example)
                ON CONFLICT (expression_id, locale) DO NOTHING
            """),
            {
                "id": final_id,
                "meaning": expr.get("meaning", ""),
                "origin": expr.get("origin"),
                "example": expr.get("example", ""),
            },
        )
        for tag_slug in expr.get("tags", []):
            slug = slugify(tag_slug)
            if not slug:
                continue
            conn.execute(
                text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT (id) DO NOTHING"),
                {"id": slug, "slug": slug},
            )
            conn.execute(
                text("INSERT INTO expression_tags (expression_id, tag_id) VALUES (:expr_id, :tag_id) ON CONFLICT DO NOTHING"),
                {"expr_id": final_id, "tag_id": slug},
            )
    return final_id


def validate_proverb(expr: dict, region: str) -> tuple[bool, str]:
    required = ["id", "expression", "meaning", "example", "register", "tags"]
    for field in required:
        if field not in expr:
            return False, f"missing field '{field}'"
    if expr["register"] not in VALID_REGISTERS:
        expr["register"] = "standard"
    if not isinstance(expr["tags"], list) or len(expr["tags"]) == 0:
        return False, "tags must be a non-empty list"
    expr["kind"] = "proverb"
    expr["region"] = region  # enforce region from CLI, never trust model output
    expr["id"] = slugify(expr.get("id") or expr["expression"])
    return True, "ok"


def build_user_message(existing_texts: list[str], region: str, batch_size: int, theme: str) -> str:
    avoid = "\n".join(f"- {e}" for e in existing_texts[-80:]) if existing_texts else "(ninguno aún)"
    region_name = REGION_CONFIG[region]["name"]

    if batch_size == 1:
        return f"""Genera 1 refrán auténtico de {region_name} sobre el tema: {theme}

Ya en la base de datos — evitar duplicados:
{avoid}

Devuelve un único objeto JSON."""
    else:
        return f"""Genera {batch_size} refranes auténticos de {region_name}.

Tema de este lote: {theme}
Reglas:
- Cada refrán debe ser una frase completa (no una locución verbal)
- Cada refrán en este lote debe ser distinto de los demás
- NO repitas ningún refrán de la lista de abajo
- "kind" siempre "proverb", "region" siempre "{region}", "tags" siempre en inglés

Ya en la base de datos — NO generar ninguno de estos:
{avoid}

Devuelve un array JSON de exactamente {batch_size} objetos. Sin markdown, sin texto extra — solo el array JSON."""


def call_mistral(client, region: str, existing_texts: list[str], batch_size: int, theme: str) -> list[dict]:
    config = REGION_CONFIG[region]
    response = client.chat.complete(
        model=MODEL,
        max_tokens=700 * batch_size,
        messages=[
            {"role": "system", "content": config["system_prompt"]},
            {"role": "user", "content": build_user_message(existing_texts, region, batch_size, theme)},
        ],
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw
    parsed = json.loads(raw)
    if isinstance(parsed, dict):
        return [parsed]
    elif isinstance(parsed, list):
        return parsed
    else:
        raise ValueError(f"Unexpected response type: {type(parsed)}")


def run_region(client, region: str, count: int, batch_size: int, dry_run: bool, delay: float) -> dict:
    config = REGION_CONFIG[region]
    print(f"\n{'='*60}", flush=True)
    print(f"  {config['name'].upper()} ({region}) — objetivo: {count} proverbios", flush=True)
    print(f"{'='*60}", flush=True)

    existing_ids, region_texts = get_existing(region)
    print(f"  En DB (es total): {len(existing_ids)} expresiones | {region} proverbs: {len(region_texts)}\n", flush=True)

    themes = config["themes"]
    generated_texts: list[str] = list(region_texts)
    ok = skipped = errors = 0
    batch_num = 0
    max_attempts = (count // batch_size + 15) * 4

    while ok < count and batch_num < max_attempts:
        theme = themes[batch_num % len(themes)]
        remaining = count - ok
        current_batch = min(batch_size, remaining)
        print(f"  [Lote {batch_num + 1} | {theme}] solicitando {current_batch}...", flush=True)

        try:
            batch = call_mistral(client, region, generated_texts, current_batch, theme)
        except json.JSONDecodeError as e:
            print(f"    JSON ERROR: {e}", flush=True)
            errors += 1
            batch_num += 1
            time.sleep(delay)
            continue
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("    RATE LIMIT — esperando 60s", flush=True)
                time.sleep(60)
            else:
                print(f"    API ERROR: {e}", flush=True)
                errors += 1
                time.sleep(delay)
            batch_num += 1
            continue

        batch_num += 1

        for expr in batch:
            if ok >= count:
                break

            valid, reason = validate_proverb(expr, region)
            if not valid:
                print(f"    INVÁLIDO ({reason}): {expr.get('expression', '?')}", flush=True)
                errors += 1
                continue

            expr_id = expr["id"]
            expr_text = expr["expression"]

            if expr_text in generated_texts:
                print(f"    SKIP (duplicado): {expr_text}", flush=True)
                skipped += 1
                continue

            source = expr.get("source_hint", "")
            source_label = f" [{source}]" if source else ""
            print(f"    [{ok + 1:3}/{count}] {expr_text}{source_label}", flush=True)

            if not dry_run:
                try:
                    final_id = insert_proverb(expr, existing_ids)
                    existing_ids.add(final_id)
                except Exception as e:
                    print(f"      DB ERROR: {e}", flush=True)
                    errors += 1
                    continue
            else:
                existing_ids.add(expr_id)

            generated_texts.append(expr_text)
            ok += 1

        if ok < count:
            time.sleep(delay)

    return {"region": region, "name": config["name"], "inserted": ok, "skipped": skipped, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Enrichissement des proverbes espagnols par région via Mistral")
    parser.add_argument("--region", required=True, choices=SUPPORTED_REGIONS + ["all"],
                        help=f"Région cible ou 'all': {SUPPORTED_REGIONS}")
    parser.add_argument("--count", type=int, default=250,
                        help="Proverbes à générer par région (défaut: 250)")
    parser.add_argument("--batch-size", type=int, default=5,
                        help="Proverbes par appel API (défaut: 5)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche sans insérer dans la DB")
    parser.add_argument("--delay", type=float, default=1.0,
                        help="Délai entre les appels API en secondes (défaut: 1.0)")
    parser.add_argument("--prod", action="store_true",
                        help="Utilise la base de production (.env.prod)")
    args = parser.parse_args()

    batch_size = max(1, min(args.batch_size, 10))
    regions = SUPPORTED_REGIONS if args.region == "all" else [args.region]

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("ERROR: MISTRAL_API_KEY not set in .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)

    if args.dry_run:
        print("DRY-RUN MODE — sin escrituras en DB\n", flush=True)

    results = []
    for region in regions:
        result = run_region(client, region, args.count, batch_size, args.dry_run, args.delay)
        results.append(result)

    flags = {"es": "🇪🇸", "ar": "🇦🇷", "mx": "🇲🇽", "co": "🇨🇴", "pe": "🇵🇪", "cu": "🇨🇺", "ve": "🇻🇪", "cl": "🇨🇱"}
    print(f"\n{'='*60}", flush=True)
    print("  RESUMEN", flush=True)
    print(f"{'='*60}", flush=True)
    total_ok = total_skip = total_err = 0
    for r in results:
        flag = flags.get(r["region"], r["region"])
        print(f"  {flag} {r['region']:3}  insertados={r['inserted']:4}  omitidos={r['skipped']:4}  errores={r['errors']:4}", flush=True)
        total_ok += r["inserted"]
        total_skip += r["skipped"]
        total_err += r["errors"]
    print(f"  {'─'*50}", flush=True)
    print(f"  TOTAL  insertados={total_ok:4}  omitidos={total_skip:4}  errores={total_err:4}", flush=True)
    if total_err:
        print("\n  Re-ejecuta el script para reintentar — es idempotente.", flush=True)


if __name__ == "__main__":
    main()

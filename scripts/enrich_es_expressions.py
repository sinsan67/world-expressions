#!/usr/bin/env python3
"""
Enrich Spanish idiomatic expressions per region using Mistral API.

Generates authentic modismos, locuciones and sayings anchored in the cultural
tradition of each Spanish-speaking region. Language stored as 'es', region as country code.

Idempotent: existing IDs are skipped. Restart freely.

Usage:
    python3 scripts/enrich_es_expressions.py --region ar --count 100
    python3 scripts/enrich_es_expressions.py --region all --count 100 --prod
    python3 scripts/enrich_es_expressions.py --region mx --count 10 --dry-run

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
            "el cuerpo humano y las emociones",
            "el dinero y la economía doméstica",
            "comida, bebida y la mesa",
            "el trabajo y la pereza",
            "el amor y las relaciones",
            "la política y la sociedad",
            "animales en sentido figurado",
            "la mentira y el engaño",
            "el tiempo y la paciencia",
            "el orgullo y la humildad",
            "la amistad y la traición",
            "la muerte y la vejez",
            "la suerte y el destino",
            "la pereza y la prisa",
            "el habla, el silencio y los rumores",
            "Andalucía — expresiones del sur",
            "Castilla — castellanismos clásicos",
            "argot madrileño y cheli",
            "modismos del siglo XX",
            "jerga juvenil española",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas, modismos y locuciones del español de España, con referencia a:
- Diccionario de la RAE (dle.rae.es) — fraseología oficial
- Redensarten-Index / refranero.rae.es — modismos documentados
- es.wiktionary.org — locuciones con etimología y variantes regionales
- Andalucía, Castilla, Madrid — variedades dialectales

QUÉ ES UN MODISMO / EXPRESIÓN IDIOMÁTICA:
- Una locución verbal o nominal cuyo significado no se deduce literalmente ("meter la pata", "no dar pie con bola")
- PAS una frase completa/proverbio — eso es un refrán
- Puede ser una locución fija, un argot, una expresión coloquial o un modismo regional
- Auténtica y verificable en el español peninsular

CRITERIOS DE CALIDAD:
- Realmente usada por hispanohablantes de España
- Puede ser del registro informal, estándar, argot o formal
- Incluir la variación regional cuando sea relevante (andaluz, madrileño, etc.)

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case (á→a, é→e, í→i, ó→o, ú→u, ñ→n)
- "expression": la expresión en español correcto
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — etimología o contexto cultural (null si desconocido)
- "example": frase natural en español peninsular usando la expresión
- "register": "standard", "informal", "slang" o "formal"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["body", "mistake", "embarrassment"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "es"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "ar": {
        "name": "Argentina",
        "themes": [
            "lunfardo clásico (siglo XIX-XX)",
            "el cuerpo y las emociones en rioplatense",
            "el dinero y la crisis económica",
            "el mate y la camaradería",
            "la viveza criolla y el pícaro",
            "el asado y la comida argentina",
            "el tango y el desamor",
            "la pampa y el gaucho",
            "jerga porteña contemporánea",
            "la familia y las relaciones",
            "el trabajo y la vagancia",
            "el fútbol y el deporte",
            "la política argentina",
            "los apodos y la sorna",
            "el habla de la inmigración italiana (cocoliche)",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y lunfardo de Argentina, con profundo conocimiento de:
- La Academia Porteña del Lunfardo — diccionario completo del lunfardo
- José Gobello — Diccionario lunfardo y otras obras
- El habla rioplatense: voseo, jerga porteña, modismos pampeanos
- La influencia del cocoliche (italiano-español) en el habla argentina

QUÉ ES UN MODISMO ARGENTINO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser lunfardo ("manyar" = entender), jerga porteña, modismo pampeano o gauchesco
- Voseo natural: "¿te das cuenta?", "la estás pifiando"
- NO un refrán completo ni una frase proverbial

CRITERIOS DE CALIDAD:
- Realmente usada por argentinos (no inventada)
- Registrar el origen lunfardo, gauchesco o italiano cuando corresponda
- El registro puede ser informal, slang o estándar rioplatense

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español rioplatense
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen lunfardo, gauchesco, italiano, etc. (null si desconocido)
- "example": frase natural en español rioplatense usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["money", "cunning", "lunfardo"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "ar"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "mx": {
        "name": "México",
        "themes": [
            "el cuerpo y las emociones en mexicano",
            "el dinero y la pobreza",
            "el trabajo y el esfuerzo",
            "la comida mexicana en sentido figurado",
            "el albur y el doble sentido",
            "la familia y el compadrazgo",
            "los animales en expresiones mexicanas",
            "la muerte y el día de muertos",
            "la política y el poder",
            "la suerte y el destino",
            "el amor y el desamor",
            "jerga chilanga (Ciudad de México)",
            "mexicanismos de origen náhuatl",
            "el humor y la ironía mexicana",
            "el campo y la vida rural",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y modismos del español de México, con profundo conocimiento de:
- El Diccionario del Español de México (DEM) — Colegio de México
- Mexicanismos de origen náhuatl incorporados al español cotidiano
- La jerga chilanga (Ciudad de México) y los regionalismos
- El albur mexicano — doble sentido y juego de palabras

QUÉ ES UN MODISMO MEXICANO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser de origen náhuatl ("apapachar", "naco", "chido"), jerga chilanga, o expresión regional
- NO un refrán completo ni una frase proverbial
- Auténtica y usada por mexicanos nativos

CRITERIOS DE CALIDAD:
- Realmente usada por mexicanos (no inventada)
- Mencionar el origen náhuatl o regional cuando sea relevante
- El doble sentido y el humor son bienvenidos cuando son propios de la tradición

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español mexicano
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen náhuatl, regional, etc. (null si desconocido)
- "example": frase natural en español mexicano usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["nahuatl", "humor", "street"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "mx"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "co": {
        "name": "Colombia",
        "themes": [
            "el cuerpo y las emociones en colombiano",
            "el dinero y el rebusque",
            "el trabajo y el esfuerzo",
            "la comida colombiana en sentido figurado",
            "el habla costeña (Caribe colombiano)",
            "el habla paisa (Antioquia)",
            "la familia y la calidez",
            "el amor y el desamor",
            "la política y la viveza criolla",
            "los animales en expresiones colombianas",
            "el café y los campesinos",
            "la naturaleza tropical",
            "el humor costeño",
            "jerga bogotana (cachacos)",
            "expresiones afrocolombianas",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y modismos del español de Colombia, con profundo conocimiento de:
- La Academia Colombiana de la Lengua — diccionario de colombianismos
- El habla paisa (Antioquia): arrieros, "parce", "bacano", "chimbo"
- El habla costeña (Caribe): humor, picardía, expresividad
- El cachaco bogotano — formalismo y distancia
- La influencia afrocolombiana en el habla del Pacífico y el Caribe

QUÉ ES UN MODISMO COLOMBIANO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser paisa, costeño, cachaco o llanero
- Colombianismos como "chimbo", "parce", "mamagallismo", "berraco"
- NO un refrán completo

CRITERIOS DE CALIDAD:
- Realmente usada por colombianos (no inventada)
- Indicar la región de origen cuando sea relevante (paisa, costeño, etc.)
- La calidez y el humor colombiano son bienvenidos

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español colombiano
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen regional, etc. (null si desconocido)
- "example": frase natural en español colombiano usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["friendship", "paisa", "humor"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "co"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "pe": {
        "name": "Perú",
        "themes": [
            "el cuerpo y las emociones en peruano",
            "el dinero y la pobreza",
            "el trabajo y el esfuerzo",
            "la comida peruana en sentido figurado",
            "peruanismos de origen quechua",
            "jerga limeña (barranco, miraflores, callao)",
            "la familia y el barrio",
            "el amor y el desamor",
            "la suerte y el destino",
            "los animales andinos en expresiones",
            "la sierra y la costa — identidades distintas",
            "humor criollo limeño",
            "expresiones amazónicas",
            "el fútbol y el deporte",
            "la política y la corrupción",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y modismos del español de Perú, con profundo conocimiento de:
- La Academia Peruana de la Lengua — diccionario de peruanismos
- El habla limeña criolla: "pata" (amigo), "chamba" (trabajo), "causa" (amigo), "jato" (casa)
- Peruanismos de origen quechua incorporados al español cotidiano
- El habla de la sierra y la selva peruana

QUÉ ES UN MODISMO PERUANO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser de origen quechua ("achachalay", "pachamanca"), jerga limeña, o expresión andina
- Peruanismos como "pata", "chamba", "jato", "causa", "huasca"
- NO un refrán completo

CRITERIOS DE CALIDAD:
- Realmente usada por peruanos (no inventada)
- El origen quechua cuando sea relevante
- Reflejar la diversidad costa/sierra/selva

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español peruano
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen quechua, criollo, etc. (null si desconocido)
- "example": frase natural en español peruano usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["quechua", "friendship", "work"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "pe"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "cu": {
        "name": "Cuba",
        "themes": [
            "el cuerpo y las emociones en cubano",
            "el dinero y el resolver",
            "el trabajo y la burocracia",
            "la comida y la escasez",
            "el mar y la pesca",
            "el choteo y la ironía",
            "la familia y el barrio habanero",
            "el amor y los celos",
            "la religión (Santería, cubanía)",
            "el ron y la fiesta",
            "jerga habanera contemporánea",
            "términos afrocubanos",
            "el humor negro cubano",
            "el deporte (béisbol)",
            "la naturaleza caribeña",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y cubanismos del español de Cuba, con profundo conocimiento de:
- La Academia Cubana de la Lengua — diccionario de cubanismos
- El habla habanera: "asere" (amigo), "yuma" (extranjero), "guagua" (autobús), "jama" (comida)
- Términos afrocubanos (Yoruba/Lucumí) incorporados al español cotidiano
- El choteo cubano: humor con distancia irónica

QUÉ ES UN MODISMO CUBANO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser afrocubano, de jerga habanera, o del habla del guajiro
- Cubanismos como "asere", "yuma", "fula" (dinero), "socio", "resolver"
- NO un refrán completo

CRITERIOS DE CALIDAD:
- Realmente usada por cubanos (no inventada)
- El origen afrocubano (Yoruba) cuando sea relevante
- El choteo (humor irónico) es un rasgo distintivo cubano

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español cubano
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen afrocubano, habanero, etc. (null si desconocido)
- "example": frase natural en español cubano usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["survival", "humor", "afrocuban"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "cu"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "ve": {
        "name": "Venezuela",
        "themes": [
            "el cuerpo y las emociones en venezolano",
            "el dinero y la economía",
            "el trabajo y el esfuerzo",
            "la comida venezolana en sentido figurado",
            "jerga caraqueña contemporánea",
            "el habla maracucha (Maracaibo)",
            "el llanero y el campo",
            "la familia y la calidez",
            "el amor y los celos",
            "los animales de los llanos",
            "el petróleo y la riqueza",
            "el humor venezolano",
            "el béisbol y el deporte",
            "la política y la resistencia",
            "términos indígenas en el habla venezolana",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y venezolanismos del español de Venezuela, con profundo conocimiento de:
- La Academia Venezolana de la Lengua — diccionario de venezolanismos
- El habla caraqueña: "chamo" (joven), "chévere" (genial), "vergatario" (excelente), "pana" (amigo)
- El habla maracucha (zuliana): marcada y distinta del resto del país
- La tradición oral llanera y sus expresiones

QUÉ ES UN MODISMO VENEZOLANO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser caraqueño, maracucho, llanero o caribeño venezolano
- Venezolanismos como "chévere", "pana", "vergatario", "chamo", "corotos"
- NO un refrán completo

CRITERIOS DE CALIDAD:
- Realmente usada por venezolanos (no inventada)
- Indicar si es caraqueño, maracucho o llanero cuando sea relevante
- La picardía y el humor venezolano son bienvenidos

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español venezolano
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen regional, indígena, etc. (null si desconocido)
- "example": frase natural en español venezolano usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["friendship", "humor", "llanos"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "ve"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "cl": {
        "name": "Chile",
        "themes": [
            "el cuerpo y las emociones en chileno",
            "el dinero y la frugalidad",
            "el trabajo y el esfuerzo",
            "la comida chilena en sentido figurado",
            "chilenismos clásicos (el 'po', 'cachai')",
            "jerga santiaguina contemporánea",
            "el habla del sur (Valdivia, Chiloé)",
            "la familia y el hogar",
            "el amor y el desamor",
            "los animales en expresiones chilenas",
            "la naturaleza extrema (Andes, desierto, lluvia)",
            "el vino y la cultura del campo",
            "el humor chileno y el 'achuntar'",
            "términos mapuche en el habla chilena",
            "el fútbol y el deporte",
        ],
        "system_prompt": """Eres un experto en expresiones idiomáticas y chilenismos del español de Chile, con profundo conocimiento de:
- La Academia Chilena de la Lengua — diccionario de chilenismos
- El habla santiaguina: "po" (partícula), "cachai" (¿entiendes?), "al tiro" (enseguida), "fome" (aburrido)
- La influencia mapuche en el español chileno: "huacho", "guata", "pirca", "cahuín"
- El habla del sur lluvioso (Valdivia, Chiloé) vs el norte árido

QUÉ ES UN MODISMO CHILENO:
- Una locución o expresión cuyo significado no se deduce literalmente
- Puede ser de origen mapuche, de jerga santiaguina o del habla rural
- Chilenismos como "cahuín" (chisme), "huevón" (amigo/insulto), "pololo" (novio), "al tiro"
- NO un refrán completo

CRITERIOS DE CALIDAD:
- Realmente usada por chilenos (no inventada)
- El origen mapuche cuando sea relevante
- El carácter austero y formal del chileno vs la jerga informal

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (sin caracteres especiales)
- "expression": la expresión en español chileno
- "meaning": 1-2 frases en español — qué significa
- "origin": 1-2 frases en español — origen mapuche, criollo, etc. (null si desconocido)
- "example": frase natural en español chileno usando la expresión
- "register": "standard", "informal" o "slang"
- "tags": 2-5 tags temáticos en inglés (slugs, ej. ["mapuche", "slang", "humor"])
- "kind": "idiom", "locution" o "word"
- "region": siempre "cl"

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
}

SUPPORTED_REGIONS = list(REGION_CONFIG.keys())
VALID_REGISTERS = {"standard", "informal", "slang", "formal", "vulgar"}
VALID_KINDS = {"idiom", "word", "proverb", "locution"}
KIND_ALIASES = {"expression": "idiom", "phrase": "idiom", "saying": "proverb", "modismo": "idiom", "locución": "locution"}


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
    """Returns all language='es' IDs (global) and all texts for this region (avoid list)."""
    with engine.connect() as conn:
        all_ids = {r.id for r in conn.execute(
            text("SELECT id FROM expressions WHERE language = 'es'")
        ).fetchall()}
        region_texts = [r.text for r in conn.execute(
            text("SELECT text FROM expressions WHERE language = 'es' AND region = :region"),
            {"region": region},
        ).fetchall()]
    return all_ids, region_texts


def insert_expression(expr: dict, existing_ids: set[str]) -> str:
    """Insert expression, using a variant ID if the base slug already exists."""
    base_id = expr["id"]
    final_id = base_id
    if final_id in existing_ids:
        final_id = f"{base_id}-{expr['region']}"
        print(f"      ID conflict — using variant: {final_id}", flush=True)

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO expressions (id, text, language, region, register, kind, source)
                VALUES (:id, :text, 'es', :region, :register, :kind, NULL)
                ON CONFLICT (id) DO NOTHING
            """),
            {
                "id": final_id,
                "text": expr["expression"],
                "region": expr["region"],
                "register": expr.get("register", "standard"),
                "kind": expr["kind"],
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


def validate_expression(expr: dict, region: str) -> tuple[bool, str]:
    required = ["id", "expression", "meaning", "example", "register", "tags"]
    for field in required:
        if field not in expr:
            return False, f"missing field '{field}'"
    if expr["register"] not in VALID_REGISTERS:
        expr["register"] = "standard"
    if not isinstance(expr["tags"], list) or len(expr["tags"]) == 0:
        return False, "tags must be a non-empty list"
    raw_kind = expr.get("kind") or expr.get("type", "idiom")
    expr["kind"] = KIND_ALIASES.get(raw_kind, raw_kind) if raw_kind not in VALID_KINDS else raw_kind
    if expr["kind"] not in VALID_KINDS:
        expr["kind"] = "idiom"
    expr["region"] = region  # enforce region from CLI
    expr["id"] = slugify(expr.get("id") or expr["expression"])
    return True, "ok"


def build_user_message(existing_texts: list[str], region: str, batch_size: int, theme: str) -> str:
    avoid = "\n".join(f"- {e}" for e in existing_texts[-60:]) if existing_texts else "(ninguno aún)"
    region_name = REGION_CONFIG[region]["name"]

    if batch_size == 1:
        return f"""Genera 1 expresión idiomática auténtica de {region_name} sobre el tema: {theme}

Ya en la base de datos — evitar duplicados:
{avoid}

Devuelve un único objeto JSON."""
    else:
        return f"""Genera {batch_size} expresiones idiomáticas auténticas de {region_name}.

Tema de este lote: {theme}
Reglas:
- Cada expresión debe ser distinta de las demás en este lote
- NO repetir ninguna de las expresiones de la lista de abajo
- "region" siempre "{region}", "tags" siempre en inglés
- Variar el registro en el lote (mezcla standard, informal, slang)

Ya en la base de datos — NO generar ninguna de estas:
{avoid}

Devuelve un array JSON de exactamente {batch_size} objetos. Sin markdown, sin texto extra — solo el array JSON."""


def call_mistral(client, region: str, existing_texts: list[str], batch_size: int, theme: str) -> list[dict]:
    config = REGION_CONFIG[region]
    response = client.chat.complete(
        model=MODEL,
        max_tokens=600 * batch_size,
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
    print(f"  {config['name'].upper()} ({region}) — objetivo: {count} expresiones", flush=True)
    print(f"{'='*60}", flush=True)

    existing_ids, region_texts = get_existing(region)
    print(f"  En DB (es total): {len(existing_ids)} expresiones | {region}: {len(region_texts)}\n", flush=True)

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

            valid, reason = validate_expression(expr, region)
            if not valid:
                print(f"    INVÁLIDO ({reason}): {expr.get('expression', '?')}", flush=True)
                errors += 1
                continue

            expr_text = expr["expression"]

            if expr_text in generated_texts:
                print(f"    SKIP (duplicado): {expr_text}", flush=True)
                skipped += 1
                continue

            print(f"    [{ok + 1:3}/{count}] [{expr['kind']}] {expr_text}", flush=True)

            if not dry_run:
                try:
                    final_id = insert_expression(expr, existing_ids)
                    existing_ids.add(final_id)
                except Exception as e:
                    print(f"      DB ERROR: {e}", flush=True)
                    errors += 1
                    continue
            else:
                existing_ids.add(expr["id"])

            generated_texts.append(expr_text)
            ok += 1

        if ok < count:
            time.sleep(delay)

    return {"region": region, "name": config["name"], "inserted": ok, "skipped": skipped, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Enrichissement des expressions idiomatiques espagnoles par région via Mistral")
    parser.add_argument("--region", required=True, choices=SUPPORTED_REGIONS + ["all"],
                        help=f"Région cible ou 'all': {SUPPORTED_REGIONS}")
    parser.add_argument("--count", type=int, default=100,
                        help="Expressions à générer par région (défaut: 100)")
    parser.add_argument("--batch-size", type=int, default=5,
                        help="Expressions par appel API (défaut: 5)")
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

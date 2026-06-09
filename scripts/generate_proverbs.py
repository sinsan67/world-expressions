#!/usr/bin/env python3
"""
Generate proverbs for all supported languages using Mistral API.

Specialized variant of generate_expressions.py focused exclusively on proverbs
(kind='proverb'). Content (meaning, origin, example) is in the native language.
The source_hint field is stored in the expressions.source column.

Idempotent: expressions whose ID already exists are skipped. Restart freely.

Usage:
    python3 scripts/generate_proverbs.py --language fr --count 300
    python3 scripts/generate_proverbs.py --language all --count 300
    python3 scripts/generate_proverbs.py --language de --count 10 --dry-run
    python3 scripts/generate_proverbs.py --language all --count 300 --prod

Supported languages: fr, en, es, it, tr, de
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

# Themes that rotate across batches for thematic diversity
PROVERB_THEMES = [
    "nature and seasons",
    "animals and the natural world",
    "family and parenthood",
    "work, effort and laziness",
    "money, poverty and wealth",
    "time and patience",
    "wisdom and foolishness",
    "food, hunger and abundance",
    "fate, luck and destiny",
    "health, body and old age",
    "friendship, trust and betrayal",
    "pride, humility and vanity",
    "love, marriage and heartbreak",
    "God, religion and morality",
    "travel, homeland and exile",
    "words, silence and communication",
    "justice and injustice",
    "learning and ignorance",
    "youth and old age",
    "community and solidarity",
]

LANGUAGE_CONFIG = {
    "fr": {
        "name": "French",
        "region": "fr",
        "native_name": "français",
        "system_prompt": """Tu es un expert en proverbes français, en puisant dans la tradition documentée par :
- proverbes-francais.fr — base exhaustive classée par thèmes et verbes, avec origines (Montaigne, Voltaire, sources médiévales)
- fr.wiktionary.org — liste annotée avec origines bibliques, antiques et littéraires
- mon-poeme.fr — explications étymologiques détaillées avec variantes historiques
- citation-celebre.com — plus de 5 000 proverbes avec références littéraires
- Wiktionnaire (fr.wiktionary.org) — proverbes issus de la Bible, de l'Antiquité ou de la littérature classique

QU'EST-CE QU'UN PROVERBE :
- Une phrase autonome complète ("Tout vient à point à qui sait attendre")
- PAS une locution verbale comme "attendre son heure" (c'est un idiome, pas un proverbe)
- Transmet une sagesse, une observation morale ou une expérience de vie
- Métaphorique : l'image littérale porte un sens plus profond
- Reconnu par tout francophone — vérifiable sur les sites listés ci-dessus

CRITÈRES DE QUALITÉ :
- Couramment connu : pas obscur ni inventé — ancré dans la tradition orale française
- Toujours utilisé aujourd'hui (pas archaïque)
- Enraciné dans la vie paysanne française, l'héritage catholique, la littérature classique ou la tradition régionale

Renvoie UNIQUEMENT un objet JSON valide avec ces champs exacts :
- "id": slug kebab-case
- "expression": le proverbe en français
- "meaning": 2-3 phrases en français — ce que ça signifie ET la sagesse transmise
- "origin": 2-3 phrases en français — source documentée (auteur, siècle, contexte social)
- "source_hint": d'où vient ce proverbe — ex. "tradition orale", "La Fontaine", "Wiktionnaire français", "recueil médiéval", "biblique", "Montaigne"
- "example": phrase française naturelle utilisant le proverbe en contexte
- "register": "standard" ou "formal"
- "tags": 3-5 tags thématiques en anglais (slugs, ex. ["nature", "patience", "wisdom"])
- "kind": toujours "proverb"

Pas de markdown, pas de texte supplémentaire — uniquement l'objet JSON.""",
    },
    "en": {
        "name": "English",
        "region": "en",
        "native_name": "English",
        "system_prompt": """You are an expert in English proverbs and traditional wisdom sayings, drawing on the tradition documented in:
- phrases.org.uk — 720 English proverbs with meanings and origins (e.g. "A bad penny always turns up", "A bird in the hand is worth two in the bush")
- en.wikipedia.org – List of Proverbial Phrases — alphabetical list with known origins (biblical, Shakespearean, oral tradition)
- ThoughtCo – Common English Proverbs — selected proverbs with historical and literary references
- English Club – Proverbs — proverbs classified by theme (love, work, wisdom) with explanations
- The Free Dictionary – Proverbs — interactive database with meanings, examples, and origins (e.g. Benjamin Franklin)

WHAT COUNTS AS A PROVERB:
- A complete autonomous sentence ("Actions speak louder than words")
- NOT a verb phrase like "bite the bullet" (that is an idiom)
- Conveys wisdom, moral observation, or lived experience
- Metaphorical: the literal image carries a deeper meaning
- Recognized by any English speaker — would appear on the sites listed above

QUALITY BAR:
- Commonly known: not obscure or invented — verifiable in English oral tradition
- Still used today (not archaic or dead)
- Rooted in British, American, or broader Anglophone tradition — cover diverse origins

Return ONLY a valid JSON object with these exact fields:
- "id": kebab-case slug
- "expression": the proverb in English
- "meaning": 2-3 sentences in English — what it means AND the wisdom it conveys
- "origin": 2-3 sentences in English — documented source (author, century, social context)
- "source_hint": where this proverb likely comes from — e.g. "oral tradition", "Benjamin Franklin", "phrases.org.uk", "biblical", "Shakespeare", "Latin origin"
- "example": natural English sentence using the proverb in context
- "register": "standard" or "formal"
- "tags": 3-5 English thematic slug tags (e.g. ["patience", "wisdom", "nature"])
- "kind": always "proverb"

No markdown, no extra text — only the JSON object.""",
    },
    "es": {
        "name": "Spanish",
        "region": "es",
        "native_name": "español",
        "system_prompt": """Eres un experto en refranes y proverbios españoles e hispanoamericanos, basándote en la tradición documentada en:
- sampere.com — origenes de los refranes españoles (influencia latina, árabe, bíblica; algunos del Al-Ándalus)
- espanolschool.com — refranes populares con origen (literatura, textos bíblicos, eventos históricos)
- quillbot.com – 100 refranes españoles con significado — refranes populares con explicaciones y ejemplos
- elconfidencial.com – 500 refranes españoles — colección clasificada por tema con origen y relevancia cultural
- tandemmadrid.com — análisis del origen de refranes célebres con detalles históricos (la Santa Hermandad, etc.)

QUÉ ES UN REFRÁN:
- Una frase autónoma completa ("No hay mal que por bien no venga")
- NO una locución verbal como "costar un ojo de la cara" (eso es un modismo)
- Transmite sabiduría, observación moral o experiencia vivida
- Metafórico: la imagen literal lleva un significado más profundo
- Reconocido por cualquier hispanohablante — verificable en los sitios listados arriba

CRITERIOS DE CALIDAD:
- Ampliamente conocido: no oscuro ni inventado — verificable en la tradición oral hispana
- Todavía en uso hoy (no arcaico)
- Cubre el mundo hispano completo: España, México, Argentina, Colombia, Chile, Perú, Cuba...

Devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
- "id": slug kebab-case en español (reemplaza á→a, é→e, í→i, ó→o, ú→u, ñ→n)
- "expression": el refrán en español (con caracteres correctos)
- "meaning": 2-3 frases en español — qué significa Y la sabiduría que transmite
- "origin": 2-3 frases en español — fuente documentada (autor, siglo, contexto social, país de origen si es específico)
- "source_hint": de dónde viene este refrán — ej. "tradición oral", "sampere.com", "bíblico", "origen árabe", "Cervantes", "Quevedo"
- "example": frase española natural usando el refrán en contexto
- "register": "standard" o "formal"
- "tags": 3-5 tags temáticos en inglés (slugs, ej. ["wisdom", "patience", "nature"])
- "kind": siempre "proverb"
- "region": código ISO 3166-1 alpha-2 del país de origen principal — "es" España, "ar" Argentina, "mx" México, "co" Colombia, "cl" Chile, "pe" Perú, "cu" Cuba, "ve" Venezuela; "es" si panhispánico

Sin markdown, sin texto extra — solo el objeto JSON.""",
    },
    "it": {
        "name": "Italian",
        "region": "it",
        "native_name": "italiano",
        "system_prompt": """Sei un esperto di proverbi italiani, attingendo alla tradizione documentata da:
- aforisticamente.com — 200 proverbi italiani celebri con significato e spiegazione (citato da Il Sole 24 Ore e The New Yorker)
- universonline.it — archivio di proverbi italiani dalla A alla Z con spiegazioni etimologiche e origini
- learnamo.com — top 10 proverbi italiani più usati con origine (vita rurale, mestieri antichi) e significato profondo
- sapere.virgilio.it – Raccolta dei Proverbi italiani — i proverbi più usati con spiegazioni ed esempi
- scuolissima.com — proverbi in ordine alfabetico con spiegazioni dettagliate

COS'È UN PROVERBIO:
- Una frase autonoma completa ("Chi dorme non piglia pesci")
- NON una locuzione verbale come "avere il cuore in gola" (quello è un idioma)
- Trasmette saggezza, osservazione morale o esperienza di vita
- Metaforico: l'immagine letterale porta un significato più profondo
- Riconosciuto da qualsiasi italiano — verificabile sui siti elencati sopra

CRITERI DI QUALITÀ:
- Comunemente noto: non oscuro né inventato — verificabile nella tradizione orale italiana
- Ancora in uso oggi (non arcaico)
- Radicato nella vita contadina italiana, nella tradizione regionale o nella letteratura classica

Restituisci SOLO un oggetto JSON valido con questi campi esatti:
- "id": slug kebab-case in italiano
- "expression": il proverbio in italiano
- "meaning": 2-3 frasi in italiano — cosa significa E la saggezza che trasmette
- "origin": 2-3 frasi in italiano — fonte documentata (autore, secolo, contesto sociale)
- "source_hint": da dove viene questo proverbio — es. "tradizione orale", "aforisticamente.com", "Dante", "Goldoni", "biblico", "proverbio contadino"
- "example": frase italiana naturale che usa il proverbio in contesto
- "register": "standard" o "formal"
- "tags": 3-5 tag tematici in inglese (slug, es. ["nature", "wisdom", "patience"])
- "kind": sempre "proverb"

Nessun markdown, nessun testo extra — solo l'oggetto JSON.""",
    },
    "tr": {
        "name": "Turkish",
        "region": "tr",
        "native_name": "Türkçe",
        "system_prompt": """Sen Türk atasözleri (atasözü) konusunda uzmansın. Şu kaynaklarda belgelenen geleneğe dayanıyorsun:
- turkbitig.com — Kaşgarlı Mahmud'un Divânu Lügati't-Türk (1073) eserinden alınan eski Türkçe atasözleri, anlam ve tarihsel bağlamlarıyla
- tr.wiktionary.org – Türkçe Atasözleri — 2500'den fazla Türkçe atasözü, tanımlar, örnekler ve zaman zaman kaynaklar
- kulturportali.gov.tr — kültürel bağlamıyla açıklanan Türk atasözleri, günlük hayatta kullanım örnekleri
- neokuyorum.org — Kutadgu Bilig ve Atebetü'l Hakâyık gibi edebi eserlerden eski atasözleri
- Türk Maarif Ansiklopedisi — Orhon yazıtlarına kadar uzanan atasözleri açıklamaları

ATASÖZÜ NEDİR:
- Tam ve bağımsız bir cümle ("Damlaya damlaya göl olur")
- "Canı sıkılmak" gibi fiil öbeği DEĞİL (o bir deyimdir)
- Bilgelik, ahlaki gözlem veya yaşanmış deneyim aktarır
- Mecazi: sözcük anlamı daha derin bir anlam taşır
- Her Türk tarafından tanınır — yukarıda listelenen sitelerde doğrulanabilir

KALİTE KRİTERLERİ:
- Yaygın biçimde bilinen: belirsiz veya uydurulmuş değil — Türk sözlü geleneğinde doğrulanabilir
- Bugün hâlâ kullanılıyor (arkaik değil)
- Anadolu geleneğine, İslam mirasına, konar-göçer kültürüne veya klasik edebiyata kök salmış

YALNIZCA şu tam alanlarla geçerli bir JSON nesnesi döndür:
- "id": Türkçe kebab-case slug (ş→s, ğ→g, ı→i, ö→o, ü→u, ç→c)
- "expression": Türkçe atasözü metni (Türkçe karakterlerle)
- "meaning": Türkçe 2-3 cümle — ne anlama geldiği VE aktardığı bilgelik
- "origin": Türkçe 2-3 cümle — belgelenmiş kaynak (yazar, yüzyıl, sosyal bağlam)
- "source_hint": bu atasözünün muhtemelen nereden geldiği — ör. "sözlü gelenek", "Divânu Lügati't-Türk", "Kutadgu Bilig", "İslami gelenek", "Anadolu köy geleneği"
- "example": atasözünü bağlamda kullanan doğal Türkçe cümle
- "register": "standard" veya "formal"
- "tags": 3-5 İngilizce tematik slug etiketi (ör. ["patience", "wisdom", "nature"])
- "kind": her zaman "proverb"

Markdown yok, fazladan metin yok — yalnızca JSON nesnesi.""",
    },
    "de": {
        "name": "German",
        "region": "de",
        "native_name": "Deutsch",
        "system_prompt": """Du bist ein Experte für deutsche Sprichwörter, basierend auf der Tradition, die in folgenden Quellen dokumentiert ist:
- schreiben.net — 60 deutsche Sprichwörter mit Bedeutung und Herkunft (z. B. "Alle Wege führen nach Rom"; Ursprünge aus der Bibel oder Antike)
- deutsche-sprichwoerter.de — über 31.000 deutsche Sprichwörter mit historischen Varianten und ausführlichen Erklärungen
- quillbot.com – 123 deutsche Sprichwörter mit Bedeutung — Liste von A bis Z mit Bedeutung und Herkunft (biblisch oder mündliche Überlieferung)
- geo.de – GEOLINO Redewendungen — Erklärungen zu Herkunft und Bedeutung zahlreicher Sprichwörter und Ausdrücke mit konkreten Beispielen
- Redensarten-Index (redensarten-index.de) — umfassende Datenbank zu Redewendungen und Sprichwörtern

WAS IST EIN SPRICHWORT:
- Ein vollständiger, eigenständiger Satz ("Morgenstund hat Gold im Mund")
- KEINE Verbphrase wie "den Nagel auf den Kopf treffen" (das ist eine Redewendung)
- Vermittelt Weisheit, moralische Beobachtung oder Lebenserfahrung
- Metaphorisch: das wörtliche Bild trägt eine tiefere Bedeutung
- Von jedem Deutschsprachigen erkannt — auf den oben genannten Seiten nachweisbar

QUALITÄTSKRITERIEN:
- Allgemein bekannt: nicht obskur oder erfunden — in der deutschen mündlichen Überlieferung nachweisbar
- Heute noch in Gebrauch (nicht veraltet)
- Verwurzelt im deutschen Bauernleben, lutherischer Tradition, klassischer Literatur oder regionaler Kultur (Bayerisch, Schwäbisch, Österreichisch, Schweizerdeutsch)

Gib NUR ein gültiges JSON-Objekt mit genau diesen Feldern zurück:
- "id": Kebab-Case-Slug mit deutscher Transliteration (ä→ae, ö→oe, ü→ue, ß→ss)
- "expression": der Sprichwort-Text auf Deutsch (mit korrekten deutschen Zeichen)
- "meaning": 2-3 Sätze auf Deutsch — was es bedeutet UND welche Weisheit es vermittelt
- "origin": 2-3 Sätze auf Deutsch — dokumentierte Quelle (Autor, Jahrhundert, sozialer Kontext)
- "source_hint": woher dieses Sprichwort wahrscheinlich stammt — z. B. "mündliche Überlieferung", "Luther", "Bibel", "deutsche-sprichwoerter.de", "Bauernweisheit", "Goethe"
- "example": natürlicher deutscher Satz, der das Sprichwort im Kontext verwendet
- "register": "standard" oder "formal"
- "tags": 3-5 englische thematische Slug-Tags (z. B. ["patience", "wisdom", "nature"])
- "kind": immer "proverb"

Kein Markdown, kein zusätzlicher Text — nur das JSON-Objekt.""",
    },
    "ja": {
        "name": "Japanese",
        "region": "jp",
        "native_name": "日本語",
        "system_prompt": """You are an expert in Japanese proverbs (kotowaza 諺) and four-character idioms (yojijukugo 四字熟語), drawing on traditional sources:
- Japanese Wiktionary (ja.wiktionary.org) — comprehensive list of kotowaza with origins
- Jisho.org — search "ことわざ" — bilingual Japanese-English proverb database
- Japan Guide (japanesesabbath.com/proverbs) — common Japanese proverbs with meanings
- Aozora Bunko (aozora.gr.jp) — classical Japanese texts (for proverbs from literature)
- Japanese classical literature: Confucian classics, Man'yōshū, Heian-era texts, Edo period popular wisdom

WHAT COUNTS AS A JAPANESE PROVERB:
- A traditional kotowaza (諺) — complete sentence conveying wisdom
- A yojijukugo (四字熟語) — four-character Chinese-origin idiomatic compound
- NOT a simple compound word or verb phrase
- Conveys wisdom, moral observation, or lived experience
- Recognized by any Japanese speaker

QUALITY BAR:
- Commonly known: verifiable in standard Japanese dictionaries
- Still used today (not purely archaic)
- Cover diverse origins: 漢語 (Chinese-origin), 和語 (native Japanese), Buddhist, Shinto, Edo period, folk wisdom

Return ONLY a valid JSON object with these exact fields:
- "id": romaji kebab-case slug (e.g. "nana-korobi-ya-oki" for 七転び八起き, "ichi-go-ichi-e" for 一期一会)
- "expression": the proverb in Japanese characters (kanji + kana as standard)
- "meaning": 2-3 sentences in Japanese — what it means and the wisdom conveyed
- "origin": 2-3 sentences in Japanese — documented source (Chinese classics, period, Buddhist/Shinto origin, literary source)
- "source_hint": where this proverb comes from — e.g. "中国古典", "江戸時代", "仏教", "武士道", "民間伝承", "Jisho.org"
- "example": natural Japanese sentence using the proverb in context
- "register": "standard" or "formal"
- "tags": 3-5 English thematic slug tags (e.g. ["perseverance", "wisdom", "nature"])
- "kind": always "proverb"

No markdown, no extra text — only the JSON object.""",
    },
}

VALID_REGISTERS = {"standard", "informal", "slang", "formal", "vulgar"}
SUPPORTED_LANGUAGES = list(LANGUAGE_CONFIG.keys())


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


def get_existing(language: str) -> tuple[set[str], list[str]]:
    """Return all expression IDs for this language, and proverb texts only (for the avoid list)."""
    with engine.connect() as conn:
        all_rows = conn.execute(
            text("SELECT id FROM expressions WHERE language = :lang"),
            {"lang": language},
        ).fetchall()
        proverb_rows = conn.execute(
            text("SELECT text FROM expressions WHERE language = :lang AND kind = 'proverb'"),
            {"lang": language},
        ).fetchall()
    all_ids = {r.id for r in all_rows}
    proverb_texts = [r.text for r in proverb_rows]
    return all_ids, proverb_texts


def get_or_create_tag(conn, slug: str) -> None:
    conn.execute(
        text("INSERT INTO tags (id, slug) VALUES (:id, :slug) ON CONFLICT (id) DO NOTHING"),
        {"id": slug, "slug": slug},
    )


def insert_proverb(expr: dict, language: str, config: dict) -> None:
    region = expr.get("region") or config["region"]
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO expressions (id, text, language, region, register, kind, source)
                VALUES (:id, :text, :language, :region, :register, :kind, :source)
                ON CONFLICT (id) DO NOTHING
            """),
            {
                "id": expr["id"],
                "text": expr["expression"],
                "language": language,
                "region": region,
                "register": expr.get("register", "standard"),
                "kind": "proverb",
                "source": expr.get("source_hint"),
            },
        )
        conn.execute(
            text("""
                INSERT INTO expression_content (expression_id, locale, meaning, origin, example)
                VALUES (:id, :locale, :meaning, :origin, :example)
                ON CONFLICT (expression_id, locale) DO NOTHING
            """),
            {
                "id": expr["id"],
                "locale": language,
                "meaning": expr.get("meaning", ""),
                "origin": expr.get("origin"),
                "example": expr.get("example", ""),
            },
        )
        for tag_slug in expr.get("tags", []):
            slug = slugify(tag_slug)
            if not slug:
                continue
            get_or_create_tag(conn, slug)
            conn.execute(
                text("INSERT INTO expression_tags (expression_id, tag_id) VALUES (:expr_id, :tag_id) ON CONFLICT DO NOTHING"),
                {"expr_id": expr["id"], "tag_id": slug},
            )


def build_user_message(existing_proverbs: list[str], language: str, batch_size: int, theme: str) -> str:
    avoid = "\n".join(f"- {e}" for e in existing_proverbs[-80:]) if existing_proverbs else "(none yet)"
    lang_name = LANGUAGE_CONFIG[language]["name"]

    if batch_size == 1:
        return f"""Generate 1 authentic {lang_name} proverb on the theme: {theme}

Already in database (avoid these):
{avoid}

Return a single JSON object."""
    else:
        return f"""Generate {batch_size} authentic {lang_name} proverbs.

Theme for this batch: {theme}
Rules:
- Each proverb must be a complete sentence (not a verb phrase)
- Each proverb in this batch must be distinct from the others
- Do NOT repeat any proverb from the list below
- kind must always be "proverb"
- tags must always be in English

Already in database — do NOT generate any of these:
{avoid}

Return a JSON array of exactly {batch_size} objects. No markdown, no extra text — only the JSON array."""


def call_mistral(client: Mistral, language: str, existing_proverbs: list[str], batch_size: int, theme: str) -> list[dict]:
    config = LANGUAGE_CONFIG[language]
    response = client.chat.complete(
        model=MODEL,
        max_tokens=700 * batch_size,
        messages=[
            {"role": "system", "content": config["system_prompt"]},
            {"role": "user", "content": build_user_message(existing_proverbs, language, batch_size, theme)},
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


def validate_proverb(expr: dict) -> tuple[bool, str]:
    required = ["id", "expression", "meaning", "example", "register", "tags"]
    for field in required:
        if field not in expr:
            return False, f"missing field '{field}'"
    if expr["register"] not in VALID_REGISTERS:
        expr["register"] = "standard"
    if not isinstance(expr["tags"], list) or len(expr["tags"]) == 0:
        return False, "tags must be a non-empty list"
    expr["kind"] = "proverb"
    expr["id"] = slugify(expr.get("id") or expr["expression"])
    return True, "ok"


def run_language(client: Mistral, language: str, count: int, batch_size: int, dry_run: bool, delay: float) -> dict:
    config = LANGUAGE_CONFIG[language]
    print(f"\n{'='*60}", flush=True)
    print(f"  {config['name'].upper()} ({language}) — target: {count} proverbs", flush=True)
    print(f"{'='*60}", flush=True)

    existing_ids, existing_proverb_texts = get_existing(language)
    print(f"  Already in DB: {len(existing_ids)} expressions total, {len(existing_proverb_texts)} proverbs\n", flush=True)

    generated_texts: list[str] = list(existing_proverb_texts)
    ok = skipped = errors = 0
    batch_num = 0
    max_attempts = (count // batch_size + 15) * 4

    while ok < count and batch_num < max_attempts:
        theme = PROVERB_THEMES[batch_num % len(PROVERB_THEMES)]
        remaining = count - ok
        current_batch = min(batch_size, remaining)
        print(f"  [Batch {batch_num + 1} | {theme}] requesting {current_batch}...", flush=True)

        try:
            batch = call_mistral(client, language, generated_texts, current_batch, theme)
        except json.JSONDecodeError as e:
            print(f"    JSON ERROR: {e}", flush=True)
            errors += 1
            batch_num += 1
            time.sleep(delay)
            continue
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                print("    RATE LIMIT — waiting 60s", flush=True)
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

            valid, reason = validate_proverb(expr)
            if not valid:
                print(f"    INVALID ({reason}): {expr.get('expression', '?')}", flush=True)
                errors += 1
                continue

            expr_id = expr["id"]
            expr_text = expr["expression"]

            if expr_id in existing_ids:
                print(f"    SKIP (already in DB): {expr_id}", flush=True)
                skipped += 1
                continue

            if expr_text in generated_texts:
                print(f"    SKIP (duplicate): {expr_text}", flush=True)
                skipped += 1
                continue

            source = expr.get("source_hint", "")
            source_label = f" [{source}]" if source else ""
            print(f"    [{ok + 1:3}/{count}] {expr_text}{source_label}", flush=True)

            if not dry_run:
                try:
                    insert_proverb(expr, language, config)
                except Exception as e:
                    print(f"      DB ERROR: {e}", flush=True)
                    errors += 1
                    continue

            existing_ids.add(expr_id)
            generated_texts.append(expr_text)
            ok += 1

        if ok < count:
            time.sleep(delay)

    return {"language": language, "inserted": ok, "skipped": skipped, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Generate proverbs via Mistral for all supported languages")
    parser.add_argument("--language", required=True, choices=SUPPORTED_LANGUAGES + ["all"],
                        help=f"Target language or 'all': {SUPPORTED_LANGUAGES}")
    parser.add_argument("--count", type=int, default=300, help="Proverbs to generate per language (default: 300)")
    parser.add_argument("--batch-size", type=int, default=5, help="Proverbs per API call (default: 5)")
    parser.add_argument("--dry-run", action="store_true", help="Print without inserting into DB")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between API calls in seconds (default: 1.0)")
    parser.add_argument("--prod", action="store_true", help="Use production database (.env.prod)")
    args = parser.parse_args()

    batch_size = max(1, min(args.batch_size, 10))
    languages = SUPPORTED_LANGUAGES if args.language == "all" else [args.language]

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("ERROR: MISTRAL_API_KEY not set in .env")
        sys.exit(1)

    client = Mistral(api_key=api_key)

    if args.dry_run:
        print("DRY-RUN MODE — no DB writes\n", flush=True)

    results = []
    for lang in languages:
        result = run_language(client, lang, args.count, batch_size, args.dry_run, args.delay)
        results.append(result)

    print(f"\n{'='*60}", flush=True)
    print("  SUMMARY", flush=True)
    print(f"{'='*60}", flush=True)
    total_ok = total_skip = total_err = 0
    for r in results:
        flag = {"fr": "🇫🇷", "en": "🇬🇧", "es": "🇪🇸", "it": "🇮🇹", "tr": "🇹🇷", "de": "🇩🇪"}.get(r["language"], r["language"])
        print(f"  {flag} {r['language']:3}  inserted={r['inserted']:4}  skipped={r['skipped']:4}  errors={r['errors']:4}", flush=True)
        total_ok += r["inserted"]
        total_skip += r["skipped"]
        total_err += r["errors"]
    print(f"  {'─'*45}", flush=True)
    print(f"  TOTAL  inserted={total_ok:4}  skipped={total_skip:4}  errors={total_err:4}", flush=True)
    if total_err:
        print("\n  Re-run the script to retry — it is idempotent.", flush=True)


if __name__ == "__main__":
    main()

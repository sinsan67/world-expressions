"""
Remplit la table tag_names avec les traductions des tags canoniques.

Pour chaque tag (slug anglais), insère les noms dans les 5 langues :
fr, en, es, it, tr.

Idempotent : utilise INSERT ... ON CONFLICT DO UPDATE.

Usage :
  python3 scripts/populate_tag_names.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config import engine

# Format : slug_anglais → {locale: nom_affiché}
TAG_NAMES = {
    "work":             {"fr": "travail",         "en": "work",           "es": "trabajo",       "it": "lavoro",         "tr": "iş"},
    "animals":          {"fr": "animaux",          "en": "animals",        "es": "animales",      "it": "animali",        "tr": "hayvanlar"},
    "relationships":    {"fr": "relations",        "en": "relationships",  "es": "relaciones",    "it": "relazioni",      "tr": "ilişkiler"},
    "emotions":         {"fr": "émotions",         "en": "emotions",       "es": "emociones",     "it": "emozioni",       "tr": "duygular"},
    "food":             {"fr": "nourriture",       "en": "food",           "es": "comida",        "it": "cibo",           "tr": "yiyecek"},
    "time":             {"fr": "temps",            "en": "time",           "es": "tiempo",        "it": "tempo",          "tr": "zaman"},
    "health":           {"fr": "santé",            "en": "health",         "es": "salud",         "it": "salute",         "tr": "sağlık"},
    "weather":          {"fr": "météo",            "en": "weather",        "es": "clima",         "it": "meteo",          "tr": "hava"},
    "money":            {"fr": "argent",           "en": "money",          "es": "dinero",        "it": "denaro",         "tr": "para"},
    "body":             {"fr": "corps",            "en": "body",           "es": "cuerpo",        "it": "corpo",          "tr": "vücut"},
    "character":        {"fr": "caractère",        "en": "character",      "es": "carácter",      "it": "carattere",      "tr": "karakter"},
    "failure":          {"fr": "échec",            "en": "failure",        "es": "fracaso",       "it": "fallimento",     "tr": "başarısızlık"},
    "success":          {"fr": "succès",           "en": "success",        "es": "éxito",         "it": "successo",       "tr": "başarı"},
    "sadness":          {"fr": "tristesse",        "en": "sadness",        "es": "tristeza",      "it": "tristezza",      "tr": "üzüntü"},
    "fear":             {"fr": "peur",             "en": "fear",           "es": "miedo",         "it": "paura",          "tr": "korku"},
    "love":             {"fr": "amour",            "en": "love",           "es": "amor",          "it": "amore",          "tr": "aşk"},
    "anger":            {"fr": "colère",           "en": "anger",          "es": "ira",           "it": "rabbia",         "tr": "öfke"},
    "lying":            {"fr": "mensonge",         "en": "lying",          "es": "mentira",       "it": "menzogna",       "tr": "yalan"},
    "clumsiness":       {"fr": "maladresse",       "en": "clumsiness",     "es": "torpeza",       "it": "goffaggine",     "tr": "beceriksizlik"},
    "irony":            {"fr": "ironie",           "en": "irony",          "es": "ironía",        "it": "ironia",         "tr": "ironi"},
    "exaggeration":     {"fr": "exagération",      "en": "exaggeration",   "es": "exageración",   "it": "esagerazione",   "tr": "abartı"},
    "slang":            {"fr": "argot",            "en": "slang",          "es": "jerga",         "it": "gergo",          "tr": "argo"},
    "disappointment":   {"fr": "déception",        "en": "disappointment", "es": "decepción",     "it": "delusione",      "tr": "hayal kırıklığı"},
    "energy":           {"fr": "énergie",          "en": "energy",         "es": "energía",       "it": "energia",        "tr": "enerji"},
    "politics":         {"fr": "politique",        "en": "politics",       "es": "política",      "it": "politica",       "tr": "siyaset"},
    "difficulty":       {"fr": "difficulté",       "en": "difficulty",     "es": "dificultad",    "it": "difficoltà",     "tr": "zorluk"},
    "laziness":         {"fr": "paresse",          "en": "laziness",       "es": "pereza",        "it": "pigrizia",       "tr": "tembellik"},
    "deception":        {"fr": "tromperie",        "en": "deception",      "es": "engaño",        "it": "inganno",        "tr": "aldatma"},
    "mistake":          {"fr": "erreur",           "en": "mistake",        "es": "error",         "it": "errore",         "tr": "hata"},
    "colors":           {"fr": "couleurs",         "en": "colors",         "es": "colores",       "it": "colori",         "tr": "renkler"},
    "opportunism":      {"fr": "opportunisme",     "en": "opportunism",    "es": "oportunismo",   "it": "opportunismo",   "tr": "fırsatçılık"},
    "escape":           {"fr": "fuite",            "en": "escape",         "es": "huida",         "it": "fuga",           "tr": "kaçış"},
    "distrust":         {"fr": "méfiance",         "en": "distrust",       "es": "desconfianza",  "it": "diffidenza",     "tr": "güvensizlik"},
    "resilience":       {"fr": "résilience",       "en": "resilience",     "es": "resiliencia",   "it": "resilienza",     "tr": "dayanıklılık"},
    "conflict":         {"fr": "conflit",          "en": "conflict",       "es": "conflicto",     "it": "conflitto",      "tr": "çatışma"},
    "honesty":          {"fr": "honnêteté",        "en": "honesty",        "es": "honestidad",    "it": "onestà",         "tr": "dürüstlük"},
    "caution":          {"fr": "prudence",         "en": "caution",        "es": "prudencia",     "it": "prudenza",       "tr": "ihtiyat"},
    "resourcefulness":  {"fr": "débrouillardise",  "en": "resourcefulness","es": "ingenio",       "it": "intraprendenza", "tr": "çözüm bulma"},
    "luck":             {"fr": "chance",           "en": "luck",           "es": "suerte",        "it": "fortuna",        "tr": "şans"},
    "decision":         {"fr": "décision",         "en": "decision",       "es": "decisión",      "it": "decisione",      "tr": "karar"},
    "betrayal":         {"fr": "trahison",         "en": "betrayal",       "es": "traición",      "it": "tradimento",     "tr": "ihanet"},
    "optimism":         {"fr": "optimisme",        "en": "optimism",       "es": "optimismo",     "it": "ottimismo",      "tr": "iyimserlik"},
    "freedom":          {"fr": "liberté",          "en": "freedom",        "es": "libertad",      "it": "libertà",        "tr": "özgürlük"},
    "speed":            {"fr": "rapidité",         "en": "speed",          "es": "velocidad",     "it": "velocità",       "tr": "hız"},
    "movement":         {"fr": "mouvement",        "en": "movement",       "es": "movimiento",    "it": "movimento",      "tr": "hareket"},
    "vulgarity":        {"fr": "vulgarité",        "en": "vulgarity",      "es": "vulgaridad",    "it": "volgarità",      "tr": "kaba dil"},
    "everyday":         {"fr": "quotidien",        "en": "everyday",       "es": "cotidiano",     "it": "quotidiano",     "tr": "günlük"},
    "leaving":          {"fr": "départ",           "en": "leaving",        "es": "partida",       "it": "partenza",       "tr": "ayrılık"},
    "wisdom":           {"fr": "sagesse",          "en": "wisdom",         "es": "sabiduría",     "it": "saggezza",       "tr": "bilgelik"},
    "generosity":       {"fr": "générosité",       "en": "generosity",     "es": "generosidad",   "it": "generosità",     "tr": "cömertlik"},
    "responsibility":   {"fr": "responsabilité",   "en": "responsibility", "es": "responsabilidad","it": "responsabilità", "tr": "sorumluluk"},
    "consequences":     {"fr": "conséquences",     "en": "consequences",   "es": "consecuencias", "it": "conseguenze",    "tr": "sonuçlar"},
    "mockery":          {"fr": "moquerie",         "en": "mockery",        "es": "burla",         "it": "scherno",        "tr": "alay"},
    "friendship":       {"fr": "amitié",           "en": "friendship",     "es": "amistad",       "it": "amicizia",       "tr": "dostluk"},
    "acceptance":       {"fr": "acceptation",      "en": "acceptance",     "es": "aceptación",    "it": "accettazione",   "tr": "kabul"},
    "autonomy":         {"fr": "autonomie",        "en": "autonomy",       "es": "autonomía",     "it": "autonomia",      "tr": "özerklik"},
    "criticism":        {"fr": "critique",         "en": "criticism",      "es": "crítica",       "it": "critica",        "tr": "eleştiri"},
    "effort":           {"fr": "effort",           "en": "effort",         "es": "esfuerzo",      "it": "sforzo",         "tr": "çaba"},
    "communication":    {"fr": "communication",    "en": "communication",  "es": "comunicación",  "it": "comunicazione",  "tr": "iletişim"},
    "patience":         {"fr": "patience",         "en": "patience",       "es": "paciencia",     "it": "pazienza",       "tr": "sabır"},
    "conversation":     {"fr": "conversation",     "en": "conversation",   "es": "conversación",  "it": "conversazione",  "tr": "konuşma"},
    "courage":          {"fr": "courage",          "en": "courage",        "es": "coraje",        "it": "coraggio",       "tr": "cesaret"},
    "surprise":         {"fr": "surprise",         "en": "surprise",       "es": "sorpresa",      "it": "sorpresa",       "tr": "sürpriz"},
    "silence":          {"fr": "silence",          "en": "silence",        "es": "silencio",      "it": "silenzio",       "tr": "sessizlik"},
    "humor":            {"fr": "humour",           "en": "humor",          "es": "humor",         "it": "umorismo",       "tr": "mizah"},
    "intelligence":     {"fr": "intelligence",     "en": "intelligence",   "es": "inteligencia",  "it": "intelligenza",   "tr": "zeka"},
    "secret":           {"fr": "secret",           "en": "secret",         "es": "secreto",       "it": "segreto",        "tr": "sır"},
    "sport":            {"fr": "sport",            "en": "sport",          "es": "deporte",       "it": "sport",          "tr": "spor"},
    "information":      {"fr": "information",      "en": "information",    "es": "información",   "it": "informazione",   "tr": "bilgi"},
    "action":           {"fr": "action",           "en": "action",         "es": "acción",        "it": "azione",         "tr": "eylem"},
    "motivation":       {"fr": "motivation",       "en": "motivation",     "es": "motivación",    "it": "motivazione",    "tr": "motivasyon"},
    "performance":      {"fr": "performance",      "en": "performance",    "es": "rendimiento",   "it": "prestazione",    "tr": "performans"},
    "frustration":      {"fr": "frustration",      "en": "frustration",    "es": "frustración",   "it": "frustrazione",   "tr": "hayal kırıklığı"},
    "proverb":          {"fr": "proverbe",         "en": "proverb",        "es": "proverbio",     "it": "proverbio",      "tr": "atasözü"},
    "culture":          {"fr": "culture",          "en": "culture",        "es": "cultura",       "it": "cultura",        "tr": "kültür"},
    "ambition":         {"fr": "ambition",         "en": "ambition",       "es": "ambición",      "it": "ambizione",      "tr": "hırs"},
    "attention":        {"fr": "attention",        "en": "attention",      "es": "atención",      "it": "attenzione",     "tr": "dikkat"},
    "directness":       {"fr": "franchise",        "en": "directness",     "es": "franqueza",     "it": "schiettezza",    "tr": "dürüstlük"},
    "confidence":       {"fr": "confiance",        "en": "confidence",     "es": "confianza",     "it": "fiducia",        "tr": "güven"},
    "responsibility":   {"fr": "responsabilité",   "en": "responsibility", "es": "responsabilidad","it": "responsabilità", "tr": "sorumluluk"},
}


def populate(dry_run: bool = False):
    with engine.begin() as conn:
        existing_tags = {r.id for r in conn.execute(text("SELECT id FROM tags")).fetchall()}

        inserted = 0
        skipped_tags = []

        for slug, names in TAG_NAMES.items():
            if slug not in existing_tags:
                skipped_tags.append(slug)
                continue

            for locale, name in names.items():
                if not dry_run:
                    conn.execute(text("""
                        INSERT INTO tag_names (tag_id, locale, name)
                        VALUES (:tag_id, :locale, :name)
                        ON CONFLICT (tag_id, locale) DO UPDATE SET name = EXCLUDED.name
                    """), {"tag_id": slug, "locale": locale, "name": name})
                inserted += 1

        print(f"{'[DRY-RUN] ' if dry_run else ''}Traductions insérées : {inserted} lignes")
        if skipped_tags:
            print(f"Tags absents de la base (ignorés) : {skipped_tags}")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    print(f"{'[DRY-RUN] ' if dry_run else ''}Remplissage tag_names...\n")
    populate(dry_run=dry_run)
    print("Terminé.")

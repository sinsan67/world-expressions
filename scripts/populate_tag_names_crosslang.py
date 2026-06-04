"""
Complète la table tag_names avec les traductions FR/ES/IT/TR pour les tags
qui n'ont actuellement que l'entrée EN (tags issus de la normalisation V3A).

Couvre 195 tags avec >= 5 expressions. Idempotent : INSERT ... ON CONFLICT DO UPDATE.

Usage :
  python3 scripts/populate_tag_names_crosslang.py             # local (.env)
  python3 scripts/populate_tag_names_crosslang.py --prod      # Neon ep-dawn-smoke
  python3 scripts/populate_tag_names_crosslang.py --dry-run   # aperçu sans écrire
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

if "--prod" in sys.argv:
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.prod"))
else:
    load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/expressions_dev")
engine = create_engine(DATABASE_URL)

# slug anglais → {locale: nom affiché}
# Seules les locales non-EN sont listées ici ; l'entrée EN existe déjà.
TAG_NAMES = {
    "family":          {"fr": "famille",           "es": "familia",             "it": "famiglia",          "tr": "aile"},
    "fate":            {"fr": "destin",             "es": "destino",             "it": "destino",           "tr": "kader"},
    "trust":           {"fr": "confiance",          "es": "confianza",           "it": "fiducia",           "tr": "güven"},
    "australian":      {"fr": "australien",         "es": "australiano",         "it": "australiano",       "tr": "avustralya"},
    "pride":           {"fr": "fierté",             "es": "orgullo",             "it": "orgoglio",          "tr": "gurur"},
    "hope":            {"fr": "espoir",             "es": "esperanza",           "it": "speranza",          "tr": "umut"},
    "advice":          {"fr": "conseil",            "es": "consejo",             "it": "consiglio",         "tr": "tavsiye"},
    "destiny":         {"fr": "destin",             "es": "destino",             "it": "destino",           "tr": "kader"},
    "travel":          {"fr": "voyage",             "es": "viaje",               "it": "viaggio",           "tr": "yolculuk"},
    "humility":        {"fr": "humilité",           "es": "humildad",            "it": "umiltà",            "tr": "alçakgönüllülük"},
    "british":         {"fr": "britannique",        "es": "británico",           "it": "britannico",        "tr": "britanya"},
    "loyalty":         {"fr": "loyauté",            "es": "lealtad",             "it": "lealtà",            "tr": "sadakat"},
    "youth":           {"fr": "jeunesse",           "es": "juventud",            "it": "gioventù",          "tr": "gençlik"},
    "poverty":         {"fr": "pauvreté",           "es": "pobreza",             "it": "povertà",           "tr": "yoksulluk"},
    "opportunity":     {"fr": "opportunité",        "es": "oportunidad",         "it": "opportunità",       "tr": "fırsat"},
    "emotion":         {"fr": "émotion",            "es": "emoción",             "it": "emozione",          "tr": "duygu"},
    "marriage":        {"fr": "mariage",            "es": "matrimonio",          "it": "matrimonio",        "tr": "evlilik"},
    "truth":           {"fr": "vérité",             "es": "verdad",              "it": "verità",            "tr": "gerçek"},
    "experience":      {"fr": "expérience",         "es": "experiencia",         "it": "esperienza",        "tr": "deneyim"},
    "shame":           {"fr": "honte",              "es": "vergüenza",           "it": "vergogna",          "tr": "utanç"},
    "hospitality":     {"fr": "hospitalité",        "es": "hospitalidad",        "it": "ospitalità",        "tr": "misafirperverlik"},
    "death":           {"fr": "mort",               "es": "muerte",              "it": "morte",             "tr": "ölüm"},
    "appearance":      {"fr": "apparence",          "es": "apariencia",          "it": "apparenza",         "tr": "görünüş"},
    "appearances":     {"fr": "apparences",         "es": "apariencias",         "it": "apparenze",         "tr": "görünüşler"},
    "change":          {"fr": "changement",         "es": "cambio",              "it": "cambiamento",       "tr": "değişim"},
    "support":         {"fr": "soutien",            "es": "apoyo",               "it": "supporto",          "tr": "destek"},
    "determination":   {"fr": "détermination",      "es": "determinación",       "it": "determinazione",    "tr": "kararlılık"},
    "risk":            {"fr": "risque",             "es": "riesgo",              "it": "rischio",           "tr": "risk"},
    "faith":           {"fr": "foi",                "es": "fe",                  "it": "fede",              "tr": "inanç"},
    "behavior":        {"fr": "comportement",       "es": "comportamiento",      "it": "comportamento",     "tr": "davranış"},
    "learning":        {"fr": "apprentissage",      "es": "aprendizaje",         "it": "apprendimento",     "tr": "öğrenme"},
    "power":           {"fr": "pouvoir",            "es": "poder",               "it": "potere",            "tr": "güç"},
    "unity":           {"fr": "unité",              "es": "unidad",              "it": "unità",             "tr": "birlik"},
    "skill":           {"fr": "compétence",         "es": "habilidad",           "it": "abilità",           "tr": "beceri"},
    "judgment":        {"fr": "jugement",           "es": "juicio",              "it": "giudizio",          "tr": "yargı"},
    "value":           {"fr": "valeur",             "es": "valor",               "it": "valore",            "tr": "değer"},
    "values":          {"fr": "valeurs",            "es": "valores",             "it": "valori",            "tr": "değerler"},
    "timing":          {"fr": "timing",             "es": "momento oportuno",    "it": "tempismo",          "tr": "zamanlama"},
    "memory":          {"fr": "mémoire",            "es": "memoria",             "it": "memoria",           "tr": "hafıza"},
    "survival":        {"fr": "survie",             "es": "supervivencia",       "it": "sopravvivenza",     "tr": "hayatta kalma"},
    "progress":        {"fr": "progrès",            "es": "progreso",            "it": "progresso",         "tr": "ilerleme"},
    "preparation":     {"fr": "préparation",        "es": "preparación",         "it": "preparazione",      "tr": "hazırlık"},
    "healing":         {"fr": "guérison",           "es": "curación",            "it": "guarigione",        "tr": "iyileşme"},
    "gratitude":       {"fr": "gratitude",          "es": "gratitud",            "it": "gratitudine",       "tr": "şükran"},
    "speech":          {"fr": "discours",           "es": "discurso",            "it": "discorso",          "tr": "konuşma"},
    "authority":       {"fr": "autorité",           "es": "autoridad",           "it": "autorità",          "tr": "otorite"},
    "commitment":      {"fr": "engagement",         "es": "compromiso",          "it": "impegno",           "tr": "bağlılık"},
    "efficiency":      {"fr": "efficacité",         "es": "eficiencia",          "it": "efficienza",        "tr": "verimlilik"},
    "equality":        {"fr": "égalité",            "es": "igualdad",            "it": "uguaglianza",       "tr": "eşitlik"},
    "happiness":       {"fr": "bonheur",            "es": "felicidad",           "it": "felicità",          "tr": "mutluluk"},
    "reward":          {"fr": "récompense",         "es": "recompensa",          "it": "ricompensa",        "tr": "ödül"},
    "informal":        {"fr": "familier",           "es": "informal",            "it": "informale",         "tr": "gayri resmi"},
    "avoidance":       {"fr": "évitement",          "es": "evasión",             "it": "evitamento",        "tr": "kaçınma"},
    "embarrassment":   {"fr": "embarras",           "es": "vergüenza",           "it": "imbarazzo",         "tr": "utanç"},
    "problem":         {"fr": "problème",           "es": "problema",            "it": "problema",          "tr": "sorun"},
    "problems":        {"fr": "problèmes",          "es": "problemas",           "it": "problemi",          "tr": "sorunlar"},
    "naivety":         {"fr": "naïveté",            "es": "ingenuidad",          "it": "ingenuità",         "tr": "saflık"},
    "hypocrisy":       {"fr": "hypocrisie",         "es": "hipocresía",          "it": "ipocrisia",         "tr": "ikiyüzlülük"},
    "stubbornness":    {"fr": "entêtement",         "es": "terquedad",           "it": "testardaggine",     "tr": "inatçılık"},
    "attitude":        {"fr": "attitude",           "es": "actitud",             "it": "atteggiamento",     "tr": "tutum"},
    "integrity":       {"fr": "intégrité",          "es": "integridad",          "it": "integrità",         "tr": "dürüstlük"},
    "growth":          {"fr": "croissance",         "es": "crecimiento",         "it": "crescita",          "tr": "büyüme"},
    "planning":        {"fr": "planification",      "es": "planificación",       "it": "pianificazione",    "tr": "planlama"},
    "knowledge":       {"fr": "connaissance",       "es": "conocimiento",        "it": "conoscenza",        "tr": "bilgi"},
    "simplicity":      {"fr": "simplicité",         "es": "simplicidad",         "it": "semplicità",        "tr": "sadelik"},
    "desire":          {"fr": "désir",              "es": "deseo",               "it": "desiderio",         "tr": "arzu"},
    "exhaustion":      {"fr": "épuisement",         "es": "agotamiento",         "it": "esaurimento",       "tr": "tükenme"},
    "reflection":      {"fr": "réflexion",          "es": "reflexión",           "it": "riflessione",       "tr": "yansıma"},
    "life":            {"fr": "vie",                "es": "vida",                "it": "vita",              "tr": "hayat"},
    "ignorance":       {"fr": "ignorance",          "es": "ignorancia",          "it": "ignoranza",         "tr": "cehalet"},
    "gossip":          {"fr": "ragot",              "es": "chisme",              "it": "pettegolezzo",      "tr": "dedikodu"},
    "control":         {"fr": "contrôle",           "es": "control",             "it": "controllo",         "tr": "kontrol"},
    "sensitivity":     {"fr": "sensibilité",        "es": "sensibilidad",        "it": "sensibilità",       "tr": "duyarlılık"},
    "strength":        {"fr": "force",              "es": "fuerza",              "it": "forza",             "tr": "kuvvet"},
    "dishonesty":      {"fr": "malhonnêteté",       "es": "deshonestidad",       "it": "disonestà",         "tr": "dürüstsüzlük"},
    "persistence":     {"fr": "persévérance",       "es": "persistencia",        "it": "persistenza",       "tr": "ısrar"},
    "vulgar":          {"fr": "vulgaire",           "es": "vulgar",              "it": "volgare",           "tr": "kaba"},
    "tension":         {"fr": "tension",            "es": "tensión",             "it": "tensione",          "tr": "gerilim"},
    "guilt":           {"fr": "culpabilité",        "es": "culpa",               "it": "senso di colpa",    "tr": "suçluluk"},
    "indifference":    {"fr": "indifférence",       "es": "indiferencia",        "it": "indifferenza",      "tr": "ilgisizlik"},
    "joy":             {"fr": "joie",               "es": "alegría",             "it": "gioia",             "tr": "sevinç"},
    "calm":            {"fr": "calme",              "es": "calma",               "it": "calma",             "tr": "sakinlik"},
    "lifestyle":       {"fr": "mode de vie",        "es": "estilo de vida",      "it": "stile di vita",     "tr": "yaşam tarzı"},
    "care":            {"fr": "soin",               "es": "cuidado",             "it": "cura",              "tr": "özen"},
    "personality":     {"fr": "personnalité",       "es": "personalidad",        "it": "personalità",       "tr": "kişilik"},
    "relationship":    {"fr": "relation",           "es": "relación",            "it": "relazione",         "tr": "ilişki"},
    "trouble":         {"fr": "ennui",              "es": "problema",            "it": "guaio",             "tr": "sorun"},
    "reliability":     {"fr": "fiabilité",          "es": "confiabilidad",       "it": "affidabilità",      "tr": "güvenilirlik"},
    "anxiety":         {"fr": "anxiété",            "es": "ansiedad",            "it": "ansia",             "tr": "kaygı"},
    "boasting":        {"fr": "vantardise",         "es": "jactancia",           "it": "vanteria",          "tr": "övünme"},
    "temper":          {"fr": "caractère",          "es": "temperamento",        "it": "temperamento",      "tr": "mizaç"},
    "interference":    {"fr": "ingérence",          "es": "interferencia",       "it": "interferenza",      "tr": "müdahale"},
    "clarity":         {"fr": "clarté",             "es": "claridad",            "it": "chiarezza",         "tr": "netlik"},
    "unexpected":      {"fr": "inattendu",          "es": "inesperado",          "it": "inaspettato",       "tr": "beklenmedik"},
    "reaction":        {"fr": "réaction",           "es": "reacción",            "it": "reazione",          "tr": "tepki"},
    "balance":         {"fr": "équilibre",          "es": "equilibrio",          "it": "equilibrio",        "tr": "denge"},
    "solidarity":      {"fr": "solidarité",         "es": "solidaridad",         "it": "solidarietà",       "tr": "dayanışma"},
    "waiting":         {"fr": "attente",            "es": "espera",              "it": "attesa",            "tr": "bekleme"},
    "business":        {"fr": "affaires",           "es": "negocios",            "it": "affari",            "tr": "iş"},
    "discomfort":      {"fr": "inconfort",          "es": "incomodidad",         "it": "disagio",           "tr": "rahatsızlık"},
    "independence":    {"fr": "indépendance",       "es": "independencia",       "it": "indipendenza",      "tr": "bağımsızlık"},
    "return":          {"fr": "retour",             "es": "regreso",             "it": "ritorno",           "tr": "dönüş"},
    "social":          {"fr": "social",             "es": "social",              "it": "sociale",           "tr": "sosyal"},
    "reality":         {"fr": "réalité",            "es": "realidad",            "it": "realtà",            "tr": "gerçeklik"},
    "encouragement":   {"fr": "encouragement",      "es": "aliento",             "it": "incoraggiamento",   "tr": "teşvik"},
    "pain":            {"fr": "douleur",            "es": "dolor",               "it": "dolore",            "tr": "acı"},
    "defeat":          {"fr": "défaite",            "es": "derrota",             "it": "sconfitta",         "tr": "yenilgi"},
    "uncertainty":     {"fr": "incertitude",        "es": "incertidumbre",       "it": "incertezza",        "tr": "belirsizlik"},
    "understanding":   {"fr": "compréhension",      "es": "comprensión",         "it": "comprensione",      "tr": "anlayış"},
    "bravery":         {"fr": "bravoure",           "es": "valentía",            "it": "bravura",           "tr": "yiğitlik"},
    "dedication":      {"fr": "dévouement",         "es": "dedicación",          "it": "dedizione",         "tr": "adanmışlık"},
    "beginning":       {"fr": "début",              "es": "comienzo",            "it": "inizio",            "tr": "başlangıç"},
    "adaptation":      {"fr": "adaptation",         "es": "adaptación",          "it": "adattamento",       "tr": "uyum"},
    "insult":          {"fr": "insulte",            "es": "insulto",             "it": "insulto",           "tr": "hakaret"},
    "excess":          {"fr": "excès",              "es": "exceso",              "it": "eccesso",           "tr": "aşırılık"},
    "journey":         {"fr": "parcours",           "es": "travesía",            "it": "percorso",          "tr": "yolculuk"},
    "ease":            {"fr": "facilité",           "es": "facilidad",           "it": "facilità",          "tr": "kolaylık"},
    "practicality":    {"fr": "pragmatisme",        "es": "practicidad",         "it": "praticità",         "tr": "pratiklik"},
    "choice":          {"fr": "choix",              "es": "elección",            "it": "scelta",            "tr": "seçim"},
    "warning":         {"fr": "avertissement",      "es": "advertencia",         "it": "avvertimento",      "tr": "uyarı"},
    "certainty":       {"fr": "certitude",          "es": "certeza",             "it": "certezza",          "tr": "kesinlik"},
    "sarcasm":         {"fr": "sarcasme",           "es": "sarcasmo",            "it": "sarcasmo",          "tr": "alaycılık"},
    "escalation":      {"fr": "escalade",           "es": "escalada",            "it": "escalation",        "tr": "tırmanma"},
    "safety":          {"fr": "sécurité",           "es": "seguridad",           "it": "sicurezza",         "tr": "güvenlik"},
    "obsession":       {"fr": "obsession",          "es": "obsesión",            "it": "ossessione",        "tr": "takıntı"},
    "forgiveness":     {"fr": "pardon",             "es": "perdón",              "it": "perdono",           "tr": "affetme"},
    "distance":        {"fr": "distance",           "es": "distancia",           "it": "distanza",          "tr": "mesafe"},
    "distraction":     {"fr": "distraction",        "es": "distracción",         "it": "distrazione",       "tr": "dikkat dağınıklığı"},
    "ethics":          {"fr": "éthique",            "es": "ética",               "it": "etica",             "tr": "etik"},
    "evasion":         {"fr": "esquive",            "es": "evasión",             "it": "evasione",          "tr": "kaçınma"},
    "excellence":      {"fr": "excellence",         "es": "excelencia",          "it": "eccellenza",        "tr": "mükemmellik"},
    "waste":           {"fr": "gaspillage",         "es": "desperdicio",         "it": "spreco",            "tr": "israf"},
    "completion":      {"fr": "achèvement",         "es": "finalización",        "it": "completamento",     "tr": "tamamlama"},
    "impatience":      {"fr": "impatience",         "es": "impaciencia",         "it": "impazienza",        "tr": "sabırsızlık"},
    "indecision":      {"fr": "indécision",         "es": "indecisión",          "it": "indecisione",       "tr": "kararsızlık"},
    "influence":       {"fr": "influence",          "es": "influencia",          "it": "influenza",         "tr": "etki"},
    "manners":         {"fr": "manières",           "es": "modales",             "it": "modi",              "tr": "görgü"},
    "mood":            {"fr": "humeur",             "es": "humor",               "it": "umore",             "tr": "ruh hali"},
    "peace":           {"fr": "paix",               "es": "paz",                 "it": "pace",              "tr": "barış"},
    "perspective":     {"fr": "perspective",        "es": "perspectiva",         "it": "prospettiva",       "tr": "bakış açısı"},
    "pragmatism":      {"fr": "pragmatisme",        "es": "pragmatismo",         "it": "pragmatismo",       "tr": "pragmatizm"},
    "precision":       {"fr": "précision",          "es": "precisión",           "it": "precisione",        "tr": "hassasiyet"},
    "blame":           {"fr": "reproche",           "es": "culpa",               "it": "colpa",             "tr": "suçlama"},
    "productivity":    {"fr": "productivité",       "es": "productividad",       "it": "produttività",      "tr": "verimlilik"},
    "resolution":      {"fr": "résolution",         "es": "resolución",          "it": "risoluzione",       "tr": "çözüm"},
    "approval":        {"fr": "approbation",        "es": "aprobación",          "it": "approvazione",      "tr": "onay"},
    "negotiation":     {"fr": "négociation",        "es": "negociación",         "it": "negoziazione",      "tr": "müzakere"},
    "overreaction":    {"fr": "surréaction",        "es": "sobrereacción",       "it": "reazione eccessiva","tr": "aşırı tepki"},
    "organization":    {"fr": "organisation",       "es": "organización",        "it": "organizzazione",    "tr": "organizasyon"},
    "opinion":         {"fr": "opinion",            "es": "opinión",             "it": "opinione",          "tr": "görüş"},
    "prosperity":      {"fr": "prospérité",         "es": "prosperidad",         "it": "prosperità",        "tr": "refah"},
    "challenge":       {"fr": "défi",               "es": "desafío",             "it": "sfida",             "tr": "meydan okuma"},
    "loss":            {"fr": "perte",              "es": "pérdida",             "it": "perdita",           "tr": "kayıp"},
    "shock":           {"fr": "choc",               "es": "shock",               "it": "shock",             "tr": "şok"},
    "sincerity":       {"fr": "sincérité",          "es": "sinceridad",          "it": "sincerità",         "tr": "samimiyet"},
    "skepticism":      {"fr": "scepticisme",        "es": "escepticismo",        "it": "scetticismo",       "tr": "şüphecilik"},
    "improvement":     {"fr": "amélioration",       "es": "mejora",              "it": "miglioramento",     "tr": "gelişme"},
    "competition":     {"fr": "compétition",        "es": "competencia",         "it": "competizione",      "tr": "rekabet"},
    "achievement":     {"fr": "accomplissement",    "es": "logro",               "it": "realizzazione",     "tr": "başarı"},
    "help":            {"fr": "aide",               "es": "ayuda",               "it": "aiuto",             "tr": "yardım"},
    "conscience":      {"fr": "conscience",         "es": "conciencia",          "it": "coscienza",         "tr": "vicdan"},
    "argument":        {"fr": "dispute",            "es": "discusión",           "it": "discussione",       "tr": "tartışma"},
    "teamwork":        {"fr": "travail d'équipe",   "es": "trabajo en equipo",   "it": "lavoro di squadra", "tr": "takım çalışması"},
    "guidance":        {"fr": "orientation",        "es": "orientación",         "it": "guida",             "tr": "rehberlik"},
    "futility":        {"fr": "futilité",           "es": "futilidad",           "it": "futilità",          "tr": "boşunalık"},
    "crazy":           {"fr": "fou",                "es": "loco",                "it": "pazzo",             "tr": "çılgın"},
    "curiosity":       {"fr": "curiosité",          "es": "curiosidad",          "it": "curiosità",         "tr": "merak"},
    "quality":         {"fr": "qualité",            "es": "calidad",             "it": "qualità",           "tr": "kalite"},
    "reassurance":     {"fr": "réassurance",        "es": "tranquilización",     "it": "rassicurazione",    "tr": "güvence"},
    "discretion":      {"fr": "discrétion",         "es": "discreción",          "it": "discrezione",       "tr": "ihtiyat"},
    "relaxation":      {"fr": "détente",            "es": "relajación",          "it": "relax",             "tr": "rahatlama"},
    "pressure":        {"fr": "pression",           "es": "presión",             "it": "pressione",         "tr": "baskı"},
    "excitement":      {"fr": "excitation",         "es": "emoción",             "it": "eccitazione",       "tr": "heyecan"},
    "rest":            {"fr": "repos",              "es": "descanso",            "it": "riposo",            "tr": "dinlenme"},
    "belief":          {"fr": "croyance",           "es": "creencia",            "it": "credenza",          "tr": "inanç"},
    "rain":            {"fr": "pluie",              "es": "lluvia",              "it": "pioggia",           "tr": "yağmur"},
    "compromise":      {"fr": "compromis",          "es": "compromiso",          "it": "compromesso",       "tr": "uzlaşma"},
    "privacy":         {"fr": "vie privée",         "es": "privacidad",          "it": "privacy",           "tr": "mahremiyet"},
    "fairness":        {"fr": "équité",             "es": "equidad",             "it": "equità",            "tr": "adalet"},
    "extreme":         {"fr": "extrême",            "es": "extremo",             "it": "estremo",           "tr": "aşırı"},
    "aggression":      {"fr": "agression",          "es": "agresión",            "it": "aggressione",       "tr": "saldırganlık"},
    "haste":           {"fr": "précipitation",      "es": "prisa",               "it": "fretta",            "tr": "acele"},
    "advantage":       {"fr": "avantage",           "es": "ventaja",             "it": "vantaggio",         "tr": "avantaj"},
    "expertise":       {"fr": "expertise",          "es": "experiencia",         "it": "competenza",        "tr": "uzmanlık"},
    "money":           {"fr": "argent",             "es": "dinero",              "it": "soldi",             "tr": "para"},
    "wealth":          {"fr": "richesse",           "es": "riqueza",             "it": "ricchezza",         "tr": "servet"},
    "debt":            {"fr": "dette",              "es": "deuda",               "it": "debito",            "tr": "borç"},
    "economy":         {"fr": "économie",           "es": "economía",            "it": "economia",          "tr": "ekonomi"},
    "finance":         {"fr": "finance",            "es": "finanzas",            "it": "finanza",           "tr": "finans"},
    "greed":           {"fr": "cupidité",           "es": "codicia",             "it": "avidità",           "tr": "açgözlülük"},
    "frugality":       {"fr": "frugalité",          "es": "frugalidad",          "it": "frugalità",         "tr": "tutumculuk"},
    "generosity":      {"fr": "générosité",         "es": "generosidad",         "it": "generosità",        "tr": "cömertlik"},
    "ambition":        {"fr": "ambition",           "es": "ambición",            "it": "ambizione",         "tr": "hırs"},
    "business":        {"fr": "affaires",           "es": "negocios",            "it": "affari",            "tr": "iş"},
    "giving-up":       {"fr": "abandon",            "es": "abandono",            "it": "abbandono",         "tr": "vazgeçme"},
    "military":        {"fr": "militaire",          "es": "militar",             "it": "militare",          "tr": "askeri"},
    "secrecy":         {"fr": "secret",             "es": "secreto",             "it": "segretezza",        "tr": "gizlilik"},
    "thinking":        {"fr": "réflexion",          "es": "pensamiento",         "it": "pensiero",          "tr": "düşünme"},
    "education":       {"fr": "éducation",          "es": "educación",           "it": "istruzione",        "tr": "eğitim"},
    "exclamation":     {"fr": "exclamation",        "es": "exclamación",         "it": "esclamazione",      "tr": "ünlem"},
    "karma":           {"fr": "karma",              "es": "karma",               "it": "karma",             "tr": "karma"},
    "corruption":      {"fr": "corruption",         "es": "corrupción",          "it": "corruzione",        "tr": "yolsuzluk"},
    "denial":          {"fr": "déni",               "es": "negación",            "it": "negazione",         "tr": "inkâr"},
    "alcohol":         {"fr": "alcool",             "es": "alcohol",             "it": "alcol",             "tr": "alkol"},
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

        print(f"{'[DRY-RUN] ' if dry_run else ''}Lignes insérées/mises à jour : {inserted}")
        if skipped_tags:
            print(f"Tags absents de la base (ignorés) : {skipped_tags}")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    prod = "--prod" in sys.argv
    env_label = "PROD (Neon ep-dawn-smoke)" if prod else "local"
    print(f"{'[DRY-RUN] ' if dry_run else ''}Remplissage tag_names cross-lang — {env_label}\n")
    populate(dry_run=dry_run)
    print("Terminé.")

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExpressionCard from "@/components/ExpressionCard";
import WelcomeModal from "@/components/WelcomeModal";
import HeroSection from "@/components/home/HeroSection";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import CountryStamp from "@/components/home/CountryStamp";
import SearchBar from "@/components/ui/SearchBar";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import Eyebrow from "@/components/home/Eyebrow";
import {
  searchExpressions, searchByConcept, browseByCountry,
  getRandomExpression, getExpression, getAllTagNames, getCountries, getFacets,
  Expression, Facets,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { EDITORIAL_DOMAINS } from "@/lib/editorialDomains";
import { useUILangContext } from "@/lib/UILangContext";
import { UI_LANGS, type UILang } from "@/lib/useUILang";

const LIMIT = 20;

const T = {
  fr: {
    expressionOfDay: "Expression du jour",
    anotherOne: "Une autre",
    readFile: "La fiche",
    share: "Partager",
    atlasTitle: (n: number) => `${n} pays, à toi`,
    emojiEyebrow: "Par emoji",
    emojiTitle: "Clique, explore, découvre",
    domainsEyebrow: "Univers",
    domainsTitle: "Des univers entiers à explorer",
    atlasEyebrow: "L'atlas",
    moreCountries: "autres pays",
    placeholder: "Essaie : pied, argent, animal, partir…",
    search: "Rechercher",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} pour « ${q} »`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} affichée${n > 1 ? "s" : ""}`,
    noResults: "Aucune expression trouvée",
    noResultsHint: "Essaie un autre mot ou une variante…",
    serverError: "Impossible de contacter le serveur.",
    newsletterHeadline: "Une expression par jour dans ta boîte mail.",
    newsletterSub: "Reçois chaque matin une expression idiomatique du monde entier — dans ta langue.",
    newsletterPlaceholder: "ton@email.com",
    newsletterCta: "S'abonner",
    newsletterSuccess: "C'est noté ! Une expression par jour arrive dans ta boîte.",
    newsletterAlready: "Tu es déjà abonné(e) !",
    newsletterError: "Une erreur s'est produite, réessaie.",
    types: { idiom: "idiotisme", proverb: "proverbe", locution: "locution", word: "mot", expression: "expression" } as Record<string, string>,
    registers: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" } as Record<string, string>,
    matchSections: { exact: "Dans le texte", semantic: "Par le sens", translation: "Via les traductions", concept: "Par concept" } as Record<string, string>,
    showMore: (n: number) => `Voir les ${n} autres →`,
  },
  en: {
    expressionOfDay: "Expression of the day",
    anotherOne: "Another one",
    readFile: "The card",
    share: "Share",
    atlasTitle: (n: number) => `${n} countries, yours to explore`,
    emojiEyebrow: "By emoji",
    emojiTitle: "Click, explore, discover",
    domainsEyebrow: "Universes",
    domainsTitle: "Entire worlds to explore",
    atlasEyebrow: "The atlas",
    moreCountries: "more countries",
    placeholder: "Try: money, animal, leave, fear…",
    search: "Search",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} for "${q}"`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} displayed`,
    noResults: "No expressions found",
    noResultsHint: "Try another word or a variant…",
    serverError: "Could not reach the server.",
    newsletterHeadline: "One expression a day, from the world to your inbox.",
    newsletterSub: "Get a new idiomatic expression every morning — in your language.",
    newsletterPlaceholder: "your@email.com",
    newsletterCta: "Subscribe",
    newsletterSuccess: "You're in! One expression a day is on its way.",
    newsletterAlready: "You're already subscribed!",
    newsletterError: "Something went wrong, please try again.",
    types: { idiom: "idiom", proverb: "proverb", locution: "locution", word: "word", expression: "expression" } as Record<string, string>,
    registers: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" } as Record<string, string>,
    matchSections: { exact: "In the text", semantic: "By meaning", translation: "Via translations", concept: "By concept" } as Record<string, string>,
    showMore: (n: number) => `See ${n} more →`,
  },
  es: {
    expressionOfDay: "Expresión del día",
    anotherOne: "Otra",
    readFile: "La ficha",
    share: "Compartir",
    atlasTitle: (n: number) => `${n} países, para ti`,
    emojiEyebrow: "Por emoji",
    emojiTitle: "Haz clic, explora, descubre",
    domainsEyebrow: "Universos",
    domainsTitle: "Mundos enteros por explorar",
    atlasEyebrow: "El atlas",
    moreCountries: "países más",
    placeholder: "Prueba: dinero, animal, partir, miedo…",
    search: "Buscar",
    results: (n: number, q: string) => `${n} expresión${n > 1 ? "es" : ""} para «${q}»`,
    allDisplayed: (n: number) => `${n} expresión${n > 1 ? "es" : ""} mostrada${n > 1 ? "s" : ""}`,
    noResults: "No se encontraron expresiones",
    noResultsHint: "Prueba otra palabra o una variante…",
    serverError: "No se pudo contactar el servidor.",
    newsletterHeadline: "Una expresión al día, del mundo a tu bandeja.",
    newsletterSub: "Recibe cada mañana una expresión idiomática del mundo — en tu idioma.",
    newsletterPlaceholder: "tu@email.com",
    newsletterCta: "Suscribirse",
    newsletterSuccess: "¡Apuntado! Una expresión al día te espera.",
    newsletterAlready: "¡Ya estás suscrito/a!",
    newsletterError: "Algo salió mal, inténtalo de nuevo.",
    types: { idiom: "modismo", proverb: "proverbio", locution: "locución", word: "palabra", expression: "expresión" } as Record<string, string>,
    registers: { standard: "estándar", informal: "coloquial", slang: "argot", vulgar: "vulgar", formal: "formal" } as Record<string, string>,
    matchSections: { exact: "En el texto", semantic: "Por el sentido", translation: "Via traducciones", concept: "Por concepto" } as Record<string, string>,
    showMore: (n: number) => `Ver ${n} más →`,
  },
  tr: {
    expressionOfDay: "Günün deyimi",
    anotherOne: "Başka biri",
    readFile: "Kart",
    share: "Paylaş",
    atlasTitle: (n: number) => `${n} ülke, senin için`,
    emojiEyebrow: "Emoji ile keşfet",
    emojiTitle: "Tıkla, keşfet, keşfet",
    domainsEyebrow: "Evrenler",
    domainsTitle: "Keşfedilecek dünyalar",
    atlasEyebrow: "Atlas",
    moreCountries: "ülke daha",
    placeholder: "Dene: para, hayvan, korku, ayrılmak…",
    search: "Ara",
    results: (n: number, q: string) => `"${q}" için ${n} deyim`,
    allDisplayed: (n: number) => `${n} deyim gösteriliyor`,
    noResults: "Deyim bulunamadı",
    noResultsHint: "Başka bir kelime deneyin…",
    serverError: "Sunucuya bağlanılamıyor.",
    newsletterHeadline: "Her gün bir deyim, dünyadan gelen kutuna.",
    newsletterSub: "Her sabah dünyadan bir deyim al — kendi dilinde.",
    newsletterPlaceholder: "sen@email.com",
    newsletterCta: "Abone ol",
    newsletterSuccess: "Kaydoldun! Her gün bir deyim gelen kutuna gelecek.",
    newsletterAlready: "Zaten abonesin!",
    newsletterError: "Bir şeyler ters gitti, tekrar dene.",
    types: { idiom: "deyim", proverb: "atasözü", locution: "kalıp ifade", word: "kelime", expression: "ifade" } as Record<string, string>,
    registers: { standard: "standart", informal: "gündelik", slang: "argo", vulgar: "kaba", formal: "resmi" } as Record<string, string>,
    matchSections: { exact: "Metinde", semantic: "Anlama göre", translation: "Çeviri yoluyla", concept: "Kavram ile" } as Record<string, string>,
    showMore: (n: number) => `${n} tanesini daha gör →`,
  },
  it: {
    expressionOfDay: "Espressione del giorno",
    anotherOne: "Un'altra",
    readFile: "La scheda",
    share: "Condividi",
    atlasTitle: (n: number) => `${n} paesi, tuoi da esplorare`,
    emojiEyebrow: "Per emoji",
    emojiTitle: "Clicca, esplora, scopri",
    domainsEyebrow: "Universi",
    domainsTitle: "Interi mondi da esplorare",
    atlasEyebrow: "L'atlante",
    moreCountries: "altri paesi",
    placeholder: "Prova: soldi, animale, partire, paura…",
    search: "Cerca",
    results: (n: number, q: string) => `${n} espression${n > 1 ? "i" : "e"} per "${q}"`,
    allDisplayed: (n: number) => `${n} espression${n > 1 ? "i" : "e"} visualizzat${n > 1 ? "e" : "a"}`,
    noResults: "Nessuna espressione trovata",
    noResultsHint: "Prova un'altra parola o una variante…",
    serverError: "Impossibile contattare il server.",
    newsletterHeadline: "Un'espressione al giorno, dal mondo alla tua casella.",
    newsletterSub: "Ricevi ogni mattina un'espressione idiomatica — nella tua lingua.",
    newsletterPlaceholder: "tua@email.com",
    newsletterCta: "Iscriviti",
    newsletterSuccess: "Iscritto! Un'espressione al giorno ti aspetta.",
    newsletterAlready: "Sei già iscritto/a!",
    newsletterError: "Qualcosa è andato storto, riprova.",
    types: { idiom: "idiotismo", proverb: "proverbio", locution: "locuzione", word: "parola", expression: "espressione" } as Record<string, string>,
    registers: { standard: "standard", informal: "informale", slang: "gergone", vulgar: "volgare", formal: "formale" } as Record<string, string>,
    matchSections: { exact: "Nel testo", semantic: "Per il senso", translation: "Via traduzioni", concept: "Per concetto" } as Record<string, string>,
    showMore: (n: number) => `Vedi altri ${n} →`,
  },
  de: {
    expressionOfDay: "Ausdruck des Tages",
    anotherOne: "Noch einer",
    readFile: "Die Karte",
    share: "Teilen",
    atlasTitle: (n: number) => `${n} Länder, entdecke sie`,
    emojiEyebrow: "Per Emoji",
    emojiTitle: "Klicken, entdecken, lernen",
    domainsEyebrow: "Welten",
    domainsTitle: "Ganze Welten zu entdecken",
    atlasEyebrow: "Der Atlas",
    moreCountries: "weitere Länder",
    placeholder: "Versuch: Geld, Tier, Arbeit, Angst…",
    search: "Suchen",
    results: (n: number, q: string) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} für „${q}"`,
    allDisplayed: (n: number) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} angezeigt`,
    noResults: "Keine Ausdrücke gefunden",
    noResultsHint: "Versuche ein anderes Wort oder eine Variante…",
    serverError: "Server nicht erreichbar.",
    newsletterHeadline: "Ein Ausdruck pro Tag, aus aller Welt in dein Postfach.",
    newsletterSub: "Jeden Morgen einen neuen idiomatischen Ausdruck — in deiner Sprache.",
    newsletterPlaceholder: "deine@email.com",
    newsletterCta: "Abonnieren",
    newsletterSuccess: "Eingetragen! Ein Ausdruck pro Tag ist unterwegs.",
    newsletterAlready: "Du bist bereits angemeldet!",
    newsletterError: "Etwas ist schiefgelaufen, bitte erneut versuchen.",
    types: { idiom: "Redewendung", proverb: "Sprichwort", locution: "feste Wendung", word: "Wort", expression: "Ausdruck" } as Record<string, string>,
    registers: { standard: "standard", informal: "umgangssprachlich", slang: "Slang", vulgar: "vulgär", formal: "formell" } as Record<string, string>,
    matchSections: { exact: "Im Text", semantic: "Nach Bedeutung", translation: "Via Übersetzungen", concept: "Nach Konzept" } as Record<string, string>,
    showMore: (n: number) => `${n} weitere anzeigen →`,
  },
  ja: {
    expressionOfDay: "今日の表現",
    anotherOne: "別の表現",
    readFile: "カード",
    share: "共有",
    atlasTitle: (n: number) => `${n}ヶ国を探索`,
    emojiEyebrow: "絵文字で",
    emojiTitle: "クリック、探索、発見",
    domainsEyebrow: "テーマ",
    domainsTitle: "探索できるテーマの世界",
    atlasEyebrow: "地図",
    moreCountries: "ヶ国",
    placeholder: "試して：お金、動物、出発、恐怖…",
    search: "検索",
    results: (n: number, q: string) => `「${q}」の表現 ${n}件`,
    allDisplayed: (n: number) => `${n}件の表現を表示`,
    noResults: "表現が見つかりません",
    noResultsHint: "別の言葉か変形を試してください…",
    serverError: "サーバーに接続できません。",
    newsletterHeadline: "1日1表現、世界からあなたへ。",
    newsletterSub: "毎朝、世界の慣用表現をあなたの言語でお届けします。",
    newsletterPlaceholder: "メール@アドレス",
    newsletterCta: "登録する",
    newsletterSuccess: "登録完了！毎日1表現が届きます。",
    newsletterAlready: "すでに登録済みです！",
    newsletterError: "エラーが発生しました。再試行してください。",
    types: { idiom: "慣用句", proverb: "ことわざ", locution: "成句", word: "言葉", expression: "表現" } as Record<string, string>,
    registers: { standard: "普通", informal: "くだけた", slang: "俗語", vulgar: "卑語", formal: "丁寧" } as Record<string, string>,
    matchSections: { exact: "テキスト内", semantic: "意味で", translation: "翻訳経由", concept: "概念で" } as Record<string, string>,
    showMore: (n: number) => `他${n}件を見る →`,
  },
};

const PINNED_EMOJI_WALL: Array<{ slug: string; emoji: string; labels: Record<UILang, string> }> = [
  { slug: "humor",      emoji: "😂", labels: { fr: "Humour",     en: "Humor",      es: "Humor",     it: "Umorismo",    tr: "Mizah",      de: "Humor",              ja: "ユーモア" } },
  { slug: "love",       emoji: "❤️", labels: { fr: "Amour",      en: "Love",       es: "Amor",      it: "Amore",       tr: "Aşk",        de: "Liebe",              ja: "愛" } },
  { slug: "money",      emoji: "💰", labels: { fr: "Argent",     en: "Money",      es: "Dinero",    it: "Denaro",      tr: "Para",       de: "Geld",               ja: "お金" } },
  { slug: "anger",      emoji: "😠", labels: { fr: "Colère",     en: "Anger",      es: "Ira",       it: "Rabbia",      tr: "Öfke",       de: "Wut",                ja: "怒り" } },
  { slug: "travel",     emoji: "✈️", labels: { fr: "Voyage",     en: "Travel",     es: "Viaje",     it: "Viaggio",     tr: "Seyahat",    de: "Reise",              ja: "旅" } },
  { slug: "lying",      emoji: "🤥", labels: { fr: "Mensonge",   en: "Lying",      es: "Mentira",   it: "Menzogna",    tr: "Yalan",      de: "Lüge",               ja: "嘘" } },
  { slug: "fear",       emoji: "😱", labels: { fr: "Peur",       en: "Fear",       es: "Miedo",     it: "Paura",       tr: "Korku",      de: "Angst",              ja: "恐れ" } },
  { slug: "death",      emoji: "💀", labels: { fr: "Mort",       en: "Death",      es: "Muerte",    it: "Morte",       tr: "Ölüm",       de: "Tod",                ja: "死" } },
  { slug: "laziness",   emoji: "😴", labels: { fr: "Paresse",    en: "Laziness",   es: "Pereza",    it: "Pigrizia",    tr: "Tembellik",  de: "Faulheit",           ja: "怠惰" } },
  { slug: "work",       emoji: "💼", labels: { fr: "Travail",    en: "Work",       es: "Trabajo",   it: "Lavoro",      tr: "İş",         de: "Arbeit",             ja: "仕事" } },
  { slug: "wine",       emoji: "🍷", labels: { fr: "Vin",        en: "Wine",       es: "Vino",      it: "Vino",        tr: "Şarap",      de: "Wein",               ja: "ワイン" } },
  { slug: "animals",    emoji: "🐾", labels: { fr: "Animaux",    en: "Animals",    es: "Animales",  it: "Animali",     tr: "Hayvanlar",  de: "Tiere",              ja: "動物" } },
  { slug: "success",    emoji: "🏆", labels: { fr: "Succès",     en: "Success",    es: "Éxito",     it: "Successo",    tr: "Başarı",     de: "Erfolg",             ja: "成功" } },
  { slug: "clumsiness", emoji: "🤦", labels: { fr: "Maladresse", en: "Clumsiness", es: "Torpeza",   it: "Goffaggine",  tr: "Sakarlık",   de: "Tollpatschigkeit",   ja: "不器用" } },
  { slug: "secret",     emoji: "🤫", labels: { fr: "Secret",     en: "Secret",     es: "Secreto",   it: "Segreto",     tr: "Sır",        de: "Geheimnis",          ja: "秘密" } },
  { slug: "party",      emoji: "🎉", labels: { fr: "Fête",       en: "Party",      es: "Fiesta",    it: "Festa",       tr: "Parti",      de: "Fest",               ja: "祭り" } },
];

const REGION_ORDER = ["fr", "en", "es", "it", "tr", "de", "jp"];

const COUNTRY_SUB_REGIONS: Record<string, { code: string; name: string; emoji: string }[]> = {
  fr: [
    { code: "alsace",   name: "Alsace",   emoji: "🥨" },
    { code: "bretagne", name: "Bretagne", emoji: "🦞" },
  ],
};
const ALL_SUB_REGION_CODES = new Set(
  Object.values(COUNTRY_SUB_REGIONS).flat().map((r) => r.code)
);

const STATIC_REGIONS = Object.entries(COUNTRY_NAME).map(([code, label]) => ({ code, label }));

const SEARCH_HELP: Record<UILang, string> = {
  fr: "Recherche en plusieurs passes : le mot exact, puis synonymes et tags, puis concepts multilingues. Exemple : « industrie » remonte aussi des expressions en anglais ou turc liées à « work » ou « business ».",
  en: "Search runs in multiple passes: exact word, then synonyms and tags, then multilingual concepts. Example: «industry» also surfaces Spanish or Turkish expressions tagged «work» or «business».",
  es: "Búsqueda en varias pasadas: la palabra exacta, luego sinónimos y etiquetas, y finalmente conceptos multilingues. Ejemplo: «industria» también muestra expresiones en francés o turco relacionadas con «work».",
  it: "Ricerca in più fasi: la parola esatta, poi sinonimi e tag, poi concetti multilingua. Esempio: «industria» mostra anche espressioni in francese o turco legate a «work».",
  tr: "Arama birden fazla aşamada çalışır: tam kelime, ardından eş anlamlılar ve etiketler, ardından çok dilli kavramlar. Örnek: «sanayi» araması «work» etiketli Fransızca veya İspanyolca ifadeler de gösterir.",
  de: "Suche läuft in mehreren Schritten: exaktes Wort, dann Synonyme und Tags, dann mehrsprachige Konzepte. Beispiel: «Industrie» zeigt auch französische oder türkische Ausdrücke mit dem Tag «work».",
  ja: "検索は複数のパスで実行されます：完全一致、次に類義語とタグ、最後に多言語概念。例：「仕事」で「work」タグのフランス語やスペイン語の表現も見つかります。",
};

function sectionExprCount(n: number, lang: UILang): string {
  if (lang === "es") return `${n} expresión${n > 1 ? "es" : ""}`;
  if (lang === "it") return `${n} espression${n > 1 ? "i" : "e"}`;
  if (lang === "tr") return `${n} deyim`;
  if (lang === "de") return `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""}`;
  if (lang === "ja") return `${n}件`;
  return `${n} expression${n > 1 ? "s" : ""}`;
}

export default function HomePage() {
  const router = useRouter();
  const { uiLang, setUILang: changeLang } = useUILangContext();
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<{ code: string; label: string; count?: number }[]>([]);
  const [results, setResults] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept" | "browse">("text");
  const [searchLabel, setSearchLabel] = useState("");
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState<(Expression & { meaning_locale: string; literal: string | null }) | null>(null);
  const [coldStart, setColdStart] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLang, setNewsletterLang] = useState<UILang>("en");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"relevance" | "country">("country");
  const [facets, setFacets] = useState<Facets | undefined>(undefined);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const featuredLoadedRef = useRef(false);

  const t = T[uiLang];
  const allRegionCodes = regions.map((r) => r.code);

  const groupedResults = useMemo(() => {
    if (sortMode !== "country" || results.length === 0) return null;
    const map = new Map<string, Expression[]>();
    for (const expr of results) {
      const code = expr.country || expr.region || expr.language || "??";
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(expr);
    }
    const ordered: { code: string; exprs: Expression[] }[] = [];
    for (const r of regions) {
      if (map.has(r.code)) ordered.push({ code: r.code, exprs: map.get(r.code)! });
    }
    for (const [code, exprs] of map) {
      if (!regions.some((r) => r.code === code)) ordered.push({ code, exprs });
    }
    return ordered;
  }, [results, sortMode, regions]);

  const matchTypeGroups = useMemo(() => {
    if (searchMode !== "text" || sortMode !== "relevance" || results.length === 0) return null;
    const ORDER = ["exact", "semantic", "concept"] as const;
    const map = new Map<string, Expression[]>();
    for (const expr of results) {
      const mt = expr.match_type === "translation" ? "semantic" : expr.match_type;
      if (!map.has(mt)) map.set(mt, []);
      map.get(mt)!.push(expr);
    }
    const groups = ORDER.filter((mt) => map.has(mt)).map((mt) => ({ type: mt, exprs: map.get(mt)! }));
    return groups.length > 1 ? groups : null;
  }, [results, searchMode, sortMode]);

  // ─── Handlers ───

  const runConceptSearch = useCallback(async (tag: string, rf: string[] = []) => {
    setQuery(tagNames[tag] ?? tag);
    setSearchMode("concept");
    setFilterRegions([]);
    setSortMode("relevance");
    setLoading(true);
    setHasError(false);
    setSearched(true);
    setResults([]);
    window.history.replaceState(null, "", "#concept=" + encodeURIComponent(tag));
    exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const data = await searchByConcept([tag], [], LIMIT, 0, undefined, uiLang, undefined, rf.length ? rf : []);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
      getFacets(rf.length ? rf : [], "", null, "", uiLang, tag).then(setFacets);
    } catch {
      setHasError(true);
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRegionCodes, tagNames, uiLang]);

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setSearchLabel("");
    setFilterRegions([]);
    setTypeFilter(null);
    setSortMode("relevance");
    setSearchMode("text");
    setLoading(true);
    setHasError(false);
    setSearched(true);
    setResults([]);
    window.history.replaceState(null, "", "#q=" + encodeURIComponent(q));
    try {
      const data = await searchExpressions(q, [], LIMIT, 0, undefined, uiLang, undefined, []);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
      getFacets([], q, null, "", uiLang).then(setFacets);
    } catch {
      setHasError(true);
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRegionCodes, uiLang]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const offset = results.length;
    try {
      const data =
        searchMode === "browse"
          ? await browseByCountry(filterRegions, LIMIT, offset)
          : searchMode === "concept"
          ? await searchByConcept([query], [], LIMIT, offset, undefined, uiLang, undefined, filterRegions)
          : await searchExpressions(query, [], LIMIT, offset, typeFilter ?? undefined, uiLang, undefined, filterRegions);
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, searchMode, query, results.length, allRegionCodes, filterRegions, typeFilter, uiLang]);

  const handleFilterChange = useCallback(async (newFilter: string[]) => {
    setFilterRegions(newFilter);
    setLoading(true);
    setHasError(false);
    setResults([]);
    setHasMore(false);
    setSearched(true);
    const effectiveMode = query ? searchMode : "browse";
    if (!query) setSearchMode("browse");
    try {
      const data =
        effectiveMode === "browse"
          ? await browseByCountry(newFilter, LIMIT, 0, typeFilter ?? undefined, uiLang)
          : effectiveMode === "concept"
          ? await searchByConcept([query], [], LIMIT, 0, undefined, uiLang, undefined, newFilter)
          : await searchExpressions(query, [], LIMIT, 0, typeFilter ?? undefined, uiLang, undefined, newFilter);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
    } catch {
      setHasError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
    getFacets(newFilter, query || "", typeFilter, "", uiLang).then(setFacets);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, query, allRegionCodes, typeFilter, uiLang]);

  const handleTypeChange = useCallback(async (newType: string | null) => {
    setTypeFilter(newType);
    setSortMode("relevance");
    setLoading(true);
    setHasError(false);
    setResults([]);
    setHasMore(false);
    setSearched(true);
    const effectiveMode = query ? searchMode : "browse";
    if (!query) setSearchMode("browse");
    try {
      const data =
        effectiveMode === "browse"
          ? await browseByCountry(filterRegions, LIMIT, 0, newType ?? undefined, uiLang)
          : await searchExpressions(query, [], LIMIT, 0, newType ?? undefined, uiLang, undefined, filterRegions);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
    } catch {
      setHasError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
    getFacets(filterRegions, query || "", newType, "", uiLang).then(setFacets);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, query, allRegionCodes, filterRegions, uiLang]);

  const refreshFeatured = useCallback(() => {
    getRandomExpression(uiLang).then((expr) => {
      setFeatured(expr);
      sessionStorage.setItem("featured_expression", JSON.stringify(expr));
      sessionStorage.setItem("featured_lang", uiLang);
    }).catch(() => {});
  }, [uiLang]);

  const handleNewsletterSubmit = useCallback(async () => {
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("loading");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim(), language: newsletterLang }),
      });
      if (!res.ok) { setNewsletterStatus("error"); return; }
      const data = await res.json();
      setNewsletterStatus(data.status === "already_subscribed" ? "already" : "success");
    } catch {
      setNewsletterStatus("error");
    }
  }, [newsletterEmail, newsletterLang]);

  // ─── Effects ───

  useEffect(() => {
    getCountries().then((data) => {
      setRegions(data.map((r) => ({ code: r.code, label: `${FLAG[r.code] ?? "🌍"} ${COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}`, count: r.count })));
    });
  }, []);

  useEffect(() => {
    getFacets([], "", null, "", uiLang).then(setFacets);
  }, [uiLang]);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    setShowWelcome(!stored || !UI_LANGS.includes(stored as UILang));
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#concept=")) {
      const slug = decodeURIComponent(hash.slice(9));
      if (slug.trim().length >= 2) {
        setQuery(slug);
        runConceptSearch(slug);
      }
    } else if (hash.startsWith("#q=")) {
      const initQ = decodeURIComponent(hash.slice(3));
      if (initQ.trim().length >= 2) {
        setQuery(initQ);
        handleSearch(initQ);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search triggered from SearchOverlay when already on home page
  // (router.push to /#q=... doesn't re-mount the component, so the hash effect above won't fire)
  useEffect(() => {
    const handler = (e: Event) => {
      const { q } = (e as CustomEvent<{ q: string }>).detail;
      if (q && q.trim().length >= 2) {
        setQuery(q);
        handleSearch(q);
      }
    };
    window.addEventListener("wex-search", handler);
    return () => window.removeEventListener("wex-search", handler);
  }, [handleSearch]);

  // Reset to initial home view when clicking the Home button while already on "/"
  // (Next.js soft-navigation on same URL doesn't remount the component)
  useEffect(() => {
    const handler = () => {
      setSearched(false);
      setQuery("");
      setResults([]);
      setTotal(0);
      setHasError(false);
      setSearchMode("text");
      setSearchLabel("");
      setFilterRegions([]);
      setTypeFilter(null);
      setSortMode("country");
      window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("wex-go-home", handler);
    return () => window.removeEventListener("wex-go-home", handler);
  }, []);

  useEffect(() => {
    // Don't reload the expression when the UI language changes — only labels translate.
    // The expression is fetched once on mount and when the user explicitly clicks "another one".
    if (featuredLoadedRef.current) return;

    const stored = sessionStorage.getItem("featured_expression");
    if (stored) {
      setFeatured(JSON.parse(stored));
      featuredLoadedRef.current = true;
      return;
    }
    let cancelled = false;
    let attempt = 0;
    // Show cold start message if backend doesn't respond within 5s (Render free tier)
    const coldTimer = setTimeout(() => {
      if (!featuredLoadedRef.current) setColdStart(true);
    }, 5000);
    const tryFetch = () => {
      getRandomExpression(uiLang).then((expr) => {
        if (cancelled) return;
        setFeatured(expr);
        setColdStart(false);
        featuredLoadedRef.current = true;
        sessionStorage.setItem("featured_expression", JSON.stringify(expr));
        sessionStorage.setItem("featured_lang", uiLang);
      }).catch(() => {
        if (!cancelled && attempt < 5) {
          attempt++;
          setTimeout(tryFetch, 8000);
        }
      });
    };
    tryFetch();
    return () => { cancelled = true; clearTimeout(coldTimer); };
  }, [uiLang]);

  // When the UI language changes, keep the SAME expression of the day but re-translate
  // its explanation. We re-fetch via /expression?locale= which serves meaning/literal
  // already localized (same COALESCE logic as /random), so the card stays consistent.
  useEffect(() => {
    if (!featuredLoadedRef.current || !featured) return;
    const fetchId = featured.id;
    let cancelled = false;
    getExpression(fetchId, "", uiLang).then((data) => {
      if (cancelled) return;
      const displayLiteral = data.language !== uiLang ? data.literal : null;
      setFeatured((prev) =>
        prev && prev.id === fetchId
          ? { ...prev, meaning: data.meaning, literal: displayLiteral }
          : prev
      );
      // Keep the cached copy in sync so a remount restores the translated explanation.
      const stored = sessionStorage.getItem("featured_expression");
      if (stored) {
        try {
          const obj = JSON.parse(stored);
          if (obj?.id === fetchId) {
            sessionStorage.setItem(
              "featured_expression",
              JSON.stringify({ ...obj, meaning: data.meaning, literal: displayLiteral })
            );
            sessionStorage.setItem("featured_lang", uiLang);
          }
        } catch { /* ignore malformed cache */ }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang]);

  useEffect(() => {
    let cancelled = false;
    getAllTagNames(uiLang).then((tags) => { if (!cancelled) setTagNames(tags); });
    return () => { cancelled = true; };
  }, [uiLang]);

  // Re-fetch current search/browse results when lang changes (only if user has already searched)
  useEffect(() => {
    if (!searched) return;
    let cancelled = false;
    const doReFetch = async () => {
      setLoading(true);
      setHasError(false);
      setResults([]);
      try {
        let data;
        if (searchMode === "browse") {
          data = await browseByCountry(filterRegions, LIMIT, 0, typeFilter ?? undefined, uiLang);
        } else if (searchMode === "concept" && query) {
          data = await searchByConcept([query], [], LIMIT, 0, undefined, uiLang, undefined, filterRegions.length ? filterRegions : []);
        } else if (searchMode === "text" && query) {
          data = await searchExpressions(query.trim(), [], LIMIT, 0, typeFilter ?? undefined, uiLang, undefined, filterRegions);
        }
        if (!cancelled && data) {
          setResults(data.results);
          setTotal(data.total);
          setHasMore(data.results.length < data.total);
        }
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doReFetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // ─── Render ───

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      {showWelcome && (
        <WelcomeModal onSelect={(lang) => { changeLang(lang); setShowWelcome(false); }} />
      )}

      {/* Sidebar — desktop only */}
      <Sidebar uiLang={uiLang} />
      {/* Main content */}
      <main className="wex-main" style={{ paddingBottom: 80 }}>

        {/* Hero — country photo + postcard + atlas card (hidden during search) */}
        {!searched && (
          <HeroSection
            featured={featured}
            coldStart={coldStart}
            uiLang={uiLang}
            tagNames={tagNames}
            onRefresh={refreshFeatured}
            onConceptClick={(tag) => { const icon = tagIcon(tag) ?? ""; const name = tagNames[tag] ?? tag; setSearchLabel(`${icon ? icon + " " : ""}${name}`); runConceptSearch(tag); }}
            t={{ expressionOfDay: t.expressionOfDay, anotherOne: t.anotherOne, readFile: t.readFile, share: t.share, types: t.types, registers: t.registers }}
          />
        )}



        {/* Sticky search + filter bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "var(--paper)",
          borderBottom: searched ? "1px solid var(--paper-edge)" : "none",
          boxShadow: searched ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        }}>
          <div ref={exploreRef} style={{ padding: searched ? "var(--wex-search-wrap-padding-searched)" : "var(--wex-search-wrap-padding-default)", maxWidth: "var(--wex-search-max-width)", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSearch={() => handleSearch(query)}
                  placeholder={t.placeholder}
                  searchLabel={t.search}
                  loading={loading}
                  emoji={tagIcon(query.trim()) ?? undefined}
                />
              </div>
              <div
                style={{ position: "relative", flexShrink: 0 }}
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
              >
                <button
                  onClick={() => setTooltipOpen((o) => !o)}
                  aria-label="Comment fonctionne la recherche ?"
                  style={{ width: "var(--wex-icon-button-size)", height: "var(--wex-icon-button-size)", borderRadius: "50%", border: "1.5px solid var(--paper-edge)", background: "var(--paper-deep)", color: "var(--ink-soft)", fontSize: "var(--wex-meta-size)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  ?
                </button>
                {tooltipOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 100, background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: 10, padding: "0.65rem 0.85rem", width: 260, maxWidth: "calc(100vw - 2rem)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: "var(--wex-tooltip-size)", color: "var(--ink-soft)", lineHeight: 1.5, fontFamily: "var(--font-body)" }}>
                    {SEARCH_HELP[uiLang]}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ maxWidth: "var(--wex-shell-max-width)", margin: "0 auto", padding: "0 1.1rem" }}>
            <ResultsFilterBar
              countries={regions.length > 0 ? regions : STATIC_REGIONS}
              filterCountries={filterRegions}
              onFilterChange={handleFilterChange}
              sortMode={sortMode}
              onSortChange={setSortMode}
              uiLang={uiLang}
              typeFilter={typeFilter}
              onTypeChange={handleTypeChange}
              showSort={searched}
              facets={facets}
            />
          </div>
        </div>

        {/* Results area */}
        <div style={{ maxWidth: "var(--wex-shell-max-width)", margin: "0 auto", padding: "var(--wex-content-padding)" }}>
          {hasError && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--terra)" }}>{t.serverError}</p>
          )}

          {searched && !loading && !hasError && results.length > 0 && (
            <p className="text-right text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
              {searchLabel
                ? `${total} expression${total > 1 ? "s" : ""} — ${searchLabel}`
                : t.results(total, query)}
            </p>
          )}

          {results.length > 0 && (
            <>
              {groupedResults ? (
                groupedResults.map(({ code, exprs }, gi) => (
                  <div key={code}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: `${gi === 0 ? "0" : "1.25rem"} 0 0.6rem`, color: "var(--ink-soft)", fontSize: "var(--wex-body-size)", fontFamily: "var(--font-body)" }}>
                      <span>{FLAG[code] ?? "🌍"}</span>
                      <span style={{ fontWeight: 600 }}>{COUNTRY_NAME[code] ?? code.toUpperCase()}</span>
                      <span style={{ color: "var(--ink-faint)" }}>· {sectionExprCount(exprs.length, uiLang)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(var(--wex-results-grid-min), 1fr))", gap: "var(--wex-grid-gap)" }}>
                      {exprs.map((expr, i) => (
                        <div key={expr.id} style={{ height: "100%", animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ExpressionCard expression={expr} onTagClick={(tag) => runConceptSearch(tag)} uiLang={uiLang} tagNames={tagNames} fromSearch={searched ? query : undefined} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : matchTypeGroups ? (
                matchTypeGroups.map(({ type, exprs }, gi) => (
                  <div key={type}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: `${gi === 0 ? "0" : "1.25rem"} 0 0.6rem`, color: "var(--ink-faint)", fontSize: "var(--wex-meta-size)", fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>
                      <span>{{ exact: "🎯", semantic: "💡", concept: "🏷️", translation: "🌍" }[type]}</span>
                      <span style={{ fontWeight: 600, color: "var(--ink-softer)" }}>{t.matchSections[type] ?? type}</span>
                      <span>· {sectionExprCount(exprs.length, uiLang)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(var(--wex-results-grid-min), 1fr))", gap: "var(--wex-grid-gap)" }}>
                      {exprs.map((expr, i) => (
                        <div key={expr.id} style={{ height: "100%", animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ExpressionCard expression={expr} onTagClick={(tag) => runConceptSearch(tag)} uiLang={uiLang} tagNames={tagNames} fromSearch={searched ? query : undefined} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(var(--wex-results-grid-min), 1fr))", gap: "var(--wex-grid-gap)" }}>
                  {results.map((expr, i) => (
                    <div
                      key={expr.id}
                      style={{ height: "100%", animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms` }}
                    >
                      <ExpressionCard
                        expression={expr}
                        onTagClick={(tag) => runConceptSearch(tag)}
                        uiLang={uiLang}
                        tagNames={tagNames}
                        fromSearch={searched ? query : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--paper-edge)", borderTopColor: "var(--plum)" }} />
                </div>
              )}
              {!hasMore && results.length > 0 && results.length === total && total > LIMIT && (
                <p className="text-center text-xs py-4" style={{ color: "var(--ink-faint)" }}>
                  {t.allDisplayed(total)}
                </p>
              )}
            </>
          )}

          {searched && !loading && results.length === 0 && !hasError && (
            <div className="text-center mt-16">
              <p className="text-lg font-medium" style={{ color: "var(--ink-soft)" }}>{t.noResults}</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>{t.noResultsHint}</p>
            </div>
          )}
        </div>

        {/* Atlas section */}
        {!searched && (
          <section style={{ padding: "var(--wex-section-padding)", borderTop: "1px solid var(--paper-edge)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Eyebrow tone="softer">{t.atlasEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--wex-display-title-size)", color: "var(--ink)", margin: "0.35rem 0 1rem", fontWeight: 500 }}>
                {t.atlasTitle(regions.filter((r) => !ALL_SUB_REGION_CODES.has(r.code)).length)}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-start" }}>
                {regions.filter((r) => !ALL_SUB_REGION_CODES.has(r.code)).map((r, i) => {
                  const hasSubRegions = !!COUNTRY_SUB_REGIONS[r.code];
                  const isExpanded = expandedRegion === r.code;
                  const isGrayed = expandedRegion !== null && !isExpanded;
                  return (
                    <div key={r.code} style={{ opacity: isGrayed ? 0.3 : 1, transition: "opacity 200ms ease" }}>
                      <CountryStamp
                        country={r.code}
                        flag={FLAG[r.code] ?? "🌍"}
                        name={COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}
                        count={r.count}
                        size="sm"
                        tilt={i % 2 === 0 ? 0.8 : -0.6}
                        onClick={() => {
                          if (hasSubRegions) {
                            setExpandedRegion(isExpanded ? null : r.code);
                          } else {
                            router.push(`/country/${r.code}`);
                          }
                        }}
                      />
                    </div>
                  );
                })}

                {/* Sub-regions panel — shown below all stamps when a country is expanded */}
                {expandedRegion && COUNTRY_SUB_REGIONS[expandedRegion] && (
                  <div style={{
                    flexBasis: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.625rem",
                    alignItems: "center",
                    marginTop: "0.5rem",
                    paddingLeft: "0.75rem",
                    borderLeft: "2px solid var(--paper-edge)",
                  }}>
                    {/* Country "tous" — primary, first */}
                    <button
                      onClick={() => { setExpandedRegion(null); router.push(`/country/${expandedRegion}`); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.45rem 1rem",
                        borderRadius: "var(--r-pill)",
                        border: "1.5px solid var(--ink-soft)",
                        background: "var(--paper)",
                        color: "var(--ink)",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "border-color 150ms ease, background 150ms ease",
                      }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--plum)"; el.style.background = "var(--plum-bg)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--ink-soft)"; el.style.background = "var(--paper)"; }}
                    >
                      <span>{FLAG[expandedRegion] ?? "🌍"}</span>
                      <span>{COUNTRY_NAME[expandedRegion] ?? expandedRegion} — tous</span>
                    </button>
                    {/* Sub-regions — secondary */}
                    {COUNTRY_SUB_REGIONS[expandedRegion].map((sub) => (
                      <button
                        key={sub.code}
                        onClick={() => router.push(`/regions/${sub.code}`)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "var(--r-pill)",
                          border: "1.5px solid var(--paper-edge)",
                          background: "var(--paper-deep)",
                          color: "var(--ink-faint)",
                          fontSize: 12, fontWeight: 500, cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--plum)"; el.style.background = "var(--plum-bg)"; el.style.color = "var(--plum)"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--paper-edge)"; el.style.background = "var(--paper-deep)"; el.style.color = "var(--ink-faint)"; }}
                      >
                        <span>{sub.emoji}</span>
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Editorial Domains section */}
        {!searched && (
          <section style={{ padding: "2rem 1.5rem 2.5rem", borderTop: "1px solid var(--paper-edge)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Eyebrow tone="softer">{t.domainsEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", margin: "0.4rem 0 1.25rem", fontWeight: 500 }}>
                {t.domainsTitle}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: "0.75rem" }}>
                {EDITORIAL_DOMAINS.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => router.push(`/search?domain=${encodeURIComponent(d.slug)}`)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      background: d.bg, border: `1px solid ${d.border}`, borderRadius: 14,
                      padding: "1rem 0.875rem", cursor: "pointer", textAlign: "left",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "";
                      el.style.boxShadow = "";
                    }}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1, marginBottom: "0.5rem" }}>{d.emoji}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--ink)", fontStyle: "italic", display: "block", lineHeight: 1.3 }}>
                      {d.labels[uiLang]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Emoji Wall section */}
        {!searched && (
          <section style={{ background: "var(--paper-deep)", borderTop: "1px solid var(--paper-edge)", padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Eyebrow tone="plum">{t.emojiEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", margin: "0.4rem 0 1.5rem", fontWeight: 500 }}>
                {t.emojiTitle}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {PINNED_EMOJI_WALL.map((item) => (
                  <button
                    key={item.slug}
                    data-testid="emoji-wall-btn"
                    onClick={() => { setSearchLabel(`${item.emoji} ${item.labels[uiLang]}`); runConceptSearch(item.slug); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                      background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: 14,
                      padding: "0.625rem 0.875rem", cursor: "pointer", minWidth: 64,
                      transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-3px) scale(1.05)";
                      el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.10)";
                      el.style.borderColor = "var(--plum)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "";
                      el.style.boxShadow = "";
                      el.style.borderColor = "var(--paper-edge)";
                    }}
                  >
                    <span style={{ fontSize: 36, lineHeight: 1 }}>{item.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-softer)", whiteSpace: "nowrap", fontFamily: "var(--font-body)" }}>
                      {item.labels[uiLang]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter modal */}
        {newsletterOpen && (
          <div
            onClick={() => setNewsletterOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(28,20,16,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--paper)", borderRadius: "var(--r-lg)", padding: "2rem", width: "100%", maxWidth: 420, border: "1px solid var(--paper-edge)", boxShadow: "var(--shadow-deep)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3, margin: 0, maxWidth: "85%", fontFamily: "var(--font-display)" }}>
                  {t.newsletterHeadline}
                </p>
                <button onClick={() => setNewsletterOpen(false)} style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-softer)", marginBottom: "1.5rem", fontFamily: "var(--font-body)" }}>
                {t.newsletterSub}
              </p>
              {newsletterStatus === "success" || newsletterStatus === "already" ? (
                <p style={{ fontSize: 14, color: "var(--plum)", fontWeight: 600, padding: "0.875rem", background: "var(--plum-bg)", borderRadius: "var(--r-md)", textAlign: "center" }}>
                  {newsletterStatus === "success" ? t.newsletterSuccess : t.newsletterAlready}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <input
                    type="email" value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubmit()}
                    placeholder={t.newsletterPlaceholder}
                    autoFocus
                    className="wex-input"
                    style={{ width: "100%", padding: "0.7rem 1rem", borderRadius: "var(--r-md)", border: "1.5px solid var(--paper-edge)", background: "var(--paper)", color: "var(--ink)", fontSize: 14, boxSizing: "border-box", fontFamily: "var(--font-body)" }}
                  />
                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <select
                      value={newsletterLang}
                      onChange={(e) => setNewsletterLang(e.target.value as UILang)}
                      style={{ flex: "0 0 auto", padding: "0.7rem 0.625rem", borderRadius: "var(--r-md)", border: "1.5px solid var(--paper-edge)", background: "var(--paper)", color: "var(--ink)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}
                    >
                      <option value="fr">🇫🇷 FR</option>
                      <option value="en">🇬🇧 EN</option>
                      <option value="es">🇪🇸 ES</option>
                      <option value="it">🇮🇹 IT</option>
                      <option value="tr">🇹🇷 TR</option>
                    </select>
                    <button
                      onClick={handleNewsletterSubmit}
                      disabled={newsletterStatus === "loading"}
                      style={{ flex: 1, padding: "0.7rem 1.25rem", borderRadius: "var(--r-md)", border: "none", background: newsletterStatus === "loading" ? "var(--plum-soft)" : "var(--plum)", color: "var(--paper)", fontWeight: 600, fontSize: 14, cursor: newsletterStatus === "loading" ? "default" : "pointer", fontFamily: "var(--font-body)" }}
                    >
                      {newsletterStatus === "loading" ? "…" : t.newsletterCta}
                    </button>
                  </div>
                  {newsletterStatus === "error" && (
                    <p style={{ fontSize: 12, color: "var(--terra)", fontFamily: "var(--font-body)" }}>{t.newsletterError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav uiLang={uiLang} />
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExpressionCard from "@/components/ExpressionCard";
import WelcomeModal from "@/components/WelcomeModal";
import HeroSection from "@/components/home/HeroSection";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import LangDropdown from "@/components/ui/LangDropdown";
import ShareButton from "@/components/ui/ShareButton";
import CountryStamp from "@/components/home/CountryStamp";
import SearchBar from "@/components/ui/SearchBar";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import Eyebrow from "@/components/home/Eyebrow";
import {
  searchExpressions, searchByConcept, browseByRegion,
  getRandomExpression, getExpression, getAllTagNames, getRegions, Expression,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { EDITORIAL_DOMAINS } from "@/lib/editorialDomains";

const LIMIT = 20;
const MAX_SECTION_PREVIEW = 6;

type UILang = "fr" | "en" | "es" | "it" | "tr";

const T = {
  fr: {
    expressionOfDay: "Expression du jour",
    anotherOne: "Une autre",
    readFile: "Lire la fiche →",
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
    types: { idiom: "expression", proverb: "proverbe", locution: "locution", word: "mot", expression: "expression" } as Record<string, string>,
    registers: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" } as Record<string, string>,
    matchSections: { exact: "Dans le texte", semantic: "Par le sens", translation: "Via les traductions", concept: "Par concept" } as Record<string, string>,
    showMore: (n: number) => `Voir les ${n} autres →`,
  },
  en: {
    expressionOfDay: "Expression of the day",
    anotherOne: "Another one",
    readFile: "Read the card →",
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
    readFile: "Ver la ficha →",
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
    readFile: "Kartı oku →",
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
    types: { idiom: "deyim", proverb: "atasözü", locution: "deyiş", word: "kelime", expression: "ifade" } as Record<string, string>,
    registers: { standard: "standart", informal: "gündelik", slang: "argo", vulgar: "kaba", formal: "resmi" } as Record<string, string>,
    matchSections: { exact: "Metinde", semantic: "Anlama göre", translation: "Çeviri yoluyla", concept: "Kavram ile" } as Record<string, string>,
    showMore: (n: number) => `${n} tanesini daha gör →`,
  },
  it: {
    expressionOfDay: "Espressione del giorno",
    anotherOne: "Un'altra",
    readFile: "Leggi la scheda →",
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
    types: { idiom: "espressione", proverb: "proverbio", locution: "locuzione", word: "parola", expression: "espressione" } as Record<string, string>,
    registers: { standard: "standard", informal: "informale", slang: "gergone", vulgar: "volgare", formal: "formale" } as Record<string, string>,
    matchSections: { exact: "Nel testo", semantic: "Per il senso", translation: "Via traduzioni", concept: "Per concetto" } as Record<string, string>,
    showMore: (n: number) => `Vedi altri ${n} →`,
  },
};

const PINNED_EMOJI_WALL: Array<{ slug: string; emoji: string; labels: Record<UILang, string> }> = [
  { slug: "humor",      emoji: "😂", labels: { fr: "Humour",     en: "Humor",      es: "Humor",     it: "Umorismo",    tr: "Mizah" } },
  { slug: "love",       emoji: "❤️", labels: { fr: "Amour",      en: "Love",       es: "Amor",      it: "Amore",       tr: "Aşk" } },
  { slug: "money",      emoji: "💰", labels: { fr: "Argent",     en: "Money",      es: "Dinero",    it: "Denaro",      tr: "Para" } },
  { slug: "anger",      emoji: "😠", labels: { fr: "Colère",     en: "Anger",      es: "Ira",       it: "Rabbia",      tr: "Öfke" } },
  { slug: "travel",     emoji: "✈️", labels: { fr: "Voyage",     en: "Travel",     es: "Viaje",     it: "Viaggio",     tr: "Seyahat" } },
  { slug: "lying",      emoji: "🤥", labels: { fr: "Mensonge",   en: "Lying",      es: "Mentira",   it: "Menzogna",    tr: "Yalan" } },
  { slug: "fear",       emoji: "😱", labels: { fr: "Peur",       en: "Fear",       es: "Miedo",     it: "Paura",       tr: "Korku" } },
  { slug: "death",      emoji: "💀", labels: { fr: "Mort",       en: "Death",      es: "Muerte",    it: "Morte",       tr: "Ölüm" } },
  { slug: "laziness",   emoji: "😴", labels: { fr: "Paresse",    en: "Laziness",   es: "Pereza",    it: "Pigrizia",    tr: "Tembellik" } },
  { slug: "work",       emoji: "💼", labels: { fr: "Travail",    en: "Work",       es: "Trabajo",   it: "Lavoro",      tr: "İş" } },
  { slug: "wine",       emoji: "🍷", labels: { fr: "Vin",        en: "Wine",       es: "Vino",      it: "Vino",        tr: "Şarap" } },
  { slug: "animals",    emoji: "🐾", labels: { fr: "Animaux",    en: "Animals",    es: "Animales",  it: "Animali",     tr: "Hayvanlar" } },
  { slug: "success",    emoji: "🏆", labels: { fr: "Succès",     en: "Success",    es: "Éxito",     it: "Successo",    tr: "Başarı" } },
  { slug: "clumsiness", emoji: "🤦", labels: { fr: "Maladresse", en: "Clumsiness", es: "Torpeza",   it: "Goffaggine",  tr: "Sakarlık" } },
  { slug: "secret",     emoji: "🤫", labels: { fr: "Secret",     en: "Secret",     es: "Secreto",   it: "Segreto",     tr: "Sır" } },
  { slug: "party",      emoji: "🎉", labels: { fr: "Fête",       en: "Party",      es: "Fiesta",    it: "Festa",       tr: "Parti" } },
];

const REGION_ORDER = ["fr", "en", "es", "it", "tr"];

const COUNTRY_SUB_REGIONS: Record<string, { code: string; name: string; emoji: string }[]> = {
  fr: [
    { code: "alsace",   name: "Alsace",   emoji: "🥨" },
    { code: "bretagne", name: "Bretagne", emoji: "🦞" },
  ],
};
const ALL_SUB_REGION_CODES = new Set(
  Object.values(COUNTRY_SUB_REGIONS).flat().map((r) => r.code)
);

const SEARCH_HELP: Record<UILang, string> = {
  fr: "Recherche en plusieurs passes : le mot exact, puis synonymes et tags, puis concepts multilingues. Exemple : « industrie » remonte aussi des expressions en anglais ou turc liées à « work » ou « business ».",
  en: "Search runs in multiple passes: exact word, then synonyms and tags, then multilingual concepts. Example: «industry» also surfaces Spanish or Turkish expressions tagged «work» or «business».",
  es: "Búsqueda en varias pasadas: la palabra exacta, luego sinónimos y etiquetas, y finalmente conceptos multilingues. Ejemplo: «industria» también muestra expresiones en francés o turco relacionadas con «work».",
  it: "Ricerca in più fasi: la parola esatta, poi sinonimi e tag, poi concetti multilingua. Esempio: «industria» mostra anche espressioni in francese o turco legate a «work».",
  tr: "Arama birden fazla aşamada çalışır: tam kelime, ardından eş anlamlılar ve etiketler, ardından çok dilli kavramlar. Örnek: «sanayi» araması «work» etiketli Fransızca veya İspanyolca ifadeler de gösterir.",
};

function sectionExprCount(n: number, lang: UILang): string {
  if (lang === "es") return `${n} expresión${n > 1 ? "es" : ""}`;
  if (lang === "it") return `${n} espression${n > 1 ? "i" : "e"}`;
  if (lang === "tr") return `${n} deyim`;
  return `${n} expression${n > 1 ? "s" : ""}`;
}

export default function HomePage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("en");
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<{ code: string; label: string }[]>([]);
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
  const [sortMode, setSortMode] = useState<"relevance" | "country">("country");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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
      const code = expr.region ?? expr.language ?? "??";
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
    const regionCodes = rf.length ? rf : allRegionCodes;
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
      const data = await searchByConcept([tag], regionCodes, LIMIT, 0);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
    } catch {
      setHasError(true);
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRegionCodes, tagNames]);

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setSearchLabel("");
    setFilterRegions([]);
    setSortMode("relevance");
    setSearchMode("text");
    setLoading(true);
    setHasError(false);
    setSearched(true);
    setResults([]);
    window.history.replaceState(null, "", "#q=" + encodeURIComponent(q));
    try {
      const data = await searchExpressions(q, allRegionCodes, LIMIT, 0, undefined, uiLang);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
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
    const activeRegions = filterRegions.length > 0 ? filterRegions : allRegionCodes;
    try {
      const data =
        searchMode === "browse"
          ? await browseByRegion(activeRegions, LIMIT, offset)
          : searchMode === "concept"
          ? await searchByConcept([query], activeRegions, LIMIT, offset)
          : await searchExpressions(query, activeRegions, LIMIT, offset, undefined, uiLang);
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, searchMode, query, results.length, allRegionCodes, filterRegions, uiLang]);

  const handleFilterChange = useCallback(async (newFilter: string[]) => {
    setFilterRegions(newFilter);
    const regionCodes = newFilter.length > 0 ? newFilter : allRegionCodes;
    setLoading(true);
    setHasError(false);
    setResults([]);
    setHasMore(false);
    try {
      const data =
        searchMode === "browse"
          ? await browseByRegion(regionCodes, LIMIT, 0)
          : searchMode === "concept"
          ? await searchByConcept([query], regionCodes, LIMIT, 0)
          : await searchExpressions(query, regionCodes, LIMIT, 0, undefined, uiLang);
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
    } catch {
      setHasError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, query, allRegionCodes, uiLang]);

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
    getRegions().then((data) => {
      setRegions(data.map((r) => ({ code: r.code, label: `${FLAG[r.code] ?? "🌍"} ${COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}` })));
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) {
      setUILang(stored);
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }
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

  // When UI language changes on an already-loaded expression, re-fetch translation
  // (the expression stays the same, only the meaning/literal update)
  useEffect(() => {
    if (!featuredLoadedRef.current || !featured) return;
    const fetchId = featured.id;
    let cancelled = false;
    getExpression(fetchId, uiLang).then((data) => {
      if (cancelled) return;
      const displayMeaning =
        uiLang !== data.language && data.translation?.meaning
          ? data.translation.meaning
          : data.meaning;
      const displayLiteral =
        uiLang !== data.language && data.translation?.literal
          ? data.translation.literal
          : null;
      setFeatured((prev) =>
        prev && prev.id === fetchId
          ? { ...prev, meaning: displayMeaning, literal: displayLiteral }
          : prev
      );
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang]);

  useEffect(() => {
    let cancelled = false;
    getAllTagNames(uiLang).then((tags) => { if (!cancelled) setTagNames(tags); });
    return () => { cancelled = true; };
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

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  // ─── Render ───

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      {showWelcome && (
        <WelcomeModal onSelect={(lang) => { changeLang(lang); setShowWelcome(false); }} />
      )}

      {/* Sidebar — desktop only */}
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

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
            t={{ expressionOfDay: t.expressionOfDay, anotherOne: t.anotherOne, readFile: t.readFile, types: t.types, registers: t.registers }}
          />
        )}

        {/* Mobile header — share + lang switcher */}
        <div className="wex-mobile-header" style={{ justifyContent: "flex-end", padding: "0.6rem 1rem", gap: "0.5rem", background: "var(--paper)", borderBottom: "1px solid var(--paper-edge)" }}>
          <ShareButton uiLang={uiLang} />
          <LangDropdown uiLang={uiLang} onLangChange={changeLang} />
        </div>

        {/* Sticky search + filter bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "var(--paper)",
          borderBottom: searched ? "1px solid var(--paper-edge)" : "none",
          boxShadow: searched ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        }}>
          <div ref={exploreRef} style={{ padding: searched ? "0.75rem 1.5rem" : "2rem 1.5rem 1rem", maxWidth: 720, margin: "0 auto" }}>
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
                  style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--paper-edge)", background: "var(--paper-deep)", color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  ?
                </button>
                {tooltipOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 100, background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: 10, padding: "0.75rem 1rem", width: 280, maxWidth: "calc(100vw - 2rem)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                    {SEARCH_HELP[uiLang]}
                  </div>
                )}
              </div>
            </div>
          </div>
          {searched && results.length > 0 && (
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" }}>
              <ResultsFilterBar
                regions={regions}
                filterRegions={filterRegions}
                onFilterChange={handleFilterChange}
                sortMode={sortMode}
                onSortChange={setSortMode}
                uiLang={uiLang}
              />
            </div>
          )}
        </div>

        {/* Results area */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem 1.5rem 2rem" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: `${gi === 0 ? "0" : "1.5rem"} 0 0.75rem`, color: "var(--ink-soft)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                      <span>{FLAG[code] ?? "🌍"}</span>
                      <span style={{ fontWeight: 600 }}>{COUNTRY_NAME[code] ?? code.toUpperCase()}</span>
                      <span style={{ color: "var(--ink-faint)" }}>· {sectionExprCount(exprs.length, uiLang)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                      {exprs.map((expr, i) => (
                        <div key={expr.id} style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ExpressionCard expression={expr} onTagClick={(tag) => runConceptSearch(tag)} uiLang={uiLang} tagNames={tagNames} fromSearch={searched ? query : undefined} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : matchTypeGroups ? (
                matchTypeGroups.map(({ type, exprs }, gi) => {
                  const isExpanded = expandedSections.has(type);
                  const visible = isExpanded ? exprs : exprs.slice(0, MAX_SECTION_PREVIEW);
                  const hidden = exprs.length - MAX_SECTION_PREVIEW;
                  return (
                  <div key={type}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: `${gi === 0 ? "0" : "1.5rem"} 0 0.75rem`, color: "var(--ink-faint)", fontSize: 12, fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>
                      <span>{{ exact: "🎯", semantic: "💡", concept: "🏷️", translation: "🌍" }[type]}</span>
                      <span style={{ fontWeight: 600, color: "var(--ink-softer)" }}>{t.matchSections[type] ?? type}</span>
                      <span>· {sectionExprCount(exprs.length, uiLang)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                      {visible.map((expr, i) => (
                        <div key={expr.id} style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ExpressionCard expression={expr} onTagClick={(tag) => runConceptSearch(tag)} uiLang={uiLang} tagNames={tagNames} fromSearch={searched ? query : undefined} />
                        </div>
                      ))}
                    </div>
                    {!isExpanded && hidden > 0 && (
                      <button
                        onClick={() => setExpandedSections(prev => new Set(prev).add(type))}
                        style={{ marginTop: "0.75rem", background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer", padding: "0.25rem 0", textDecoration: "underline", textUnderlineOffset: 3 }}
                      >
                        {t.showMore(hidden)}
                      </button>
                    )}
                  </div>
                  );
                })
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {results.map((expr, i) => (
                    <div
                      key={expr.id}
                      style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms` }}
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
          <section style={{ padding: "2rem 1.5rem 2.5rem", borderTop: "1px solid var(--paper-edge)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Eyebrow tone="softer">{t.atlasEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", margin: "0.4rem 0 1.25rem", fontWeight: 500 }}>
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
                    {COUNTRY_SUB_REGIONS[expandedRegion].map((sub) => (
                      <button
                        key={sub.code}
                        onClick={() => router.push(`/regions/${sub.code}`)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.4rem 0.875rem",
                          borderRadius: "var(--r-pill)",
                          border: "1.5px solid var(--paper-edge)",
                          background: "var(--paper-deep)",
                          color: "var(--ink-soft)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--plum)"; el.style.background = "var(--plum-bg)"; el.style.color = "var(--plum)"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--paper-edge)"; el.style.background = "var(--paper-deep)"; el.style.color = "var(--ink-soft)"; }}
                      >
                        <span>{sub.emoji}</span>
                        <span>{sub.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setExpandedRegion(null); router.push(`/country/${expandedRegion}`); }}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "var(--r-pill)",
                        border: "none",
                        background: "none",
                        color: "var(--ink-faint)",
                        fontSize: 12, cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "color 150ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-faint)"; }}
                    >
                      → {COUNTRY_NAME[expandedRegion] ?? expandedRegion} (tous)
                    </button>
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
                    onClick={() => router.push(`/domain/${encodeURIComponent(d.slug)}`)}
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

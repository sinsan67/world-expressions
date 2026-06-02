"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExpressionCard from "@/components/ExpressionCard";
import WelcomeModal from "@/components/WelcomeModal";
import HeroSection from "@/components/home/HeroSection";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import ConceptChip from "@/components/home/ConceptChip";
import CountryStamp from "@/components/home/CountryStamp";
import SearchBar from "@/components/ui/SearchBar";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import Eyebrow from "@/components/home/Eyebrow";
import {
  searchExpressions, searchByConcept, browseByRegion, getTopTags,
  getRandomExpression, getExpression, getAllTagNames, getRegions, Expression,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

const LIMIT = 20;
const HINT_COUNT = 12;

type UILang = "fr" | "en" | "es" | "it" | "tr";

const T = {
  fr: {
    expressionOfDay: "Expression du jour",
    anotherOne: "Une autre",
    readFile: "Lire la fiche →",
    atlasTitle: (n: number) => `${n} pays, à toi`,
    conceptsEyebrow: "Au fil des thèmes",
    conceptsTitle: "Les mots qui voyagent",
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
  },
  en: {
    expressionOfDay: "Expression of the day",
    anotherOne: "Another one",
    readFile: "Read the card →",
    atlasTitle: (n: number) => `${n} countries, yours to explore`,
    conceptsEyebrow: "Through the themes",
    conceptsTitle: "Words that travel",
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
  },
  es: {
    expressionOfDay: "Expresión del día",
    anotherOne: "Otra",
    readFile: "Ver la ficha →",
    atlasTitle: (n: number) => `${n} países, para ti`,
    conceptsEyebrow: "A través de los temas",
    conceptsTitle: "Las palabras que viajan",
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
  },
  tr: {
    expressionOfDay: "Günün deyimi",
    anotherOne: "Başka biri",
    readFile: "Kartı oku →",
    atlasTitle: (n: number) => `${n} ülke, senin için`,
    conceptsEyebrow: "Temalar arasında",
    conceptsTitle: "Seyahat eden kelimeler",
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
  },
  it: {
    expressionOfDay: "Espressione del giorno",
    anotherOne: "Un'altra",
    readFile: "Leggi la scheda →",
    atlasTitle: (n: number) => `${n} paesi, tuoi da esplorare`,
    conceptsEyebrow: "Tra i temi",
    conceptsTitle: "Le parole che viaggiano",
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
  },
};

const REGION_ORDER = ["fr", "en", "es", "it", "tr"];

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

export default function Home() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("en");
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [hintKey, setHintKey] = useState(0);
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
  const [hintTags, setHintTags] = useState<{ slug: string; name: string }[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState<(Expression & { meaning_locale: string; literal: string | null }) | null>(null);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLang, setNewsletterLang] = useState<UILang>("en");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<"relevance" | "country">("relevance");
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

  // ─── Handlers ───

  const runConceptSearch = useCallback(async (tag: string, rf: string[] = []) => {
    const regionCodes = rf.length ? rf : allRegionCodes;
    setQuery(tag);
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
  }, [allRegionCodes]);

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
      const data = await searchExpressions(q, allRegionCodes, LIMIT, 0);
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
  }, [allRegionCodes]);

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
          : await searchExpressions(query, activeRegions, LIMIT, offset);
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, searchMode, query, results.length, allRegionCodes, filterRegions]);

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
          : await searchExpressions(query, regionCodes, LIMIT, 0);
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
  }, [searchMode, query, allRegionCodes]);

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
    const tryFetch = () => {
      getRandomExpression(uiLang).then((expr) => {
        if (cancelled) return;
        setFeatured(expr);
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
    return () => { cancelled = true; };
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
    getTopTags(uiLang, 40, uiLang).then((tags) => {
      const withEmoji = tags.filter((tag) => tagIcon(tag.slug));
      const shuffled = withEmoji.sort(() => Math.random() - 0.5);
      setHintTags(shuffled.slice(0, HINT_COUNT).map((tag) => ({ slug: tag.slug, name: tag.name })));
    }).catch(() => {});
  }, [uiLang, hintKey]);

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
    setHintKey((k) => k + 1);
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
            uiLang={uiLang}
            regions={regions}
            tagNames={tagNames}
            onRefresh={refreshFeatured}
            onConceptClick={(tag) => { const icon = tagIcon(tag) ?? ""; const name = tagNames[tag] ?? tag; setSearchLabel(`${icon ? icon + " " : ""}${name}`); runConceptSearch(tag); }}
            t={{ expressionOfDay: t.expressionOfDay, anotherOne: t.anotherOne, readFile: t.readFile, atlasTitle: t.atlasTitle(regions.length), atlasEyebrow: t.atlasEyebrow, moreCountries: t.moreCountries, types: t.types, registers: t.registers }}
          />
        )}

        {/* Mobile header — lang switcher, shown only on mobile */}
        <div className="wex-mobile-header" style={{ justifyContent: "flex-end", padding: "0.75rem 1rem", gap: "0.4rem", background: "var(--paper)", borderBottom: "1px solid var(--paper-edge)" }}>
          {(["fr", "en", "es", "it", "tr"] as UILang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => changeLang(lang)}
              style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--r-pill)",
                border: "1.5px solid",
                borderColor: uiLang === lang ? "var(--ink)" : "var(--paper-edge)",
                background: uiLang === lang ? "var(--ink)" : "transparent",
                color: uiLang === lang ? "var(--paper)" : "var(--ink-soft)",
                cursor: "pointer", textTransform: "uppercase",
                fontFamily: "var(--font-body)",
              }}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Search section */}
        <div ref={exploreRef} style={{ padding: "2rem 1.5rem 1rem", maxWidth: 720, margin: "0 auto" }}>
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

        {/* Results area */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 2rem" }}>
          {hasError && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--terra)" }}>{t.serverError}</p>
          )}

          {searched && results.length > 0 && (
            <ResultsFilterBar
              regions={regions}
              filterRegions={filterRegions}
              onFilterChange={handleFilterChange}
              sortMode={sortMode}
              onSortChange={setSortMode}
              uiLang={uiLang}
            />
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

        {/* Concepts section */}
        {!searched && (
          <section style={{ background: "var(--paper-deep)", borderTop: "1px solid var(--paper-edge)", padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <Eyebrow tone="plum">{t.conceptsEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", margin: "0.4rem 0 1.25rem", fontWeight: 500 }}>
                {t.conceptsTitle}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {hintTags.map((tag) => {
                  const icon = tagIcon(tag.slug) ?? "";
                  return (
                    <ConceptChip
                      key={tag.slug}
                      icon={icon}
                      name={tag.name}
                      tone="plain"
                      onClick={() => { setSearchLabel(`${icon ? icon + " " : ""}${tag.name}`); runConceptSearch(tag.slug); setHintKey((k) => k + 1); }}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Atlas section — mobile only (desktop has atlas card in hero) */}
        {!searched && (
          <section className="wex-mobile-header" style={{ flexDirection: "column", padding: "2rem 1.5rem", borderTop: "1px solid var(--paper-edge)" }}>
            <Eyebrow tone="softer">{t.atlasEyebrow}</Eyebrow>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", margin: "0.4rem 0 1.25rem", fontWeight: 500 }}>
              {t.atlasTitle(regions.length)}
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {regions.map((r, i) => (
                <CountryStamp
                  key={r.code}
                  country={r.code}
                  flag={FLAG[r.code] ?? "🌍"}
                  name={COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}
                  size="sm"
                  tilt={i % 2 === 0 ? 0.8 : -0.6}
                  onClick={() => router.push(`/country/${r.code}`)}
                />
              ))}
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

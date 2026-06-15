"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpressionCard from "@/components/ExpressionCard";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import SearchBar from "@/components/ui/SearchBar";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import {
  searchExpressions, searchByConcept, searchByDomain, getCountries, getAllTagNames, getFacets,
  Expression, Facets,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { DOMAIN_DEFS, DOMAIN_COLORS } from "@/lib/domainDefs";
import { LANG_FLAG, LANG_NATIVE } from "@/lib/langDefs";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { splitCountryRegion } from "@/lib/subregions";
import { useUILang, type UILang } from "@/lib/useUILang";

const LIMIT = 20;

const MAX_SECTION_PREVIEW = 6;

const T: Record<UILang, {
  placeholder: string;
  search: string;
  results: (n: number, q: string) => string;
  allDisplayed: (n: number) => string;
  noResults: string;
  noResultsHint: string;
  serverError: string;
  titleSearch: (q: string) => string;
  titleConcept: (name: string) => string;
  titleDefault: string;
  types: Record<string, string>;
  registers: Record<string, string>;
  matchSections: Record<string, string>;
  showMore: (n: number) => string;
  langFirst: string;
  mixAll: string;
  otherLangs: string;
  detected: string;
  othersEquivalents: string;
  sameIdeaTitle: string;
}> = {
  fr: {
    placeholder: "Essaie : pied, argent, animal, partir…",
    search: "Rechercher",
    results: (n, q) => `${n} expression${n > 1 ? "s" : ""} pour « ${q} »`,
    allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} affichée${n > 1 ? "s" : ""}`,
    noResults: "Aucune expression trouvée",
    noResultsHint: "Essaie un autre mot ou une variante…",
    serverError: "Impossible de contacter le serveur.",
    titleSearch: (q) => `Recherche : « ${q} » — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Recherche — World Expressions",
    types: { idiom: "expression", proverb: "proverbe", locution: "locution", word: "mot", expression: "expression" },
    registers: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" },
    matchSections: { exact: "Dans le texte", semantic: "Par le sens", translation: "Via les traductions", concept: "Par concept" },
    showMore: (n) => `Voir les ${n} autres →`,
    langFirst: "Langue d'abord",
    mixAll: "Tout mélanger",
    otherLangs: "Dans les autres langues",
    detected: "· détecté",
    othersEquivalents: "Équivalents",
    sameIdeaTitle: "Même idée dans les autres langues",
  },
  en: {
    placeholder: "Try: money, animal, leave, fear…",
    search: "Search",
    results: (n, q) => `${n} expression${n > 1 ? "s" : ""} for "${q}"`,
    allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} displayed`,
    noResults: "No expressions found",
    noResultsHint: "Try another word or a variant…",
    serverError: "Could not reach the server.",
    titleSearch: (q) => `Search: "${q}" — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Search — World Expressions",
    types: { idiom: "idiom", proverb: "proverb", locution: "locution", word: "word", expression: "expression" },
    registers: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" },
    matchSections: { exact: "In the text", semantic: "By meaning", translation: "Via translations", concept: "By concept" },
    showMore: (n) => `Show ${n} more →`,
    langFirst: "Language first",
    mixAll: "Mix all",
    otherLangs: "In other languages",
    detected: "· detected",
    othersEquivalents: "Equivalents",
    sameIdeaTitle: "Same idea in other languages",
  },
  es: {
    placeholder: "Prueba: dinero, animal, partir, miedo…",
    search: "Buscar",
    results: (n, q) => `${n} expresión${n > 1 ? "es" : ""} para «${q}»`,
    allDisplayed: (n) => `${n} expresión${n > 1 ? "es" : ""} mostrada${n > 1 ? "s" : ""}`,
    noResults: "No se encontraron expresiones",
    noResultsHint: "Prueba otra palabra o una variante…",
    serverError: "No se pudo contactar el servidor.",
    titleSearch: (q) => `Búsqueda: "${q}" — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Búsqueda — World Expressions",
    types: { idiom: "modismo", proverb: "proverbio", locution: "locución", word: "palabra", expression: "expresión" },
    registers: { standard: "estándar", informal: "coloquial", slang: "argot", vulgar: "vulgar", formal: "formal" },
    matchSections: { exact: "En el texto", semantic: "Por el sentido", translation: "Via traducciones", concept: "Por concepto" },
    showMore: (n) => `Ver ${n} más →`,
    langFirst: "Idioma primero",
    mixAll: "Mezclar todo",
    otherLangs: "En otros idiomas",
    detected: "· detectado",
    othersEquivalents: "Equivalentes",
    sameIdeaTitle: "La misma idea en otros idiomas",
  },
  it: {
    placeholder: "Prova: soldi, animale, partire, paura…",
    search: "Cerca",
    results: (n, q) => `${n} espression${n > 1 ? "i" : "e"} per "${q}"`,
    allDisplayed: (n) => `${n} espression${n > 1 ? "i" : "e"} visualizzat${n > 1 ? "e" : "a"}`,
    noResults: "Nessuna espressione trovata",
    noResultsHint: "Prova un'altra parola o una variante…",
    serverError: "Impossibile contattare il server.",
    titleSearch: (q) => `Ricerca: "${q}" — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Ricerca — World Expressions",
    types: { idiom: "espressione", proverb: "proverbio", locution: "locuzione", word: "parola", expression: "espressione" },
    registers: { standard: "standard", informal: "informale", slang: "gergone", vulgar: "volgare", formal: "formale" },
    matchSections: { exact: "Nel testo", semantic: "Per il senso", translation: "Via traduzioni", concept: "Per concetto" },
    showMore: (n) => `Vedi altri ${n} →`,
    langFirst: "Lingua prima",
    mixAll: "Mescola tutto",
    otherLangs: "In altre lingue",
    detected: "· rilevato",
    othersEquivalents: "Equivalenti",
    sameIdeaTitle: "La stessa idea in altre lingue",
  },
  tr: {
    placeholder: "Dene: para, hayvan, korku, ayrılmak…",
    search: "Ara",
    results: (n, q) => `"${q}" için ${n} deyim`,
    allDisplayed: (n) => `${n} deyim gösteriliyor`,
    noResults: "Deyim bulunamadı",
    noResultsHint: "Başka bir kelime deneyin…",
    serverError: "Sunucuya bağlanılamıyor.",
    titleSearch: (q) => `Arama: "${q}" — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Arama — World Expressions",
    types: { idiom: "deyim", proverb: "atasözü", locution: "deyiş", word: "kelime", expression: "ifade" },
    registers: { standard: "standart", informal: "gündelik", slang: "argo", vulgar: "kaba", formal: "resmi" },
    matchSections: { exact: "Metinde", semantic: "Anlama göre", translation: "Çeviri yoluyla", concept: "Kavram ile" },
    showMore: (n) => `${n} tane daha gör →`,
    langFirst: "Dil önce",
    mixAll: "Tümünü karıştır",
    otherLangs: "Diğer dillerde",
    detected: "· algılandı",
    othersEquivalents: "Eşdeğerler",
    sameIdeaTitle: "Diğer dillerde aynı fikir",
  },
  de: {
    placeholder: "Versuch: Geld, Tier, Arbeit, Angst…",
    search: "Suchen",
    results: (n, q) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} für „${q}"`,
    allDisplayed: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} angezeigt`,
    noResults: "Keine Ausdrücke gefunden",
    noResultsHint: "Versuche ein anderes Wort oder eine Variante…",
    serverError: "Server nicht erreichbar.",
    titleSearch: (q) => `Suche: „${q}" — World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "Suche — World Expressions",
    types: { idiom: "Redewendung", proverb: "Sprichwort", locution: "feste Wendung", word: "Wort", expression: "Ausdruck" },
    registers: { standard: "standard", informal: "umgangssprachlich", slang: "Slang", vulgar: "vulgär", formal: "formell" },
    matchSections: { exact: "Im Text", semantic: "Nach Bedeutung", translation: "Via Übersetzungen", concept: "Nach Konzept" },
    showMore: (n) => `${n} weitere anzeigen →`,
    langFirst: "Sprache zuerst",
    mixAll: "Alles mischen",
    otherLangs: "In anderen Sprachen",
    detected: "· erkannt",
    othersEquivalents: "Entsprechungen",
    sameIdeaTitle: "Dieselbe Idee in anderen Sprachen",
  },
  ja: {
    placeholder: "試して：お金、動物、出発、恐怖…",
    search: "検索",
    results: (n, q) => `「${q}」の表現 ${n}件`,
    allDisplayed: (n) => `${n}件の表現を表示`,
    noResults: "表現が見つかりません",
    noResultsHint: "別の言葉か変形を試してください…",
    serverError: "サーバーに接続できません。",
    titleSearch: (q) => `検索：「${q}」— World Expressions`,
    titleConcept: (name) => `${name} — World Expressions`,
    titleDefault: "検索 — World Expressions",
    types: { idiom: "慣用句", proverb: "ことわざ", locution: "成句", word: "言葉", expression: "表現" },
    registers: { standard: "普通", informal: "くだけた", slang: "俗語", vulgar: "卑語", formal: "丁寧" },
    matchSections: { exact: "テキスト内", semantic: "意味で", translation: "翻訳経由", concept: "概念で" },
    showMore: (n) => `他${n}件を見る →`,
    langFirst: "言語優先",
    mixAll: "すべて混ぜる",
    otherLangs: "他の言語で",
    detected: "· 検出",
    othersEquivalents: "同義表現",
    sameIdeaTitle: "他の言語での同じ考え",
  },
};

function sectionExprCount(n: number, lang: UILang): string {
  if (lang === "es") return `${n} expresión${n > 1 ? "es" : ""}`;
  if (lang === "it") return `${n} espression${n > 1 ? "i" : "e"}`;
  if (lang === "tr") return `${n} deyim`;
  if (lang === "de") return `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""}`;
  if (lang === "ja") return `${n}件`;
  return `${n} expression${n > 1 ? "s" : ""}`;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const conceptParam = searchParams.get("concept") ?? "";
  const domainParam = searchParams.get("domain") ?? "";
  // Le filtre d'origine combine pays (param `country`) et sous-régions (param `region`).
  // On les fusionne en une seule liste de codes pour l'état du filtre.
  const countryParam = searchParams.get("country") ?? "";
  const regionParam = searchParams.get("region") ?? "";
  const filterParam = [countryParam, regionParam].filter(Boolean).join(",");
  const typeParam = searchParams.get("type_filter") ?? "";

  const [uiLang, setUILang] = useUILang();
  const [query, setQuery] = useState(qParam);
  const [countries, setCountries] = useState<{ code: string; label: string }[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept">("text");
  const [filterCountries, setFilterCountries] = useState<string[]>(
    filterParam ? filterParam.split(",").filter(Boolean) : []
  );
  const [sortMode, setSortMode] = useState<"relevance" | "country">("relevance");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [displayMode, setDisplayMode] = useState<"split" | "mix">("split");
  const [conceptBridgeResults, setConceptBridgeResults] = useState<Expression[]>([]);
  const [detectedConceptSlugs, setDetectedConceptSlugs] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(typeParam || null);
  const [facets, setFacets] = useState<Facets | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const allCountryCodes = countries.map((r) => r.code);
  const t = T[uiLang];

  // ─── Computed ───

  const groupedResults = useMemo(() => {
    if (sortMode !== "country" || results.length === 0) return null;
    const map = new Map<string, Expression[]>();
    for (const expr of results) {
      const code = expr.country || expr.region || expr.language || "??";
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(expr);
    }
    const ordered: { code: string; exprs: Expression[] }[] = [];
    for (const r of countries) {
      if (map.has(r.code)) ordered.push({ code: r.code, exprs: map.get(r.code)! });
    }
    for (const [code, exprs] of map) {
      if (!countries.some((r) => r.code === code)) ordered.push({ code, exprs });
    }
    return ordered;
  }, [results, sortMode, countries]);

  const matchTypeGroups = useMemo(() => {
    if (sortMode !== "relevance" || results.length === 0) return null;
    const ORDER = ["exact", "semantic", "concept"] as const;
    const map = new Map<string, Expression[]>();
    for (const expr of results) {
      const mt = (expr.match_type === "translation" || expr.match_type === "tag") ? "semantic" : expr.match_type;
      if (!map.has(mt)) map.set(mt, []);
      map.get(mt)!.push(expr);
    }
    const groups = ORDER.filter((mt) => map.has(mt)).map((mt) => ({ type: mt, exprs: map.get(mt)! }));
    return groups.length > 0 ? groups : null;
  }, [results, searchMode, sortMode]);

  const detectedSearchLang = useMemo(() => {
    if (searchMode !== "text" || results.length === 0) return null;
    const exact = results.filter(r => r.match_type === "exact");
    const counts: Record<string, number> = {};
    for (const r of exact) counts[r.language] = (counts[r.language] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return null;
    return sorted[0][0];
  }, [results, searchMode]);

  const langSplitSections = useMemo(() => {
    if (!detectedSearchLang || displayMode !== "split" || results.length === 0 || sortMode !== "relevance") return null;
    const inLang = results.filter(r => r.language === detectedSearchLang);
    const others = results.filter(r => r.language !== detectedSearchLang);
    return {
      main: {
        lang: detectedSearchLang,
        exact: inLang.filter(r => r.match_type === "exact"),
        semantic: inLang.filter(r => r.match_type !== "exact"),
      },
      others: {
        exact: others.filter(r => r.match_type === "exact" || r.match_type === "concept"),
        semantic: others.filter(r => r.match_type === "semantic" || r.match_type === "translation"),
      },
    };
  }, [results, detectedSearchLang, displayMode, sortMode]);

  // ─── Handlers ───

  const runSearch = useCallback(async (q: string, concept: string, domain: string, rf: string[], _allCodes: string[], lang: UILang, tf: string | null = null) => {
    setLoading(true);
    setHasError(false);
    setResults([]);
    setHasMore(false);
    setExpandedSections(new Set());
    setDisplayMode("split");
    setConceptBridgeResults([]);
    setDetectedConceptSlugs([]);
    // Le filtre combine pays et sous-régions : on les route vers les bons params API.
    const { countries: cf, regions: rg } = splitCountryRegion(rf);
    try {
      let data;
      if (domain && !q && !concept) {
        setSearchMode("concept");
        data = await searchByDomain(domain, rg, LIMIT, 0, lang, tf ?? undefined, cf, "random");
      } else if (concept && !q) {
        setSearchMode("concept");
        data = await searchByConcept([concept], rg, LIMIT, 0, tf ?? undefined, lang, undefined, cf);
      } else {
        setSearchMode("text");
        data = await searchExpressions(q, rg, LIMIT, 0, tf ?? undefined, lang, undefined, cf);
        if (data.detected_concepts?.length) {
          setDetectedConceptSlugs(data.detected_concepts);
          searchByConcept(data.detected_concepts, [], 12, 0, undefined, lang).then(bridge => {
            setConceptBridgeResults(bridge.results);
          }).catch(() => {});
        }
      }
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
      getFacets(cf, q, tf, domain || "", lang).then(setFacets);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const offset = results.length;
    const { countries: cf, regions: rg } = splitCountryRegion(filterCountries);
    try {
      let data;
      if (searchMode === "concept" && domainParam && !conceptParam) {
        data = await searchByDomain(domainParam, rg, LIMIT, offset, uiLang, undefined, cf, "random");
      } else if (searchMode === "concept") {
        data = await searchByConcept([conceptParam], rg, LIMIT, offset, undefined, uiLang, undefined, cf);
      } else {
        data = await searchExpressions(qParam, rg, LIMIT, offset, undefined, uiLang, undefined, cf);
      }
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, searchMode, qParam, conceptParam, domainParam, results.length, allCountryCodes, filterCountries, uiLang]);

  // Écrit les codes du filtre dans l'URL en les répartissant entre `country` et `region`.
  const setOriginParams = (params: URLSearchParams, codes: string[]) => {
    const { countries: cf, regions: rg } = splitCountryRegion(codes);
    if (cf.length) params.set("country", cf.join(","));
    if (rg.length) params.set("region", rg.join(","));
  };

  const submitSearch = useCallback((q: string) => {
    if (q.trim().length < 2) return;
    const params = new URLSearchParams({ q: q.trim() });
    setOriginParams(params, filterCountries);
    router.push(`/search?${params}`);
  }, [router, filterCountries]);

  const handleTagClick = useCallback((tag: string) => {
    const params = new URLSearchParams({ concept: tag });
    setOriginParams(params, filterCountries);
    router.push(`/search?${params}`);
  }, [router, filterCountries]);

  const handleFilterChange = useCallback((newFilter: string[]) => {
    setFilterCountries(newFilter);
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (conceptParam) params.set("concept", conceptParam);
    if (domainParam) params.set("domain", domainParam);
    setOriginParams(params, newFilter);
    router.replace(`/search?${params}`);
  }, [router, qParam, conceptParam, domainParam]);

  const handleTypeFilter = useCallback((newType: string | null) => {
    setTypeFilter(newType);
    runSearch(qParam, conceptParam, domainParam, filterCountries, allCountryCodes, uiLang, newType);
  }, [filterCountries, allCountryCodes, qParam, conceptParam, domainParam, uiLang, runSearch]);

  // ─── Effects ───

  useEffect(() => {
    getCountries().then((data) => {
      setCountries(data.map((r) => ({ code: r.code, label: `${FLAG[r.code] ?? "🌍"} ${COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}` })));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllTagNames(uiLang).then((tags) => { if (!cancelled) setTagNames(tags); });
    return () => { cancelled = true; };
  }, [uiLang]);

  // Trigger search when URL params, countries, or UI language change
  const allCountryCodesKey = allCountryCodes.join(",");
  useEffect(() => {
    if (!allCountryCodesKey) return;
    if (!qParam && !conceptParam && !domainParam) return;
    const rf = filterParam ? filterParam.split(",").filter(Boolean) : [];
    const tf = typeParam || null;
    setFilterCountries(rf);
    setTypeFilter(tf);
    runSearch(qParam, conceptParam, domainParam, rf, allCountryCodes, uiLang, tf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, conceptParam, domainParam, filterParam, typeParam, allCountryCodesKey, runSearch]);

  // Keep input in sync with URL (e.g. after browser back)
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  // Concept name as display label in the search bar
  const conceptDisplayName = conceptParam ? (tagNames[conceptParam] ?? conceptParam) : "";
  useEffect(() => {
    if (conceptParam && !qParam) setQuery(conceptDisplayName);
  }, [conceptParam, qParam, conceptDisplayName]);

  // Domain name as display label in the search bar
  const domainDisplayName = domainParam
    ? (DOMAIN_DEFS[domainParam]?.labels[uiLang] ?? domainParam)
    : "";
  useEffect(() => {
    if (domainParam && !qParam && !conceptParam) setQuery(domainDisplayName);
  }, [domainParam, qParam, conceptParam, domainDisplayName]);

  // Update document title
  useEffect(() => {
    if (qParam) document.title = t.titleSearch(qParam);
    else if (conceptParam) document.title = t.titleConcept(tagNames[conceptParam] ?? conceptParam);
    else if (domainParam) document.title = `${domainDisplayName} — World Expressions`;
    else document.title = t.titleDefault;
  }, [qParam, conceptParam, domainParam, tagNames, domainDisplayName, t]);

  // Infinite scroll
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
    const rf = filterParam ? filterParam.split(",").filter(Boolean) : [];
    const tf = typeParam || null;
    runSearch(qParam, conceptParam, domainParam, rf, allCountryCodes, lang, tf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParam, typeParam, runSearch, qParam, conceptParam, domainParam, allCountryCodes]);

  // ─── Render helpers ───

  const renderSubSection = (
    type: "exact" | "semantic",
    exprs: Expression[],
    sectionKey: string,
    opts?: { icon?: string; label?: string }
  ) => {
    if (exprs.length === 0) return null;
    const isExpanded = expandedSections.has(sectionKey);
    const visible = isExpanded ? exprs : exprs.slice(0, MAX_SECTION_PREVIEW);
    const hidden = exprs.length - MAX_SECTION_PREVIEW;
    const icon = opts?.icon ?? ({ exact: "🎯", semantic: "✨" } as Record<string, string>)[type];
    const label = opts?.label ?? (t.matchSections[type] ?? type);
    return (
      <div key={sectionKey} data-testid={sectionKey}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.75rem 0 0.5rem", color: "var(--ink-faint)", fontSize: 12, fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 600, color: "var(--ink-softer)" }}>{label}</span>
          <span>· {sectionExprCount(exprs.length, uiLang)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {visible.map((expr, i) => (
            <div key={expr.id} style={{ height: "100%", animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <ExpressionCard expression={expr} onTagClick={handleTagClick} uiLang={uiLang} tagNames={tagNames} fromSearch={qParam || undefined} />
            </div>
          ))}
        </div>
        {!isExpanded && hidden > 0 && (
          <button
            onClick={() => setExpandedSections(prev => new Set(prev).add(sectionKey))}
            style={{ marginTop: "0.75rem", background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer", padding: "0.25rem 0", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {t.showMore(hidden)}
          </button>
        )}
      </div>
    );
  };

  // ─── Render ───

  const domainDef = domainParam ? DOMAIN_DEFS[domainParam] : undefined;
  const domainColors = domainParam ? (DOMAIN_COLORS[domainParam] ?? { bg: "var(--paper-deep)", accent: "var(--ink-soft)" }) : undefined;

  const hasResults = results.length > 0;
  const showEmpty = !loading && !hasError && (qParam || conceptParam || domainParam) && results.length === 0;
  const showPlaceholder = !loading && !qParam && !conceptParam && !domainParam;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "var(--paper)",
          borderBottom: "1px solid var(--paper-edge)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ padding: "0.75rem 1.5rem", maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {conceptParam && DOMAIN_DEFS[conceptParam]?.emoji && (
                <span style={{ fontSize: "2.5rem", lineHeight: 1, flexShrink: 0, userSelect: "none" }}>
                  {DOMAIN_DEFS[conceptParam].emoji}
                </span>
              )}
              <div style={{ flex: 1 }}>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSearch={() => submitSearch(query)}
                  placeholder={t.placeholder}
                  searchLabel={t.search}
                  loading={loading}
                  emoji={tagIcon(query.trim()) ?? undefined}
                />
              </div>
            </div>
          </div>
          {hasResults && (
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" }}>
              <ResultsFilterBar
                countries={countries}
                filterCountries={filterCountries}
                onFilterChange={handleFilterChange}
                sortMode={sortMode}
                onSortChange={setSortMode}
                uiLang={uiLang}
                typeFilter={typeFilter}
                onTypeChange={handleTypeFilter}
                showSubregions
                facets={facets}
              />
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem 1.5rem 2rem" }}>
          {hasError && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--terra)" }}>{t.serverError}</p>
          )}

          {hasResults && !loading && (
            <p className="text-right text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
              {searchMode === "concept"
                ? `${total} expression${total > 1 ? "s" : ""}${conceptDisplayName ? ` — ${conceptDisplayName}` : ""}`
                : t.results(total, qParam)}
            </p>
          )}

          {searchMode === "text" && hasResults && detectedSearchLang && (
            <div style={{
              display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.625rem",
              background: "rgba(107, 77, 143, 0.06)",
              border: "1px solid rgba(107, 77, 143, 0.18)",
              borderRadius: "var(--r-md)",
              padding: "0.5rem 0.875rem",
              marginBottom: "1.25rem",
            }}>
              <span style={{ fontSize: 12, color: "var(--ink-softer)", fontFamily: "var(--font-body)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {LANG_FLAG[detectedSearchLang]} {LANG_NATIVE[detectedSearchLang]}
                <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>{t.detected}</span>
              </span>
              <div style={{ width: 1, height: 14, background: "rgba(107,77,143,0.2)", flexShrink: 0 }} />
              <div style={{
                display: "flex", marginLeft: "auto",
                background: "var(--paper)", border: "1px solid rgba(107,77,143,0.2)",
                borderRadius: "var(--r-md)", overflow: "hidden",
              }}>
                <button
                  onClick={() => setDisplayMode("split")}
                  style={{
                    fontSize: 12, fontFamily: "var(--font-body)",
                    padding: "0.3rem 0.8rem",
                    border: "none", borderRight: "1px solid rgba(107,77,143,0.2)",
                    background: displayMode === "split" ? "var(--plum)" : "transparent",
                    color: displayMode === "split" ? "white" : "var(--ink-soft)",
                    cursor: "pointer", fontWeight: displayMode === "split" ? 600 : 400,
                  }}
                >
                  {t.langFirst}
                </button>
                <button
                  onClick={() => setDisplayMode("mix")}
                  style={{
                    fontSize: 12, fontFamily: "var(--font-body)",
                    padding: "0.3rem 0.8rem",
                    border: "none",
                    background: displayMode === "mix" ? "var(--plum)" : "transparent",
                    color: displayMode === "mix" ? "white" : "var(--ink-soft)",
                    cursor: "pointer", fontWeight: displayMode === "mix" ? 600 : 400,
                  }}
                >
                  🌍 {t.mixAll}
                </button>
              </div>
            </div>
          )}

          {hasResults && (
            <>
              {searchMode === "concept" && domainDef && domainColors && (
                <div style={{
                  background: domainColors.bg,
                  borderRadius: "var(--r-lg)",
                  padding: "1.25rem 1.5rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both",
                }}>
                  <span style={{ fontSize: 48, lineHeight: 1 }}>{domainDef.emoji}</span>
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                      color: "#1c1410",
                      margin: "0 0 0.2rem",
                      fontWeight: 600,
                    }}>
                      {domainDef.labels[uiLang]}
                    </h2>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: domainColors.accent,
                      margin: 0,
                      fontWeight: 500,
                    }}>
                      {sectionExprCount(total, uiLang)}
                    </p>
                  </div>
                </div>
              )}
              {langSplitSections ? (
                <>
                  {/* Section 1: expressions dans la langue détectée */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.25rem", color: "var(--ink-soft)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                      <span>{LANG_FLAG[langSplitSections.main.lang]}</span>
                      <span style={{ fontWeight: 600 }}>{LANG_NATIVE[langSplitSections.main.lang]}</span>
                      <span style={{ color: "var(--ink-faint)" }}>· {sectionExprCount(langSplitSections.main.exact.length + langSplitSections.main.semantic.length, uiLang)}</span>
                    </div>
                    {renderSubSection("exact", langSplitSections.main.exact, "split-main-exact")}
                    {renderSubSection("semantic", langSplitSections.main.semantic, "split-main-semantic")}
                  </div>

                  {/* Section 2: même idée dans les autres langues (concept bridge) */}
                  {(() => {
                    const existingIds = new Set(results.map(r => r.id));
                    const bridgeExprs = conceptBridgeResults.filter(
                      r => r.language !== langSplitSections!.main.lang && !existingIds.has(r.id)
                    );
                    if (bridgeExprs.length === 0) return null;
                    const isExpanded = expandedSections.has("bridge");
                    const visible = isExpanded ? bridgeExprs : bridgeExprs.slice(0, MAX_SECTION_PREVIEW);
                    const hidden = bridgeExprs.length - MAX_SECTION_PREVIEW;
                    return (
                      <div data-testid="same-idea-section" style={{ marginTop: "2rem", borderTop: "1px solid var(--paper-edge)", paddingTop: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.75rem", color: "var(--ink-soft)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                          <span>💡</span>
                          <span style={{ fontWeight: 600 }}>{t.sameIdeaTitle}</span>
                          <span style={{ color: "var(--ink-faint)" }}>· {sectionExprCount(bridgeExprs.length, uiLang)}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                          {visible.map((expr, i) => (
                            <div key={expr.id} style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                              <ExpressionCard expression={expr} onTagClick={handleTagClick} uiLang={uiLang} tagNames={tagNames} fromSearch={qParam || undefined} />
                            </div>
                          ))}
                        </div>
                        {!isExpanded && hidden > 0 && (
                          <button
                            onClick={() => setExpandedSections(prev => new Set(prev).add("bridge"))}
                            style={{ marginTop: "0.75rem", background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer", padding: "0.25rem 0", textDecoration: "underline", textUnderlineOffset: 3 }}
                          >
                            {t.showMore(hidden)}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Section 3: autres langues via traductions */}
                  {(langSplitSections.others.semantic.length > 0) && (
                    <div style={{ marginTop: "2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.25rem", color: "var(--ink-soft)", fontSize: 13, fontFamily: "var(--font-body)", borderTop: "1px solid var(--paper-edge)", paddingTop: "1.5rem" }}>
                        <span>🌍</span>
                        <span style={{ fontWeight: 600 }}>{t.otherLangs}</span>
                        <span style={{ color: "var(--ink-faint)" }}>· {sectionExprCount(langSplitSections.others.semantic.length, uiLang)}</span>
                      </div>
                      {renderSubSection("semantic", langSplitSections.others.semantic, "split-others-semantic")}
                    </div>
                  )}
                </>
              ) : groupedResults ? (
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
                          <ExpressionCard expression={expr} onTagClick={handleTagClick} uiLang={uiLang} tagNames={tagNames} fromSearch={qParam || undefined} />
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
                      <span>{{ exact: "🎯", semantic: "✨", concept: "🏷️", translation: "🌍" }[type]}</span>
                      <span style={{ fontWeight: 600, color: "var(--ink-softer)" }}>{t.matchSections[type] ?? type}</span>
                      {searchMode !== "concept" && <span>· {sectionExprCount(exprs.length, uiLang)}</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                      {visible.map((expr, i) => (
                        <div key={expr.id} style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                          <ExpressionCard expression={expr} onTagClick={handleTagClick} uiLang={uiLang} tagNames={tagNames} fromSearch={qParam || undefined} />
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
                    <div key={expr.id} style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms` }}>
                      <ExpressionCard expression={expr} onTagClick={handleTagClick} uiLang={uiLang} tagNames={tagNames} fromSearch={qParam || undefined} />
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
              {!hasMore && results.length === total && total > LIMIT && (
                <p className="text-center text-xs py-4" style={{ color: "var(--ink-faint)" }}>
                  {t.allDisplayed(total)}
                </p>
              )}
            </>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--paper-edge)", borderTopColor: "var(--plum)" }} />
            </div>
          )}

          {showEmpty && (
            <div className="text-center mt-16">
              <p className="text-lg font-medium" style={{ color: "var(--ink-soft)" }}>{t.noResults}</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>{t.noResultsHint}</p>
            </div>
          )}

          {showPlaceholder && (
            <div style={{ textAlign: "center", marginTop: "5rem", color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>
              <p style={{ fontSize: 48, marginBottom: "0.75rem" }}>🔍</p>
              <p style={{ fontSize: 15 }}>{t.placeholder}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
          <div className="wex-skeleton" style={{ width: 320, height: 80, background: "var(--paper-deep)", borderRadius: "var(--r-lg)", border: "1px solid var(--paper-edge)" }} />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

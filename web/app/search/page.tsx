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
  searchExpressions, searchByConcept, getRegions, getAllTagNames, Expression,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

const LIMIT = 20;
type UILang = "fr" | "en" | "es" | "it" | "tr";

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
  },
};

function sectionExprCount(n: number, lang: UILang): string {
  if (lang === "es") return `${n} expresión${n > 1 ? "es" : ""}`;
  if (lang === "it") return `${n} espression${n > 1 ? "i" : "e"}`;
  if (lang === "tr") return `${n} deyim`;
  return `${n} expression${n > 1 ? "s" : ""}`;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const conceptParam = searchParams.get("concept") ?? "";
  const regionParam = searchParams.get("region") ?? "";

  const [uiLang, setUILang] = useState<UILang>("en");
  const [query, setQuery] = useState(qParam);
  const [regions, setRegions] = useState<{ code: string; label: string }[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept">("text");
  const [filterRegions, setFilterRegions] = useState<string[]>(
    regionParam ? regionParam.split(",").filter(Boolean) : []
  );
  const [sortMode, setSortMode] = useState<"relevance" | "country">("relevance");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const allRegionCodes = regions.map((r) => r.code);
  const t = T[uiLang];

  // ─── Computed ───

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
    const ORDER = ["exact", "semantic", "concept", "translation"] as const;
    const map = new Map<string, Expression[]>();
    for (const expr of results) {
      const mt = expr.match_type;
      if (!map.has(mt)) map.set(mt, []);
      map.get(mt)!.push(expr);
    }
    const groups = ORDER.filter((mt) => map.has(mt)).map((mt) => ({ type: mt, exprs: map.get(mt)! }));
    return groups.length > 0 ? groups : null;
  }, [results, searchMode, sortMode]);

  // ─── Handlers ───

  const runSearch = useCallback(async (q: string, concept: string, rf: string[], allCodes: string[], lang: UILang) => {
    const regionCodes = rf.length ? rf : allCodes;
    setLoading(true);
    setHasError(false);
    setResults([]);
    setHasMore(false);
    setExpandedSections(new Set());
    try {
      let data;
      if (concept && !q) {
        setSearchMode("concept");
        data = await searchByConcept([concept], regionCodes, LIMIT, 0);
      } else {
        setSearchMode("text");
        data = await searchExpressions(q, regionCodes, LIMIT, 0, undefined, lang);
      }
      setResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
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
    const activeRegions = filterRegions.length > 0 ? filterRegions : allRegionCodes;
    try {
      const data = searchMode === "concept"
        ? await searchByConcept([conceptParam], activeRegions, LIMIT, offset)
        : await searchExpressions(qParam, activeRegions, LIMIT, offset, undefined, uiLang);
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, searchMode, qParam, conceptParam, results.length, allRegionCodes, filterRegions, uiLang]);

  const submitSearch = useCallback((q: string) => {
    if (q.trim().length < 2) return;
    const params = new URLSearchParams({ q: q.trim() });
    if (filterRegions.length) params.set("region", filterRegions.join(","));
    router.push(`/search?${params}`);
  }, [router, filterRegions]);

  const handleTagClick = useCallback((tag: string) => {
    const params = new URLSearchParams({ concept: tag });
    if (filterRegions.length) params.set("region", filterRegions.join(","));
    router.push(`/search?${params}`);
  }, [router, filterRegions]);

  const handleFilterChange = useCallback((newFilter: string[]) => {
    setFilterRegions(newFilter);
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (conceptParam) params.set("concept", conceptParam);
    if (newFilter.length) params.set("region", newFilter.join(","));
    router.replace(`/search?${params}`);
  }, [router, qParam, conceptParam]);

  // ─── Effects ───

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getRegions().then((data) => {
      setRegions(data.map((r) => ({ code: r.code, label: `${FLAG[r.code] ?? "🌍"} ${COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}` })));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllTagNames(uiLang).then((tags) => { if (!cancelled) setTagNames(tags); });
    return () => { cancelled = true; };
  }, [uiLang]);

  // Trigger search when URL params or regions change
  const allRegionCodesKey = allRegionCodes.join(",");
  useEffect(() => {
    if (!allRegionCodesKey) return;
    if (!qParam && !conceptParam) return;
    const rf = regionParam ? regionParam.split(",").filter(Boolean) : [];
    setFilterRegions(rf);
    runSearch(qParam, conceptParam, rf, allRegionCodes, uiLang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, conceptParam, regionParam, allRegionCodesKey, runSearch]);

  // Keep input in sync with URL (e.g. after browser back)
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  // Concept name as display label in the search bar
  const conceptDisplayName = conceptParam ? (tagNames[conceptParam] ?? conceptParam) : "";
  useEffect(() => {
    if (conceptParam && !qParam) setQuery(conceptDisplayName);
  }, [conceptParam, qParam, conceptDisplayName]);

  // Update document title
  useEffect(() => {
    if (qParam) document.title = t.titleSearch(qParam);
    else if (conceptParam) document.title = t.titleConcept(tagNames[conceptParam] ?? conceptParam);
    else document.title = t.titleDefault;
  }, [qParam, conceptParam, tagNames, t]);

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
    localStorage.setItem("wex_lang", lang);
  }, []);

  // ─── Render ───

  const hasResults = results.length > 0;
  const showEmpty = !loading && !hasError && (qParam || conceptParam) && results.length === 0;
  const showPlaceholder = !loading && !qParam && !conceptParam;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>
        <div style={{ padding: "2rem 1.5rem 1rem", maxWidth: 720, margin: "0 auto" }}>
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

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 2rem" }}>
          {hasError && (
            <p className="text-center text-sm mb-6" style={{ color: "var(--terra)" }}>{t.serverError}</p>
          )}

          {hasResults && (
            <ResultsFilterBar
              regions={regions}
              filterRegions={filterRegions}
              onFilterChange={handleFilterChange}
              sortMode={sortMode}
              onSortChange={setSortMode}
              uiLang={uiLang}
            />
          )}

          {hasResults && !loading && (
            <p className="text-right text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
              {searchMode === "concept"
                ? `${total} expression${total > 1 ? "s" : ""}${conceptDisplayName ? ` — ${conceptDisplayName}` : ""}`
                : t.results(total, qParam)}
            </p>
          )}

          {hasResults && (
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
                      <span>{{ exact: "🎯", semantic: "💡", concept: "🏷️", translation: "🌍" }[type]}</span>
                      <span style={{ fontWeight: 600, color: "var(--ink-softer)" }}>{t.matchSections[type] ?? type}</span>
                      <span>· {sectionExprCount(exprs.length, uiLang)}</span>
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

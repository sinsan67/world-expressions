"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ExpressionCard from "@/components/ExpressionCard";
import { searchExpressions, searchByConcept, getTopTags, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";

const LIMIT = 20;

const REGIONS = [
  { code: "fr", label: "🇫🇷 France" },
  { code: "uk", label: "🇬🇧 UK" },
  { code: "us", label: "🇺🇸 USA" },
  { code: "au", label: "🇦🇺 Australia" },
  { code: "es", label: "🇪🇸 España" },
];

const HINT_COUNT = 10;

type UILang = "fr" | "en" | "es";

const T = {
  fr: {
    badge: "Langue & Culture",
    subtitle: "Tapez un mot, découvrez des expressions du monde entier — par le texte ou par le sens.",
    placeholder: "Essaie : pied, argent, animal, partir…",
    search: "Rechercher",
    filterByCountry: "Filtrer par pays",
    mixTitle: "Mélanger les pays",
    exploreByKeyword: "Explorez par mot-clé",
    someIdeas: "Quelques idées…",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} pour « ${q} »`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} affichée${n > 1 ? "s" : ""}`,
    noResults: "Aucune expression trouvée",
    noResultsHint: "Essaie un autre mot ou une variante…",
    serverError: "Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.",
  },
  en: {
    badge: "Language & Culture",
    subtitle: "Type a word, discover expressions from around the world — by text or meaning.",
    placeholder: "Try: money, animal, leave, fear…",
    search: "Search",
    filterByCountry: "Filter by country",
    mixTitle: "Mix countries",
    exploreByKeyword: "Explore by keyword",
    someIdeas: "Some ideas…",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} for "${q}"`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} displayed`,
    noResults: "No expressions found",
    noResultsHint: "Try another word or a variant…",
    serverError: "Could not reach the server. Make sure the API is running on localhost:8000.",
  },
  es: {
    badge: "Lengua & Cultura",
    subtitle: "Escribe una palabra, descubre expresiones de todo el mundo — por texto o por sentido.",
    placeholder: "Prueba: dinero, animal, partir, miedo…",
    search: "Buscar",
    filterByCountry: "Filtrar por país",
    mixTitle: "Mezclar países",
    exploreByKeyword: "Explorar por palabra clave",
    someIdeas: "Algunas ideas…",
    results: (n: number, q: string) => `${n} expresión${n > 1 ? "es" : ""} para « ${q} »`,
    allDisplayed: (n: number) => `${n} expresión${n > 1 ? "es" : ""} mostrada${n > 1 ? "s" : ""}`,
    noResults: "No se encontraron expresiones",
    noResultsHint: "Prueba otra palabra o una variante…",
    serverError: "No se pudo contactar el servidor. Verifica que la API esté en localhost:8000.",
  },
};

// Round-robin interleaving by region/language — no re-fetch needed
function applyMix(items: Expression[]): Expression[] {
  const bucketMap = new Map<string, Expression[]>();
  for (const item of items) {
    const key = item.region || item.language || "other";
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key)!.push(item);
  }
  const groups = [...bucketMap.values()];
  const result: Expression[] = [];
  let i = 0;
  while (result.length < items.length) {
    let anyLeft = false;
    for (const group of groups) {
      if (i < group.length) {
        result.push(group[i]);
        anyLeft = true;
      }
    }
    if (!anyLeft) break;
    i++;
  }
  return result;
}

export default function Home() {
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [query, setQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(REGIONS.map((r) => r.code))
  );
  const [rawResults, setRawResults] = useState<Expression[]>([]);
  const [mixActive, setMixActive] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept">("text");
  const [hintTags, setHintTags] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const t = T[uiLang];
  const activeRegions = [...selectedRegions];
  const displayResults = useMemo(
    () => (mixActive ? applyMix(rawResults) : rawResults),
    [rawResults, mixActive]
  );

  const toggleRegion = (code: string) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size === 1) return prev;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const runConceptSearch = useCallback(
    async (tag: string, regions: string[]) => {
      setQuery(tag);
      setSearchMode("concept");
      setLoading(true);
      setHasError(false);
      setSearched(true);
      setRawResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(tag));
      try {
        const data = await searchByConcept([tag], regions, LIMIT, 0);
        setRawResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setHasError(true);
        setRawResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) return;
      setSearchMode("text");
      setLoading(true);
      setHasError(false);
      setSearched(true);
      setRawResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(q));
      try {
        const data = await searchExpressions(q, activeRegions, LIMIT, 0);
        setRawResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setHasError(true);
        setRawResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [activeRegions]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const currentOffset = rawResults.length;
    try {
      const data =
        searchMode === "concept"
          ? await searchByConcept([query], activeRegions, LIMIT, currentOffset)
          : await searchExpressions(query, activeRegions, LIMIT, currentOffset);
      setRawResults((prev) => [...prev, ...data.results]);
      setHasMore(currentOffset + data.results.length < data.total);
    } catch {
      // silent — user can scroll back up and retry
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, searchMode, query, activeRegions, rawResults.length]);

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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#q=")) {
      const initQ = decodeURIComponent(hash.slice(3));
      if (initQ.trim().length >= 2) handleSearch(initQ);
    }
    getTopTags(40).then((tags) => {
      const withEmoji = tags.map((tag) => tag.slug).filter((s) => tagIcon(s));
      const shuffled = withEmoji.sort(() => Math.random() - 0.5);
      setHintTags(shuffled.slice(0, HINT_COUNT));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#f5f3ff" }}>
      {/* Hero */}
      <div
        className="px-4 py-10 text-center border-b relative"
        style={{ background: "#fff", borderColor: "#ede9fe" }}
      >
        {/* Language switcher — top right */}
        <div style={{ position: "absolute", top: 16, right: 20, display: "flex", gap: 4 }}>
          {(["fr", "en", "es"] as UILang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setUILang(lang)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: uiLang === lang ? "#7c3aed" : "#e5e7eb",
                background: uiLang === lang ? "#7c3aed" : "transparent",
                color: uiLang === lang ? "#fff" : "#9ca3af",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Badge */}
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          {t.badge}
        </span>

        <h1
          className="text-4xl font-bold mb-3 cursor-pointer"
          style={{ color: "#1a0a2e" }}
          onClick={() => {
            setQuery("");
            setSearched(false);
            setRawResults([]);
            setHasError(false);
            window.history.replaceState(null, "", window.location.pathname);
          }}
        >
          Expressions{" "}
          <em className="not-italic" style={{ color: "#7c3aed" }}>
            du Monde
          </em>
        </h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
          {t.subtitle}
        </p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto flex gap-2 mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder={t.placeholder}
            className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{
              border: "1.5px solid #ede9fe",
              color: "#1a0a2e",
              background: "#faf9ff",
            }}
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: "#7c3aed" }}
          >
            {loading ? "…" : t.search}
          </button>
        </div>

        {/* Country filters + Mix toggle */}
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <span className="text-xs self-center mr-1" style={{ color: "#9ca3af" }}>
            {t.filterByCountry}
          </span>
          {REGIONS.map((r) => (
            <button
              key={r.code}
              onClick={() => toggleRegion(r.code)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                selectedRegions.has(r.code)
                  ? { background: "#7c3aed", color: "#fff" }
                  : { background: "#f3f4f6", color: "#9ca3af" }
              }
            >
              {r.label}
            </button>
          ))}
          {/* Mix Countries circular toggle */}
          <button
            onClick={() => setMixActive((v) => !v)}
            title={t.mixTitle}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: mixActive ? "#7c3aed" : "#d1d5db",
              background: mixActive ? "#7c3aed" : "transparent",
              color: mixActive ? "#fff" : "#9ca3af",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ⇄
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error */}
        {hasError && (
          <p className="text-red-500 text-center mb-6 text-sm">{t.serverError}</p>
        )}

        {/* Result count */}
        {searched && !loading && !hasError && displayResults.length > 0 && (
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>
            {t.results(total, query)}
          </p>
        )}

        {/* Results grid */}
        {displayResults.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {displayResults.map((expr) => (
                <ExpressionCard
                  key={expr.id}
                  expression={expr}
                  onTagClick={(tag) => runConceptSearch(tag, activeRegions)}
                />
              ))}
            </div>

            {/* Sentinel + infinite scroll spinner */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#ede9fe", borderTopColor: "#7c3aed" }}
                />
              </div>
            )}
            {!hasMore && displayResults.length > 0 && displayResults.length === total && total > LIMIT && (
              <p className="text-center text-xs py-4" style={{ color: "#9ca3af" }}>
                {t.allDisplayed(total)}
              </p>
            )}
          </>
        )}

        {/* No results */}
        {searched && !loading && displayResults.length === 0 && !hasError && (
          <div className="text-center mt-16">
            <p className="text-lg font-medium" style={{ color: "#6b7280" }}>
              {t.noResults}
            </p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              {t.noResultsHint}
            </p>
          </div>
        )}

        {/* Home screen hint chips */}
        {!searched && (
          <div className="text-center mt-10">
            <p className="text-base font-medium mb-1" style={{ color: "#6b7280" }}>
              {t.exploreByKeyword}
            </p>
            <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
              {t.someIdeas}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {hintTags.map((word) => {
                const icon = tagIcon(word) || "🔍";
                return (
                  <button
                    key={word}
                    onClick={() => runConceptSearch(word, activeRegions)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-medium transition-all hover:shadow-md"
                    style={{
                      background: "#fff",
                      border: "1px solid #ede9fe",
                      color: "#6b7280",
                      minWidth: "72px",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed";
                      (e.currentTarget as HTMLElement).style.color = "#7c3aed";
                      (e.currentTarget as HTMLElement).style.background = "#faf7ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#ede9fe";
                      (e.currentTarget as HTMLElement).style.color = "#6b7280";
                      (e.currentTarget as HTMLElement).style.background = "#fff";
                    }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span>{word}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ExpressionCard from "@/components/ExpressionCard";
import { searchExpressions, searchByConcept, getTopTags, getRandomExpression, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";

const LIMIT = 20;

const REGIONS = [
  { code: "fr", label: "🇫🇷 France" },
  { code: "uk", label: "🇬🇧 UK" },
  { code: "us", label: "🇺🇸 USA" },
  { code: "au", label: "🇦🇺 Australia" },
  { code: "es", label: "🇪🇸 España" },
];

// Fallback gradient per region — flag colors, muted/pastel, shown when image is not yet placed
const REGION_GRADIENTS: Record<string, string> = {
  fr: "linear-gradient(135deg, #8da7c4 0%, #c5cfe8 40%, #d4a0a8 100%)",
  uk: "linear-gradient(135deg, #7a8fb5 0%, #b5c0d8 45%, #c49090 100%)",
  us: "linear-gradient(135deg, #7a90b8 0%, #aabbd8 45%, #c49898 100%)",
  au: "linear-gradient(135deg, #6e8ab5 0%, #9eb0d0 50%, #c09090 100%)",
  es: "linear-gradient(135deg, #c49090 0%, #d8b8a0 40%, #d4c070 100%)",
  tr: "linear-gradient(135deg, #c49090 0%, #d4a8a8 50%, #3a3a4a 100%)",
  it: "linear-gradient(135deg, #90b8a0 0%, #d8d8d8 45%, #c49090 100%)",
  default: "linear-gradient(135deg, #9090b8 0%, #b0a0c8 50%, #c8b0d8 100%)",
};

const HINT_COUNT = 12;

type UILang = "fr" | "en" | "es";

const T = {
  fr: {
    expressionOfMoment: "Expression du moment",
    exploreConcept: "Explorer ce concept",
    subtitle: "Tapez un mot, découvrez des expressions du monde entier — par le texte ou par le sens.",
    placeholder: "Essaie : pied, argent, animal, partir…",
    search: "Rechercher",
    filterByCountry: "Filtrer par pays",
    mixTitle: "Mélanger les pays",
    filterByConcept: "Filtrer par concept",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} pour « ${q} »`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} affichée${n > 1 ? "s" : ""}`,
    noResults: "Aucune expression trouvée",
    noResultsHint: "Essaie un autre mot ou une variante…",
    serverError: "Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.",
  },
  en: {
    expressionOfMoment: "Expression of the moment",
    exploreConcept: "Explore this concept",
    subtitle: "Type a word, discover expressions from around the world — by text or meaning.",
    placeholder: "Try: money, animal, leave, fear…",
    search: "Search",
    filterByCountry: "Filter by country",
    mixTitle: "Mix countries",
    filterByConcept: "Filter by concept",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} for "${q}"`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} displayed`,
    noResults: "No expressions found",
    noResultsHint: "Try another word or a variant…",
    serverError: "Could not reach the server. Make sure the API is running on localhost:8000.",
  },
  es: {
    expressionOfMoment: "Expresión del momento",
    exploreConcept: "Explorar este concepto",
    subtitle: "Escribe una palabra, descubre expresiones de todo el mundo — por texto o por sentido.",
    placeholder: "Prueba: dinero, animal, partir, miedo…",
    search: "Buscar",
    filterByCountry: "Filtrar por país",
    mixTitle: "Mezclar países",
    filterByConcept: "Filtrar por concepto",
    results: (n: number, q: string) => `${n} expresión${n > 1 ? "es" : ""} para « ${q} »`,
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
  const [hintKey, setHintKey] = useState(0);
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
  const [featured, setFeatured] = useState<(Expression & { meaning_locale: string }) | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

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
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      // silent
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getRandomExpression(uiLang).then(setFeatured).catch(() => {});
  }, [uiLang]);

  useEffect(() => {
    getTopTags(uiLang, 40).then((tags) => {
      const withEmoji = tags.map((tag) => tag.slug).filter((s) => tagIcon(s));
      const shuffled = withEmoji.sort(() => Math.random() - 0.5);
      setHintTags(shuffled.slice(0, HINT_COUNT));
    }).catch(() => {});
  }, [uiLang, hintKey]);

  return (
    <main className="min-h-screen" style={{ background: "#f5f3ff" }}>

      {/* ===== SECTION 1 : HERO — identité du site + expression du moment ===== */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 320, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Background — image pays + gradient fallback, crossfade au changement */}
        <div
          key={featured?.region || "default"}
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: featured?.region
              ? `url('/images/${featured.region}.jpg') center/cover, ${REGION_GRADIENTS[featured.region] || REGION_GRADIENTS.default}`
              : REGION_GRADIENTS.default,
            animation: "bgFadeIn 1.2s ease-out both",
          }}
        />
        {/* Gradient overlay pour lisibilité du texte */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(10,4,28,0.42) 0%, rgba(10,4,28,0.25) 45%, rgba(10,4,28,0.58) 100%)",
          }}
        />

        {/* Contenu hero */}
        <div style={{ position: "relative", zIndex: 2, padding: "1.75rem 2rem 2rem" }}>

          {/* Sélecteur de langue — coin haut droite */}
          <div style={{ position: "absolute", top: 16, right: 20, display: "flex", gap: 4 }}>
            {(["fr", "en", "es"] as UILang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => { setUILang(lang); setHintKey((k) => k + 1); }}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: uiLang === lang ? "#a78bfa" : "rgba(255,255,255,0.25)",
                  background: uiLang === lang ? "#7c3aed" : "rgba(255,255,255,0.08)",
                  color: uiLang === lang ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Deux colonnes : titre à gauche — expression du moment à droite */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "2.5rem",
              maxWidth: 980, margin: "2.5rem auto 0",
              flexWrap: "wrap",
            }}
          >
            {/* Gauche : titre + sous-titre */}
            <div style={{ flex: "1 1 260px", textAlign: "left" }}>
              <h1
                className="text-4xl font-bold cursor-pointer"
                style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)", lineHeight: 1.15 }}
                onClick={() => {
                  setQuery("");
                  setSearched(false);
                  setRawResults([]);
                  setHasError(false);
                  window.history.replaceState(null, "", window.location.pathname);
                }}
              >
                Expressions{" "}
                <em className="not-italic" style={{ color: "#c4b5fd" }}>du Monde</em>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.68)", marginTop: "0.75rem", fontSize: 15, lineHeight: 1.65, maxWidth: 340 }}>
                {t.subtitle}
              </p>
            </div>

            {/* Droite : expression du moment */}
            {!searched && featured && (
              <div
                style={{
                  flex: "1 1 300px", maxWidth: 480,
                  animation: "fadeSlideUp 0.5s ease-out both",
                }}
              >
                <div
                  style={{
                    background: "rgba(10,4,28,0.62)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 16,
                    padding: "1rem 1.25rem",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c4b5fd" }}>
                      ✨ {t.expressionOfMoment}
                    </span>
                    <button
                      onClick={() => getRandomExpression(uiLang).then(setFeatured).catch(() => {})}
                      title="Nouvelle expression"
                      style={{
                        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                    >
                      🔀
                    </button>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: "0.35rem", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    <span style={{ color: "#a78bfa", marginRight: 3 }}>"</span>
                    {featured.expression}
                    <span style={{ color: "#a78bfa", marginLeft: 3 }}>"</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                        {featured.meaning}
                      </p>
                      {featured.meaning_locale !== uiLang && (
                        <span style={{ display: "inline-block", marginTop: "0.3rem", fontSize: 10, color: "#c4b5fd", fontStyle: "italic" }}>
                          {featured.meaning_locale === "fr" ? "🇫🇷 sens en français" : featured.meaning_locale === "en" ? "🇬🇧 meaning in English" : featured.meaning_locale === "es" ? "🇪🇸 sentido en español" : ""}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {featured.region === "fr" ? "🇫🇷" : featured.region === "uk" ? "🇬🇧" : featured.region === "us" ? "🇺🇸" : featured.region === "au" ? "🇦🇺" : featured.region === "es" ? "🇪🇸" : "🌍"}
                    </span>
                  </div>
                  {featured.tags.length > 0 && (
                    <button
                      onClick={() => runConceptSearch(featured.tags[0], activeRegions)}
                      style={{
                        marginTop: "0.75rem", fontSize: 11, fontWeight: 600, color: "#e9d5ff",
                        background: "rgba(124,58,237,0.35)", border: "none", borderRadius: 7,
                        padding: "5px 12px", cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.55)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.35)"; }}
                    >
                      → {t.exploreConcept}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SECTION 2 : EXPLORER — barre de recherche + filtres + chips ===== */}
      <div ref={exploreRef} style={{ background: "#f5f3ff", padding: "2rem 1rem 1.5rem", borderBottom: "1px solid #ede9fe" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>

          {/* Barre de recherche */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder={t.placeholder}
              className="explore-input flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "white",
                border: "1.5px solid #e5e7eb",
                color: "#1f2937",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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

          {/* Filtres pays + Mix */}
          <div className="flex flex-wrap justify-center gap-2 items-center mb-4">
            <span className="text-xs self-center mr-1" style={{ color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                    : { background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }
                }
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => setMixActive((v) => !v)}
              title={t.mixTitle}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "1.5px solid",
                borderColor: mixActive ? "#a78bfa" : "#e5e7eb",
                background: mixActive ? "#7c3aed" : "white",
                color: mixActive ? "#fff" : "#9ca3af",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              ⇄
            </button>
          </div>

          {/* Themes — ligne horizontale scrollable, même style que filtres pays */}
          {!searched && hintTags.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                  {t.filterByConcept}
                </span>
                <div style={{ flex: 1, height: 1, background: "#e9d5ff" }} />
              </div>
              <div
                style={{
                  display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
                }}
              >
                {hintTags.map((word) => {
                  const icon = tagIcon(word) || "🔍";
                  return (
                    <button
                      key={word}
                      onClick={() => { runConceptSearch(word, activeRegions); setHintKey((k) => k + 1); }}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        color: "#6b7280",
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#7c3aed";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                        (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "white";
                        (e.currentTarget as HTMLElement).style.color = "#6b7280";
                        (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                      }}
                    >
                      <span>{icon}</span>
                      <span>{word}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Résultats ===== */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {hasError && (
          <p className="text-red-500 text-center mb-6 text-sm">{t.serverError}</p>
        )}

        {/* Filtres pays au-dessus des résultats */}
        {searched && (
          <div className="flex flex-wrap gap-2 items-center mb-5">
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                    : { background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }
                }
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => setMixActive((v) => !v)}
              title={t.mixTitle}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "1.5px solid",
                borderColor: mixActive ? "#a78bfa" : "#e5e7eb",
                background: mixActive ? "#7c3aed" : "white",
                color: mixActive ? "#fff" : "#9ca3af",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              ⇄
            </button>
            {!loading && !hasError && displayResults.length > 0 && (
              <span className="text-sm ml-auto" style={{ color: "#9ca3af" }}>
                {t.results(total, query)}
              </span>
            )}
          </div>
        )}


        {displayResults.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {displayResults.map((expr, i) => (
                <div
                  key={expr.id}
                  style={{
                    animation: "fadeSlideUp 0.35s ease-out both",
                    animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms`,
                  }}
                >
                  <ExpressionCard
                    expression={expr}
                    onTagClick={(tag) => runConceptSearch(tag, activeRegions)}
                    uiLang={uiLang}
                  />
                </div>
              ))}
            </div>

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
      </div>
    </main>
  );
}

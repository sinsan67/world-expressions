"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ExpressionCard from "@/components/ExpressionCard";
import { searchExpressions, searchByConcept, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";

const LIMIT = 20;

const REGIONS = [
  { code: "fr", label: "🇫🇷 France" },
  { code: "uk", label: "🇬🇧 UK" },
  { code: "us", label: "🇺🇸 USA" },
  { code: "au", label: "🇦🇺 Australia" },
  { code: "es", label: "🇪🇸 España" },
];

const HINTS: Record<string, string[]> = {
  fr: ["pied", "argent", "animal", "peur"],
  uk: ["rain", "luck", "time"],
  us: ["money", "fire", "cake"],
  au: ["mate", "fair", "work"],
  es: ["dinero", "suerte", "agua", "trabajo"],
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(REGIONS.map((r) => r.code))
  );
  const [results, setResults] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept">("text");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activeRegions = [...selectedRegions];

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
      setError(null);
      setSearched(true);
      setResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(tag));
      try {
        const data = await searchByConcept([tag], regions, LIMIT, 0);
        setResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setError("Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.");
        setResults([]);
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
      setError(null);
      setSearched(true);
      setResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(q));
      try {
        const data = await searchExpressions(q, activeRegions, LIMIT, 0);
        setResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setError("Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.");
        setResults([]);
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
    const currentOffset = results.length;
    try {
      const data =
        searchMode === "concept"
          ? await searchByConcept([query], activeRegions, LIMIT, currentOffset)
          : await searchExpressions(query, activeRegions, LIMIT, currentOffset);
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(currentOffset + data.results.length < data.total);
    } catch {
      // silent for load-more failures — user can scroll up and try again
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, searchMode, query, activeRegions, results.length]);

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
      if (initQ.trim().length >= 2) {
        handleSearch(initQ);
      }
    }
    // run once on mount — handleSearch is stable at this point (all regions selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chips de suggestion affichées sur l'écran d'accueil
  const hintWords = REGIONS.flatMap((r) =>
    selectedRegions.has(r.code) ? HINTS[r.code] : []
  );

  return (
    <main className="min-h-screen" style={{ background: "#f5f3ff" }}>
      {/* Hero */}
      <div
        className="px-4 py-10 text-center border-b"
        style={{ background: "#fff", borderColor: "#ede9fe" }}
      >
        {/* Petite étiquette */}
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          Langue &amp; Culture
        </span>

        <h1
          className="text-4xl font-bold mb-3 cursor-pointer"
          style={{ color: "#1a0a2e" }}
          onClick={() => {
            setQuery("");
            setSearched(false);
            setResults([]);
            setError(null);
            window.history.replaceState(null, "", window.location.pathname);
          }}
        >
          Expressions{" "}
          <em className="not-italic" style={{ color: "#7c3aed" }}>
            du Monde
          </em>
        </h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
          Tapez un mot, découvrez des expressions du monde entier — par le texte ou par le sens.
        </p>

        {/* Barre de recherche */}
        <div className="max-w-xl mx-auto flex gap-2 mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Essaie : pied, argent, animal, partir…"
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
            {loading ? "…" : "Rechercher"}
          </button>
        </div>

        {/* Filtres pays */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs self-center mr-1" style={{ color: "#9ca3af" }}>
            Filtrer par pays
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
        </div>
      </div>

      {/* Zone principale */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Erreur */}
        {error && (
          <p className="text-red-500 text-center mb-6 text-sm">{error}</p>
        )}

        {/* Compteur de résultats */}
        {searched && !loading && !error && results.length > 0 && (
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>
            <strong style={{ color: "#1a0a2e" }}>{total}</strong> expression
            {total > 1 ? "s" : ""} pour «{" "}
            <strong style={{ color: "#1a0a2e" }}>{query}</strong> »
          </p>
        )}

        {/* Grille de résultats */}
        {results.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {results.map((expr) => (
                <ExpressionCard
                  key={expr.id}
                  expression={expr}
                  onTagClick={(tag) => runConceptSearch(tag, activeRegions)}
                />
              ))}
            </div>

            {/* Sentinel + spinner infinite scroll */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#ede9fe", borderTopColor: "#7c3aed" }}
                />
              </div>
            )}
            {!hasMore && results.length > 0 && results.length === total && total > LIMIT && (
              <p className="text-center text-xs py-4" style={{ color: "#9ca3af" }}>
                {total} expression{total > 1 ? "s" : ""} affichée{total > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}

        {/* Aucun résultat */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center mt-16">
            <p className="text-lg font-medium" style={{ color: "#6b7280" }}>
              Aucune expression trouvée
            </p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              Essaie un autre mot ou une variante…
            </p>
          </div>
        )}

        {/* Écran d'accueil avec hint chips */}
        {!searched && (
          <div className="text-center mt-10">
            <p className="text-base font-medium mb-1" style={{ color: "#6b7280" }}>
              Explorez par mot-clé
            </p>
            <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
              Quelques idées…
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {hintWords.map((word) => {
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

"use client";

import { useState, useCallback } from "react";
import ExpressionCard from "@/components/ExpressionCard";
import { searchExpressions, searchByConcept, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";

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
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

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
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const data = await searchByConcept([tag], regions);
        setResults(data.results);
        setTotal(data.total);
      } catch {
        setError("Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) return;
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const data = await searchExpressions(q, activeRegions);
        setResults(data.results);
        setTotal(data.total);
      } catch {
        setError("Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [activeRegions]
  );

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
              focusRingColor: "#7c3aed",
            }}
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: "#7c3aed" }}
          >
            {loading ? "…" : "Chercher"}
          </button>
        </div>

        {/* Filtres pays */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs self-center mr-1" style={{ color: "#9ca3af" }}>
            Expressions depuis
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((expr) => (
              <ExpressionCard
                key={expr.id}
                expression={expr}
                onTagClick={(tag) => runConceptSearch(tag, activeRegions)}
              />
            ))}
          </div>
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
              Tapez un mot pour explorer
            </p>
            <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
              Par exemple…
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

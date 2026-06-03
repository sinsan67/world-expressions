"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { getTopTags } from "@/lib/api";
import { FLAG } from "@/lib/constants";

const PLACEHOLDER: Record<string, string> = {
  fr: "Essaie : pied, argent, animal…",
  en: "Try: money, animal, fear…",
  es: "Prueba: dinero, animal, miedo…",
  tr: "Dene: para, hayvan, korku…",
  it: "Prova: soldi, animale, paura…",
};

const SEARCH_LABEL: Record<string, string> = {
  fr: "Rechercher →", en: "Search →", es: "Buscar →", it: "Cerca →", tr: "Ara →",
};

const FILTER_LABEL: Record<string, string> = {
  fr: "Pays", en: "Country", es: "País", it: "Paese", tr: "Ülke",
};

const CONCEPT_LABEL: Record<string, string> = {
  fr: "Concepts", en: "Concepts", es: "Conceptos", it: "Concetti", tr: "Kavramlar",
};

const ALL_LABEL: Record<string, string> = {
  fr: "Tous", en: "All", es: "Todos", it: "Tutti", tr: "Tümü",
};

const LANG_REGIONS = [
  { code: "fr", flag: "🇫🇷" },
  { code: "uk", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
  { code: "it", flag: "🇮🇹" },
  { code: "tr", flag: "🇹🇷" },
] as const;

type Props = { uiLang?: string; onClose: () => void };

export default function SearchOverlay({ uiLang = "en", onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [conceptTags, setConceptTags] = useState<{ slug: string; name: string }[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    getTopTags("", 20, uiLang).then((tags) => {
      setConceptTags(tags.map((t) => ({ slug: t.slug, name: t.name })));
    }).catch(() => {});
  }, [uiLang]);

  const toggleRegion = (code: string) => {
    setSelectedRegions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams();
    params.set("q", q);
    if (selectedRegions.length) params.set("region", selectedRegions.join(","));
    router.push(`/search?${params}`);
    onClose();
  }, [query, selectedRegions, router, onClose]);

  const handleConceptClick = (slug: string) => {
    const params = new URLSearchParams();
    params.set("concept", slug);
    if (selectedRegions.length) params.set("region", selectedRegions.join(","));
    router.push(`/search?${params}`);
    onClose();
  };

  const canSearch = query.trim().length >= 2;

  const countryPillStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid",
    borderColor: active ? "var(--plum)" : "var(--paper-edge)",
    background: active ? "var(--plum)" : "transparent",
    color: active ? "#fff" : "var(--ink-soft)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.12s",
    lineHeight: 1,
  });

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    color: "var(--ink-faint)",
    fontFamily: "var(--font-body)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(28,20,16,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "14vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "1rem 1.125rem",
          width: "100%",
          maxWidth: 540,
          margin: "0 1rem",
          border: "1px solid var(--paper-edge)",
          boxShadow: "var(--shadow-deep)",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={18} strokeWidth={1.5} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            data-testid="overlay-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={PLACEHOLDER[uiLang] ?? PLACEHOLDER.en}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 16, background: "transparent", color: "var(--ink)",
              fontFamily: "var(--font-body)", padding: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 2 }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "var(--paper-edge)", margin: "0 -1.125rem" }} />

        {/* Country filter */}
        <div>
          <div style={sectionLabel}>{FILTER_LABEL[uiLang] ?? FILTER_LABEL.en}</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedRegions([])}
              style={countryPillStyle(selectedRegions.length === 0)}
            >
              {ALL_LABEL[uiLang] ?? ALL_LABEL.en}
            </button>
            {LANG_REGIONS.map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => toggleRegion(code)}
                style={countryPillStyle(selectedRegions.includes(code))}
                title={FLAG[code]}
              >
                {flag} {code === "uk" ? "EN" : code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Concept chips */}
        {conceptTags.length > 0 && (
          <div>
            <div style={sectionLabel}>{CONCEPT_LABEL[uiLang] ?? CONCEPT_LABEL.en}</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {conceptTags.map((tag) => (
                <button
                  key={tag.slug}
                  data-testid="concept-chip"
                  onClick={() => handleConceptClick(tag.slug)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    border: "1.5px solid var(--paper-edge)",
                    background: "transparent",
                    color: "var(--ink-soft)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1,
                    transition: "border-color 0.1s, color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--plum)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--plum)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--paper-edge)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-soft)";
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit button — only for text search */}
        {canSearch && (
          <button
            onClick={handleSearch}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--r-pill)",
              border: "none",
              background: "var(--plum)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              alignSelf: "flex-end",
              transition: "opacity 0.15s",
            }}
          >
            {SEARCH_LABEL[uiLang] ?? SEARCH_LABEL.en}
          </button>
        )}
      </div>
    </div>
  );
}

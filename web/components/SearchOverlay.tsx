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
  fr: "Langue", en: "Language", es: "Idioma", it: "Lingua", tr: "Dil",
};

const CONCEPT_LABEL: Record<string, string> = {
  fr: "Concept", en: "Concept", es: "Concepto", it: "Concetto", tr: "Kavram",
};

const ALL_LABEL: Record<string, string> = {
  fr: "Tous", en: "All", es: "Todos", it: "Tutti", tr: "Tümü",
};

// Representative region codes for each language (used as filter proxies)
const LANG_REGIONS = [
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "uk", flag: "🇬🇧", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "tr", flag: "🇹🇷", label: "TR" },
] as const;

type Props = { uiLang?: string; onClose: () => void };

export default function SearchOverlay({ uiLang = "en", onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedConcept, setSelectedConcept] = useState("");
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
    if (!q && !selectedConcept) return;
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    } else {
      params.set("concept", selectedConcept);
    }
    if (selectedRegions.length) params.set("region", selectedRegions.join(","));
    router.push(`/search?${params}`);
    onClose();
  }, [query, selectedConcept, selectedRegions, router, onClose]);

  const canSearch = query.trim().length >= 2 || selectedConcept.length > 0;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "3px 9px",
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
        {/* Text input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={18} strokeWidth={1.5} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <input
            ref={inputRef}
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

        {/* Region filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
            {FILTER_LABEL[uiLang] ?? FILTER_LABEL.en}
          </span>
          {LANG_REGIONS.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => toggleRegion(code)}
              style={pillStyle(selectedRegions.includes(code))}
              title={FLAG[code]}
            >
              {flag} {code === "uk" ? "EN" : code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Concept filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
            {CONCEPT_LABEL[uiLang] ?? CONCEPT_LABEL.en}
          </span>
          <select
            value={selectedConcept}
            onChange={(e) => setSelectedConcept(e.target.value)}
            style={{
              flex: 1,
              padding: "4px 8px",
              borderRadius: "var(--r-md)",
              border: `1.5px solid ${selectedConcept ? "var(--plum)" : "var(--paper-edge)"}`,
              background: "var(--paper)",
              color: selectedConcept ? "var(--ink)" : "var(--ink-faint)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">{ALL_LABEL[uiLang] ?? ALL_LABEL.en}</option>
            {conceptTags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>{tag.name}</option>
            ))}
          </select>
          {selectedConcept && (
            <button
              onClick={() => setSelectedConcept("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 2, flexShrink: 0 }}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Submit button */}
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

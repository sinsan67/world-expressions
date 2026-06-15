"use client";

import { useState, useEffect, useRef } from "react";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { TYPE_LABELS } from "@/lib/typeLabels";
import type { Facets } from "@/lib/api";
import type { UILang } from "@/lib/useUILang";

const T = {
  fr: { filterAll: "Tous les pays", sortLabel: "Trier :", sortRelevance: "Pertinence", sortCountry: "Par pays", allTypes: "Tous" },
  en: { filterAll: "All countries", sortLabel: "Sort:", sortRelevance: "Relevance", sortCountry: "By country", allTypes: "All" },
  es: { filterAll: "Todos los países", sortLabel: "Ordenar:", sortRelevance: "Relevancia", sortCountry: "Por país", allTypes: "Todos" },
  it: { filterAll: "Tutti i paesi", sortLabel: "Ordina:", sortRelevance: "Rilevanza", sortCountry: "Per paese", allTypes: "Tutti" },
  tr: { filterAll: "Tüm ülkeler", sortLabel: "Sırala:", sortRelevance: "Alaka", sortCountry: "Ülkeye göre", allTypes: "Tümü" },
  de: { filterAll: "Alle Länder", sortLabel: "Sortieren:", sortRelevance: "Relevanz", sortCountry: "Nach Land", allTypes: "Alle" },
  ja: { filterAll: "すべての国", sortLabel: "並び替え：", sortRelevance: "関連度", sortCountry: "国別", allTypes: "すべて" },
};

interface Props {
  countries: { code: string; label: string }[];
  filterCountries: string[];
  onFilterChange: (countries: string[]) => void;
  sortMode: "relevance" | "country";
  onSortChange: (mode: "relevance" | "country") => void;
  uiLang: UILang;
  typeFilter?: string | null;
  onTypeChange?: (type: string | null) => void;
  showSort?: boolean;
  showTypes?: boolean;
  facets?: Facets;
}

export default function ResultsFilterBar({
  countries, filterCountries, onFilterChange,
  sortMode, onSortChange,
  uiLang,
  typeFilter, onTypeChange,
  showSort = true,
  showTypes = true,
  facets,
}: Props) {
  const t = T[uiLang];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (code: string) => {
    const next = filterCountries.includes(code)
      ? filterCountries.filter((c) => c !== code)
      : [...filterCountries, code];
    onFilterChange(next);
  };

  const activeLabel = filterCountries.length === 0
    ? t.filterAll
    : filterCountries.map((c) => FLAG[c] ?? c.toUpperCase()).join(" ");

  const pillBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid var(--paper-edge)",
    background: "var(--paper)",
    color: "var(--ink-soft)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
  };

  const pillSortActive: React.CSSProperties = {
    ...pillBase,
    background: "var(--plum)",
    color: "#fff",
    border: "1.5px solid var(--plum)",
  };

  const sep = (
    <div style={{ width: 1, height: 18, background: "var(--paper-edge)", flexShrink: 0, margin: "0 0.15rem" }} />
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>

      {/* Country dropdown */}
      <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            ...pillBase,
            ...(filterCountries.length > 0 ? {
              background: "rgba(107,77,143,0.08)",
              borderColor: "var(--plum)",
              color: "var(--plum)",
            } : {}),
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}
        >
          <span>{activeLabel}</span>
          <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
            background: "var(--paper)", border: "1px solid var(--paper-edge)",
            borderRadius: 10, padding: "0.4rem 0", minWidth: 190,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={filterCountries.length === 0}
                onChange={() => { onFilterChange([]); setOpen(false); }}
                style={{ accentColor: "var(--plum)", width: 15, height: 15 }}
              />
              {t.filterAll}
            </label>
            <div style={{ height: 1, background: "var(--paper-edge)", margin: "0.25rem 0" }} />
            {countries.map((r) => {
              // NB: backend renvoie les comptages par pays sous la clé wire `facets.region`
              // (nommage historique trompeur — renommage à faire en deploy backend+front coordonné).
              const cnt = facets?.region[r.code];
              return (
                <label key={r.code} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                  <input
                    type="checkbox"
                    checked={filterCountries.includes(r.code)}
                    onChange={() => toggle(r.code)}
                    style={{ accentColor: "var(--plum)", width: 15, height: 15 }}
                  />
                  <span style={{ flex: 1 }}>{FLAG[r.code] ?? ""} {COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}</span>
                  {cnt != null && <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>({cnt})</span>}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {showTypes && (<>
      {sep}

      {/* Type pills */}
      {([null, "idiom", "proverb", "locution"] as const).map((type) => {
        const isActive = (typeFilter ?? null) === type;
        const label = type === null
          ? t.allTypes
          : (TYPE_LABELS[type]?.[uiLang] ?? TYPE_LABELS[type]?.["en"] ?? type);
        const cnt = type !== null ? facets?.kind[type] : undefined;
        return (
          <button
            key={type ?? "all"}
            onClick={() => onTypeChange?.(type)}
            style={{
              ...pillBase,
              background: isActive ? "var(--terra)" : "var(--paper)",
              border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
              color: isActive ? "#fff" : "var(--terra)",
              boxShadow: isActive ? "var(--shadow-stamp)" : "none",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            <span>{label}</span>
            {cnt != null && (
              <span style={{ fontSize: 11, opacity: isActive ? 0.85 : 0.55 }}>({cnt})</span>
            )}
          </button>
        );
      })}
      </>)}

      {showSort && (<>
        {sep}
        <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
          {t.sortLabel}
        </span>
        <button onClick={() => onSortChange("relevance")} style={sortMode === "relevance" ? pillSortActive : pillBase}>
          {t.sortRelevance}
        </button>
        <button onClick={() => onSortChange("country")} style={sortMode === "country" ? pillSortActive : pillBase}>
          {t.sortCountry}
        </button>
      </>)}
    </div>
  );
}

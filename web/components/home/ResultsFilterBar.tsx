"use client";

import { useState, useEffect, useRef } from "react";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const T = {
  fr: { filterAll: "Tous les pays", sortLabel: "Trier :", sortRelevance: "Pertinence", sortCountry: "Par pays" },
  en: { filterAll: "All countries", sortLabel: "Sort:", sortRelevance: "Relevance", sortCountry: "By country" },
  es: { filterAll: "Todos los países", sortLabel: "Ordenar:", sortRelevance: "Relevancia", sortCountry: "Por país" },
  it: { filterAll: "Tutti i paesi", sortLabel: "Ordina:", sortRelevance: "Rilevanza", sortCountry: "Per paese" },
  tr: { filterAll: "Tüm ülkeler", sortLabel: "Sırala:", sortRelevance: "Alaka", sortCountry: "Ülkeye göre" },
};

interface Props {
  regions: { code: string; label: string }[];
  filterRegions: string[];
  onFilterChange: (regions: string[]) => void;
  sortMode: "relevance" | "country";
  onSortChange: (mode: "relevance" | "country") => void;
  uiLang: UILang;
  typeSlot?: React.ReactNode;
}

export default function ResultsFilterBar({ regions, filterRegions, onFilterChange, sortMode, onSortChange, uiLang, typeSlot }: Props) {
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
    const next = filterRegions.includes(code)
      ? filterRegions.filter((c) => c !== code)
      : [...filterRegions, code];
    onFilterChange(next);
  };

  const activeLabel = filterRegions.length === 0
    ? t.filterAll
    : filterRegions.map((c) => FLAG[c] ?? c.toUpperCase()).join(" ");

  const btnBase: React.CSSProperties = {
    padding: "0.3rem 0.75rem",
    borderRadius: 20,
    border: "1px solid var(--paper-edge)",
    background: "var(--paper)",
    color: "var(--ink-soft)",
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    fontFamily: "var(--font-body)",
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "var(--plum)",
    color: "#fff",
    border: "1px solid var(--plum)",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>

      {/* Country dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ ...btnBase, ...(filterRegions.length > 0 ? { background: "var(--paper-deep)", color: "var(--ink)" } : {}), display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <span>{activeLabel}</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
            background: "var(--paper)", border: "1px solid var(--paper-edge)",
            borderRadius: 10, padding: "0.4rem 0", minWidth: 190,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}>
            {/* All */}
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={filterRegions.length === 0}
                onChange={() => { onFilterChange([]); setOpen(false); }}
                style={{ accentColor: "var(--plum)", width: 15, height: 15 }}
              />
              {t.filterAll}
            </label>
            <div style={{ height: 1, background: "var(--paper-edge)", margin: "0.25rem 0" }} />
            {regions.map((r) => (
              <label key={r.code} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={filterRegions.includes(r.code)}
                  onChange={() => toggle(r.code)}
                  style={{ accentColor: "var(--plum)", width: 15, height: 15 }}
                />
                {FLAG[r.code] ?? ""} {COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>{t.sortLabel}</span>
        <button onClick={() => onSortChange("relevance")} style={sortMode === "relevance" ? btnActive : btnBase}>
          {t.sortRelevance}
        </button>
        <button onClick={() => onSortChange("country")} style={sortMode === "country" ? btnActive : btnBase}>
          {t.sortCountry}
        </button>
      </div>

      {/* Type pills slot (optional — same row) */}
      {typeSlot && (
        <>
          <div style={{ width: 1, height: 18, background: "var(--paper-edge)", flexShrink: 0 }} />
          {typeSlot}
        </>
      )}
    </div>
  );
}

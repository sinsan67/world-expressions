"use client";

/**
 * Voyage — setup screen (filters).
 * Country chips + kind tiles + domain pills, with a debounced live pool
 * counter on the CTA — same interaction pattern as Random mode's entry
 * phase (web/app/random-mode/page.tsx), extracted into its own component
 * so `/voyage` can skip straight past it in quick mode.
 */

import { useEffect, useState } from "react";
import { getCountries, getRandomCount } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { EDITORIAL_DOMAINS } from "@/lib/editorialDomains";
import { VOYAGE_SETUP } from "@/lib/voyageLabels";

const KINDS = ["idiom", "proverb", "locution"] as const;
const KIND_EMOJI: Record<string, string> = { idiom: "💬", proverb: "📜", locution: "🧩" };

export type VoyageFilters = { country: string; kind: string; domain: string };

type Props = {
  uiLang: string;
  initial?: VoyageFilters;
  onStart: (filters: VoyageFilters) => void;
  starting?: boolean;
  error?: "" | "empty" | "server";
};

export default function VoyageSetup({ uiLang, initial, onStart, starting, error }: Props) {
  const t = VOYAGE_SETUP[uiLang] ?? VOYAGE_SETUP.en;
  const [country, setCountry] = useState(initial?.country ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [countries, setCountries] = useState<{ code: string; count: number }[]>([]);
  const [poolCount, setPoolCount] = useState<number | null>(null);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  // Live pool counter: how many cards match the current filters (debounced)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      getRandomCount(country, kind, domain)
        .then((n) => { if (!cancelled) setPoolCount(n); })
        .catch(() => {});
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [country, kind, domain]);

  const domainRows = [EDITORIAL_DOMAINS.slice(0, 8), EDITORIAL_DOMAINS.slice(8)];

  return (
    <section style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "2.5rem 1.5rem 1.25rem",
      maxWidth: 440,
      margin: "0 auto",
      width: "100%",
    }}>
      <span style={{ fontSize: 52, lineHeight: 1, alignSelf: "center" }} aria-hidden="true">🧳</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 29, fontWeight: 700, margin: "12px 0 5px", color: "var(--ink)", textAlign: "center" }}>
        {t.title}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, marginBottom: 22, textAlign: "center" }}>
        {t.subtitle}
      </p>

      {/* Country chips */}
      <div style={filterLabelStyle}>🌍 {t.countryLabel}</div>
      <div className="wex-chip-scroll">
        <button
          onClick={() => setCountry("")}
          className={country === "" ? "chip-on" : undefined}
          style={{ ...countryChipStyle, ...(country === "" ? chipSelected : {}) }}
        >
          <span style={{ fontSize: 22, lineHeight: 1.2 }}>🌍</span>
          <span style={countryChipName}>{t.allCountries}</span>
        </button>
        {countries.map((c) => (
          <button
            key={c.code}
            onClick={() => setCountry(country === c.code ? "" : c.code)}
            className={country === c.code ? "chip-on" : undefined}
            style={{ ...countryChipStyle, ...(country === c.code ? chipSelected : {}) }}
          >
            <span style={{ fontSize: 22, lineHeight: 1.2 }}>{FLAG[c.code] ?? "🌍"}</span>
            <span style={countryChipName}>{COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Kind tiles */}
      <div style={filterLabelStyle}>✨ {t.kindLabel}</div>
      <div style={{ display: "flex", gap: 7 }}>
        <button
          onClick={() => setKind("")}
          style={{ ...kindTileStyle, ...(kind === "" ? chipSelected : {}) }}
        >
          <span style={{ fontSize: 18, display: "block" }}>✨</span>
          <span style={kindTileText}>{t.allKinds}</span>
        </button>
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(kind === k ? "" : k)}
            style={{ ...kindTileStyle, ...(kind === k ? chipSelected : {}) }}
          >
            <span style={{ fontSize: 18, display: "block" }}>{KIND_EMOJI[k]}</span>
            <span style={kindTileText}>{getTypeLabel(k, uiLang)}</span>
          </button>
        ))}
      </div>

      {/* Domain pills — two scrollable rows over the editorial gradients */}
      <div style={filterLabelStyle}>🎨 {t.domainLabel}</div>
      {domainRows.map((row, i) => (
        <div key={i} className="wex-chip-scroll" style={i === 1 ? { marginTop: 7 } : undefined}>
          {row.map((d) => (
            <button
              key={d.slug}
              onClick={() => setDomain(domain === d.slug ? "" : d.slug)}
              className={domain === d.slug ? "chip-on" : undefined}
              style={{
                ...domainPillStyle,
                background: d.bg,
                ...(domain === d.slug ? chipSelected : {}),
              }}
            >
              <span style={{ fontSize: 15 }}>{d.emoji}</span>
              {d.labels[uiLang as keyof typeof d.labels] ?? d.labels.en}
            </button>
          ))}
        </div>
      ))}

      <button
        onClick={() => onStart({ country, kind, domain })}
        disabled={starting || poolCount === 0}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 700,
          color: "white",
          background: "var(--plum)",
          border: "none",
          borderRadius: 999,
          padding: "14px 28px",
          cursor: poolCount === 0 ? "default" : "pointer",
          opacity: poolCount === 0 ? 0.55 : 1,
          boxShadow: "0 4px 0 var(--plum-deep), var(--shadow-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          marginTop: 24,
        }}
      >
        🧳 {t.cta}
        {poolCount !== null && (
          <span style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 11.5,
            background: "rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "3px 9px",
          }}>
            {poolCount.toLocaleString(uiLang)} {t.cards}
          </span>
        )}
      </button>

      {error && (
        <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--terra, #b4552d)", textAlign: "center" }}>
          {error === "server" ? t.serverError : t.empty}
        </p>
      )}
    </section>
  );
}

const filterLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-softer)",
  margin: "14px 0 7px",
};

const countryChipStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  padding: "8px 10px 6px",
  cursor: "pointer",
  minWidth: 60,
  fontFamily: "var(--font-body)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const countryChipName: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  whiteSpace: "nowrap",
};

const kindTileStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  padding: "8px 4px 6px",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const kindTileText: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
};

const domainPillStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1.5px solid transparent",
  borderRadius: 999,
  padding: "7px 13px 7px 9px",
  cursor: "pointer",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#3f3428",
  fontFamily: "var(--font-body)",
  whiteSpace: "nowrap",
  transition: "transform 0.12s, box-shadow 0.12s",
};

// Selected state shared by all filter chips: plum ring + slight pop
const chipSelected: React.CSSProperties = {
  boxShadow: "0 0 0 2px var(--plum)",
  transform: "scale(1.04)",
};

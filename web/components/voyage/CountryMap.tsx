"use client";

/**
 * Compact country picker — replaces the wrapping flag-chip row with a
 * stylized (non-geographic) world map: decorative continent shapes behind,
 * real <button> pins on top for accessible tap targets. Direction B from
 * the 3 wireframes (scratchpad/wireframe-voyage-filters-A/B/C.html, S221) —
 * closest evolution of the existing single-page composer, no new page/panel
 * paradigm. Mono-selection semantics are unchanged: tap a pin to select,
 * tap it again (or the "all countries" chip) to clear.
 */

import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import type { CountryInfo } from "@/lib/api";
import type { VoyageSetupLabels } from "@/lib/voyageLabels";

// Percent-of-viewbox positions, tuned by hand for tap-target spacing rather
// than cartographic accuracy — same acknowledged tradeoff as the wireframe
// ("small/clustered countries need a wider tap zone than their visual dot").
const COUNTRY_POS: Record<string, { x: number; y: number }> = {
  us: { x: 16, y: 22 },
  mx: { x: 14, y: 40 },
  cu: { x: 27, y: 34 },
  co: { x: 21, y: 53 },
  ve: { x: 29, y: 46 },
  pe: { x: 14, y: 67 },
  cl: { x: 13, y: 89 },
  ar: { x: 25, y: 87 },
  uk: { x: 47, y: 13 },
  fr: { x: 50, y: 24 },
  es: { x: 44, y: 35 },
  de: { x: 55, y: 15 },
  it: { x: 57, y: 33 },
  tr: { x: 62, y: 30 },
  jp: { x: 92, y: 33 },
  au: { x: 86, y: 80 },
};

// Decorative landmasses only (aria-hidden) — abstract blobs, not real
// borders, matching the wireframe's art direction.
function MapBackground() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect x="6" y="12" width="26" height="35" rx="12" fill="var(--paper-deep)" />
      <rect x="10" y="45" width="22" height="48" rx="11" fill="var(--paper-deep)" />
      <rect x="40" y="8" width="22" height="30" rx="9" fill="var(--paper-deep)" />
      <rect x="42" y="38" width="20" height="38" rx="10" fill="var(--paper-fold)" opacity="0.55" />
      <rect x="58" y="5" width="38" height="55" rx="14" fill="var(--paper-deep)" />
      <rect x="76" y="65" width="20" height="24" rx="9" fill="var(--paper-deep)" />
    </svg>
  );
}

const pinButtonStyle: React.CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
  boxShadow: "var(--shadow-stamp)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const pinSelectedStyle: React.CSSProperties = {
  boxShadow: "0 0 0 2px var(--plum)",
  transform: "translate(-50%, -50%) scale(1.18)",
  zIndex: 1,
};

type Props = {
  countries: CountryInfo[];
  selected: string;
  onSelect: (code: string) => void;
  t: VoyageSetupLabels;
};

export default function CountryMap({ countries, selected, onSelect, t }: Props) {
  // Countries the API returns without a hand-placed coordinate (shouldn't
  // happen with the current 16 — belt-and-suspenders if a new one ships
  // before this map is updated) fall back to a small chip row underneath,
  // same visual language as the old chips, so nothing is ever unreachable.
  const onMap = countries.filter((c) => COUNTRY_POS[c.code]);
  const offMap = countries.filter((c) => !COUNTRY_POS[c.code]);

  return (
    <div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 16, background: "var(--paper)", border: "1.5px solid var(--paper-edge)", overflow: "hidden" }}>
        <MapBackground />
        {onMap.map((c) => {
          const pos = COUNTRY_POS[c.code];
          const isSelected = selected === c.code;
          return (
            <button
              key={c.code}
              onClick={() => onSelect(isSelected ? "" : c.code)}
              aria-label={COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}
              aria-pressed={isSelected}
              title={COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}
              style={{
                ...pinButtonStyle,
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                ...(isSelected ? pinSelectedStyle : {}),
              }}
            >
              {FLAG[c.code] ?? "🌍"}
            </button>
          );
        })}
      </div>

      {offMap.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {offMap.map((c) => (
            <button
              key={c.code}
              onClick={() => onSelect(selected === c.code ? "" : c.code)}
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "white",
                border: "1.5px solid var(--paper-edge)", borderRadius: 999, padding: "5px 10px",
                fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)",
                ...(selected === c.code ? { boxShadow: "0 0 0 2px var(--plum)" } : {}),
              }}
            >
              <span>{FLAG[c.code] ?? "🌍"}</span> {COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, fontSize: 12.5 }}>
        <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>
          {selected ? `${FLAG[selected] ?? "🌍"} ${COUNTRY_NAME[selected] ?? selected.toUpperCase()}` : `🌍 ${t.allCountries}`}
        </span>
        {selected && (
          <button
            onClick={() => onSelect("")}
            style={{
              fontSize: 11.5, color: "var(--ink-faint)", background: "none",
              border: "1px dashed var(--paper-edge)", borderRadius: 999, padding: "3px 9px",
              cursor: "pointer", fontFamily: "var(--font-body)",
            }}
          >
            🌍 {t.allCountries}
          </button>
        )}
      </div>
    </div>
  );
}

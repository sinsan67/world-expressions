"use client";

/**
 * Voyage — setup screen. 4 one-tap presets (decisions-produit.md, atelier
 * S208 Décision 1) above a collapsible "Composer mon voyage" section holding
 * the full country/kind/domain filters + a debounced live pool counter on
 * the CTA. Country picker is a compact map (CountryMap.tsx, direction B of
 * the 3 wireframes, S221/S222) instead of a flag-chip row. Domain pills
 * wrap (no hidden horizontal scroll) and each filter section has a
 * "🎲 au hasard" dice — both borrowed from mockup-voyage-setup-C.html per
 * the same decision.
 */

import { useEffect, useState } from "react";
import { getCountries, getRandomCount, CountryInfo } from "@/lib/api";
import { getLastFilters } from "@/lib/voyagePersistence";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { EDITORIAL_DOMAINS, DOMAIN_GROUPS, EDITORIAL_DOMAIN_MAP } from "@/lib/editorialDomains";
import { DOMAIN_DEFS, DOMAIN_COLORS } from "@/lib/domainDefs";
import { VOYAGE_SETUP, VoyageSetupLabels } from "@/lib/voyageLabels";
import CountryMap from "./CountryMap";

const KINDS = ["idiom", "proverb", "locution"] as const;
const KIND_EMOJI: Record<string, string> = { idiom: "💬", proverb: "📜", locution: "🧩" };
const EMPTY: VoyageFilters = { country: "", kind: "", domain: "" };

export type VoyageFilters = { country: string; kind: string; domain: string };

// Shared with Voyage.tsx (in-game filters chip) so the same country/kind/
// domain → text recipe isn't duplicated in two places.
export function formatFiltersSummary(filters: VoyageFilters, uiLang: string, t: VoyageSetupLabels): string {
  const domainLabel = (slug: string) => {
    const d = EDITORIAL_DOMAINS.find((dm) => dm.slug === slug);
    if (d) return `${d.emoji} ${d.labels[uiLang as keyof typeof d.labels] ?? d.labels.en}`;
    // The Concepts page knows 4 domains beyond the 16 editorial ones
    // (knowledge/justice/change/food) — its "Play with these cards" CTA can
    // legitimately pre-fill them, so fall back to DOMAIN_DEFS for the label.
    const def = DOMAIN_DEFS[slug];
    return def ? `${def.emoji} ${def.labels[uiLang] ?? def.labels.en ?? slug}` : "";
  };
  return [
    filters.country ? `${FLAG[filters.country] ?? "🌍"} ${COUNTRY_NAME[filters.country] ?? filters.country}` : `🌍 ${t.allCountries}`,
    filters.kind ? getTypeLabel(filters.kind, uiLang) : `✨ ${t.allKinds}`,
    ...(filters.domain ? [domainLabel(filters.domain)] : []),
  ].join(" · ");
}

type Props = {
  uiLang: string;
  initial?: VoyageFilters;
  onStart: (filters: VoyageFilters, isQuick?: boolean) => void;
  starting?: boolean;
  error?: "" | "empty" | "server";
};

export default function VoyageSetup({ uiLang, initial, onStart, starting, error }: Props) {
  const t = VOYAGE_SETUP[uiLang] ?? VOYAGE_SETUP.en;
  const [country, setCountry] = useState(initial?.country ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [countriesFailed, setCountriesFailed] = useState(false);
  const [poolCount, setPoolCount] = useState<number | null>(null);
  // Pre-filled filters (exploration CTA, or "change filters" after a
  // composed game) open the composer right away — the whole point of
  // arriving pre-filled is seeing what's selected.
  const [composerOpen, setComposerOpen] = useState(
    !!(initial?.country || initial?.kind || initial?.domain)
  );
  const [rollingSection, setRollingSection] = useState<"country" | "kind" | "domain" | null>(null);
  // Domain accordion (8 curated groups) — auto-open the group holding the
  // incoming selection, else all collapsed.
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => DOMAIN_GROUPS.find((g) => g.children.includes(initial?.domain ?? ""))?.slug ?? null
  );

  // Presets: pool badges. Surprends-moi derives from the countries list
  // already being fetched below (no extra request) — proverbs/last-time
  // need their own getRandomCount() call, same function the composer's live
  // counter already uses.
  const [proverbsPool, setProverbsPool] = useState<number | null>(null);
  const [lastFilters, setLastFilters] = useState<VoyageFilters | null>(null);
  const [lastPool, setLastPool] = useState<number | null>(null);

  // getCountries() never rejects (retries internally, resolves [] on total
  // failure — see api.ts) — an empty result after the retries is the only
  // signal we get, and in practice /countries is never legitimately empty
  // in prod, so treat it as a failed load and offer a manual retry.
  function loadCountries() {
    getCountries()
      .then((data) => {
        setCountries(data);
        setCountriesFailed(data.length === 0);
      })
      .catch(() => setCountriesFailed(true));
  }

  useEffect(() => {
    loadCountries();
    getRandomCount("", "proverb", "").then(setProverbsPool).catch(() => {});
    const last = getLastFilters();
    if (last) {
      setLastFilters(last);
      getRandomCount(last.country, last.kind, last.domain).then(setLastPool).catch(() => {});
    }
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

  // Same country for everyone on the same UTC day — /countries is sorted by
  // count DESC server-side (database.py get_countries), so the array order
  // is stable; no dedicated endpoint needed for this rotation.
  const epochDay = Math.floor(Date.now() / 86_400_000);
  const dailyCountry = countries.length ? countries[epochDay % countries.length] : null;
  const surprisePool = countries.length ? countries.reduce((s, c) => s + c.count, 0) : null;

  const roll = (section: "country" | "kind" | "domain") => {
    setRollingSection(section);
    setTimeout(() => setRollingSection((s) => (s === section ? null : s)), 500);
    if (section === "country" && countries.length) {
      setCountry(countries[Math.floor(Math.random() * countries.length)].code);
    } else if (section === "kind") {
      setKind(KINDS[Math.floor(Math.random() * KINDS.length)]);
    } else if (section === "domain") {
      const picked = EDITORIAL_DOMAINS[Math.floor(Math.random() * EDITORIAL_DOMAINS.length)].slug;
      setDomain(picked);
      setOpenGroup(DOMAIN_GROUPS.find((g) => g.children.includes(picked))?.slug ?? null);
    }
  };

  const poolBadge = (n: number | null) => n !== null && (
    <span style={presetPoolStyle}>{n.toLocaleString(uiLang)} {t.cards}</span>
  );

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

      {/* Presets — one tap = straight into a game */}
      <button
        onClick={() => onStart(EMPTY, true)}
        disabled={starting}
        style={{ ...presetStyle, background: "linear-gradient(135deg,var(--plum-bg) 0%,#f7e3d8 100%)", borderColor: "var(--plum-soft)" }}
      >
        <span style={presetPictoStyle}>🎲</span>
        <span style={presetTextStyle}>
          <b style={presetTitleStyle}>{t.presetSurprise}</b>
          <small style={presetDescStyle}>{t.presetSurpriseDesc}</small>
        </span>
        {poolBadge(surprisePool)}
      </button>

      {dailyCountry && (
        <button
          onClick={() => onStart({ country: dailyCountry.code, kind: "", domain: "" }, false)}
          disabled={starting}
          style={presetStyle}
        >
          <span style={presetPictoStyle}>{FLAG[dailyCountry.code] ?? "🌍"}</span>
          <span style={presetTextStyle}>
            <b style={presetTitleStyle}>{t.presetDaily}</b>
            <small style={presetDescStyle}>{t.presetDailyDesc(COUNTRY_NAME[dailyCountry.code] ?? dailyCountry.code.toUpperCase())}</small>
          </span>
          {poolBadge(dailyCountry.count)}
        </button>
      )}

      <button
        onClick={() => onStart({ country: "", kind: "proverb", domain: "" }, false)}
        disabled={starting}
        style={presetStyle}
      >
        <span style={presetPictoStyle}>📜</span>
        <span style={presetTextStyle}>
          <b style={presetTitleStyle}>{t.presetProverbs}</b>
          <small style={presetDescStyle}>{t.presetProverbsDesc}</small>
        </span>
        {poolBadge(proverbsPool)}
      </button>

      {lastFilters && (
        <button
          onClick={() => onStart(lastFilters, false)}
          disabled={starting}
          style={{ ...presetStyle, borderStyle: "dashed", background: "var(--paper)" }}
        >
          <span style={{ ...presetPictoStyle, opacity: 0.85 }}>🔁</span>
          <span style={presetTextStyle}>
            <b style={presetTitleStyle}>{t.presetLastTime}</b>
            <small style={presetDescStyle}>{formatFiltersSummary(lastFilters, uiLang, t)}</small>
          </span>
          {poolBadge(lastPool)}
        </button>
      )}

      <div style={dividerStyle}>
        <span style={dividerLineStyle} />
        {t.orDivider}
        <span style={dividerLineStyle} />
      </div>

      <button
        onClick={() => setComposerOpen((o) => !o)}
        aria-expanded={composerOpen}
        style={composeToggleStyle}
      >
        🎛️ {t.composeToggle}
        <span aria-hidden="true" style={{ display: "inline-block", transition: "transform 0.25s", transform: composerOpen ? "rotate(180deg)" : undefined }}>▾</span>
      </button>

      <div style={composerOpen ? { ...collapseStyle, ...collapseOpenStyle } : collapseStyle}>
        {/* Country picker — compact map (direction B, S221/S222 wireframes) */}
        <div style={sectionHeadStyle}>
          <span style={sectionLabelStyle}>🌍 {t.countryLabel}</span>
          <button
            onClick={() => roll("country")}
            aria-label={t.randomCountryAria}
            title={t.randomCountryAria}
            className={rollingSection === "country" ? "wex-dice-rolling" : undefined}
            style={diceButtonStyle}
          >
            🎲
          </button>
        </div>
        <CountryMap countries={countries} selected={country} onSelect={setCountry} t={t} />
        {countries.length === 0 && countriesFailed && (
          <p style={{ fontSize: 12.5, color: "var(--terra, #b4552d)", marginTop: 6 }}>
            {t.countriesError}{" "}
            <button
              onClick={loadCountries}
              style={{ textDecoration: "underline", background: "none", border: "none", color: "inherit", cursor: "pointer", font: "inherit", padding: 0 }}
            >
              {t.retry}
            </button>
          </p>
        )}

        {/* Kind tiles */}
        <div style={sectionHeadStyle}>
          <span style={sectionLabelStyle}>✨ {t.kindLabel}</span>
          <button
            onClick={() => roll("kind")}
            aria-label={t.randomKindAria}
            title={t.randomKindAria}
            className={rollingSection === "kind" ? "wex-dice-rolling" : undefined}
            style={diceButtonStyle}
          >
            🎲
          </button>
        </div>
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

        {/* Domain pills — grid, wraps instead of a hidden horizontal scroll */}
        <div style={sectionHeadStyle}>
          <span style={sectionLabelStyle}>🎨 {t.domainLabel}</span>
          <button
            onClick={() => roll("domain")}
            aria-label={t.randomDomainAria}
            title={t.randomDomainAria}
            className={rollingSection === "domain" ? "wex-dice-rolling" : undefined}
            style={diceButtonStyle}
          >
            🎲
          </button>
        </div>
        {/* Accordion: 8 curated groups (atelier thèmes 21/07), tap a header
            to reveal its leaf pills. onStart() always receives a leaf
            EditorialDomain slug — grouping is purely visual, the /random
            /search API contract is unchanged. EDITORIAL_DOMAINS now covers
            all 20 real domain_slugs (the 4 the Concepts page also knows —
            knowledge/justice/change/food — got folded in), so every
            pre-filled domain resolves through EDITORIAL_DOMAIN_MAP here;
            no DOMAIN_DEFS fallback needed in this component anymore. */}
        {DOMAIN_GROUPS.map((g) => {
          const isOpen = openGroup === g.slug;
          const hasSelection = g.children.includes(domain);
          return (
            <div key={g.slug} style={{ marginBottom: 7 }}>
              <button
                onClick={() => setOpenGroup(isOpen ? null : g.slug)}
                aria-expanded={isOpen}
                style={{ ...domainGroupHeaderStyle, ...(hasSelection ? chipSelected : {}) }}
              >
                <span style={{ fontSize: 15 }}>{g.emoji}</span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  {g.labels[uiLang as keyof typeof g.labels] ?? g.labels.en}
                </span>
                <span aria-hidden="true" style={{ fontSize: 11, color: "var(--ink-faint)" }}>{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="wex-domain-grid" style={{ marginTop: 7 }}>
                  {g.children.map((slug) => {
                    const d = EDITORIAL_DOMAIN_MAP[slug];
                    if (!d) return null;
                    return (
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
            width: "100%",
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
      </div>

      {error && (
        <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--terra, #b4552d)", textAlign: "center" }}>
          {error === "server" ? t.serverError : t.empty}
        </p>
      )}
    </section>
  );
}

const presetStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: "100%",
  textAlign: "left",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 18,
  padding: "14px 16px",
  marginBottom: 10,
  cursor: "pointer",
  boxShadow: "var(--shadow-card)",
  fontFamily: "var(--font-body)",
};

const presetPictoStyle: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1,
  flexShrink: 0,
  width: 40,
  textAlign: "center",
};

const presetTextStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

const presetTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 16.5,
  fontWeight: 700,
  display: "block",
  color: "var(--ink)",
};

const presetDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-softer)",
  display: "block",
  lineHeight: 1.35,
};

const presetPoolStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--plum)",
  background: "var(--plum-bg)",
  borderRadius: 999,
  padding: "4px 9px",
  whiteSpace: "nowrap",
};

const dividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  margin: "20px 0 12px",
  color: "var(--ink-faint)",
  fontSize: 12,
};

const dividerLineStyle: React.CSSProperties = {
  flex: 1,
  borderTop: "1.5px dashed var(--paper-edge)",
};

const composeToggleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 10,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--plum)",
  fontFamily: "var(--font-body)",
};

const collapseStyle: React.CSSProperties = {
  overflow: "hidden",
  maxHeight: 0,
  opacity: 0,
  // visibility delayed until the collapse finishes, so it animates shut
  // instead of vanishing instantly — but still ends up properly excluded
  // from focus/assistive tech while closed (unlike max-height/opacity alone,
  // which leave descendants focusable despite being clipped from view).
  visibility: "hidden",
  transition: "max-height 0.4s ease, opacity 0.3s ease, visibility 0s linear 0.4s",
};

const collapseOpenStyle: React.CSSProperties = {
  maxHeight: 1400,
  opacity: 1,
  visibility: "visible",
  transition: "max-height 0.4s ease, opacity 0.3s ease",
};

const sectionHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  margin: "14px 0 7px",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-softer)",
};

const diceButtonStyle: React.CSSProperties = {
  marginLeft: "auto",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 999,
  fontSize: 12,
  padding: "3px 10px",
  minWidth: 44,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--ink-soft)",
  fontFamily: "var(--font-body)",
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
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1.5px solid transparent",
  borderRadius: 12,
  padding: "8px 9px",
  cursor: "pointer",
  fontSize: 10.5,
  fontWeight: 600,
  color: "#3f3428",
  fontFamily: "var(--font-body)",
  lineHeight: 1.25,
  textAlign: "left",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const domainGroupHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  padding: "9px 12px",
  cursor: "pointer",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  fontFamily: "var(--font-body)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

// Selected state shared by all filter chips: plum ring + slight pop
const chipSelected: React.CSSProperties = {
  boxShadow: "0 0 0 2px var(--plum)",
  transform: "scale(1.04)",
};

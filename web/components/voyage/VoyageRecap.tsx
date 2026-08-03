"use client";

/**
 * Voyage — end-of-game recap (mockup docs/mockups/pivot-jeu-decouverte.html,
 * state 3). Hero background = the most-seen country's photo across the 10
 * drawn cards (client-side computation, random tie-break — decision #8),
 * kept-expressions list, a "collection updated" chip, and the three actions
 * from decision #10 (Rejouer reuses the same filters · Changer les filtres →
 * setup, pre-filled · Voir ma collection → /collection, lot C).
 */

import { useState } from "react";
import Link from "next/link";
import type { GameCard as GameCardType } from "@/lib/api";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT, HERO_IMAGE_COUNTRIES } from "@/lib/constants";
import { VOYAGE_RECAP, VOYAGE_SETUP } from "@/lib/voyageLabels";

type Props = {
  uiLang: string;
  cards: GameCardType[];
  keptCards: GameCardType[];
  // Recap → exploration bridge (lot N2): where "Explore these expressions"
  // lands, computed by the parent from the game's filters (lib/exploreLink).
  exploreHref: string;
  onReplay: () => void;
  onChangeFilters: () => void;
};

function pickMostSeenCountry(cards: GameCardType[]): string {
  const counts: Record<string, number> = {};
  for (const c of cards) {
    const code = c.country || c.language;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return "";
  const max = Math.max(...entries.map(([, n]) => n));
  const top = entries.filter(([, n]) => n === max).map(([code]) => code);
  return top[Math.floor(Math.random() * top.length)];
}

export default function VoyageRecap({ uiLang, cards, keptCards, exploreHref, onReplay, onChangeFilters }: Props) {
  const t = VOYAGE_RECAP[uiLang] ?? VOYAGE_RECAP.en;
  const orLabel = (VOYAGE_SETUP[uiLang] ?? VOYAGE_SETUP.en).orDivider;
  // Frozen at mount so the tie-break doesn't reshuffle on re-render.
  const [heroCountry] = useState(() => pickMostSeenCountry(cards));

  const bgStyle: React.CSSProperties = HERO_IMAGE_COUNTRIES.has(heroCountry)
    ? {
        backgroundImage: `linear-gradient(rgba(20,12,28,0.48), rgba(24,16,10,0.6)), url('/images/${heroCountry}.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(rgba(20,12,28,0.42), rgba(24,16,10,0.5)), ${COUNTRY_GRADIENT[heroCountry] ?? "var(--paper-deep)"}`,
      };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, textAlign: "center" }}>
      <div style={{ ...heroStyle, ...bgStyle }}>
        {heroCountry && <span aria-hidden="true">{FLAG[heroCountry] ?? "🌍"}</span>}
        <div style={{ fontSize: 40 }} aria-hidden="true">🎉</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 25, marginTop: 8 }}>{t.title}</div>
        <div style={{ fontSize: 14, marginTop: 6, opacity: 0.95 }}>{t.kept(keptCards.length)}</div>
      </div>

      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {keptCards.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "14px 0 6px" }}>
            {keptCards.map((c) => (
              <div key={c.id} style={keptRowStyle}>
                <span style={{ color: "var(--terra)" }} aria-hidden="true">❤️</span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{c.literal ?? c.expression}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-softer)" }}>{c.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", textAlign: "center", margin: "20px 0" }}>
            {t.emptyKept}
          </p>
        )}

        {keptCards.length > 0 && heroCountry && (
          <span style={collUpdateStyle}>
            {FLAG[heroCountry] ?? "🌍"} {COUNTRY_NAME[heroCountry] ?? heroCountry.toUpperCase()} — {t.collectionUpdate}
          </span>
        )}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9, paddingTop: 22 }}>
          <button onClick={onReplay} style={primaryBtnStyle}>
            <span aria-hidden="true">🔁</span> {t.replay}
          </button>
          <div style={clusterStyle}>
            <Link href={exploreHref} data-testid="recap-explore" style={clusterBtnStyle}>
              <span style={clusterIconStyle} aria-hidden="true">🔍</span>
              {t.explore}
            </Link>
            <button onClick={onChangeFilters} style={clusterBtnStyle}>
              <span style={clusterIconStyle} aria-hidden="true">🎛️</span>
              {t.changeFilters}
            </button>
          </div>
          <div style={orRowStyle}>
            <span style={orLineStyle} />
            {orLabel}
            <span style={orLineStyle} />
          </div>
          <Link href="/collection" style={exitBtnStyle}>
            <span aria-hidden="true">❤️</span> {t.viewCollection}
          </Link>
        </div>
      </div>
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  position: "relative",
  color: "#fff",
  padding: "34px 22px 22px",
  borderRadius: "var(--r-lg) var(--r-lg) 0 0",
};

const keptRowStyle: React.CSSProperties = {
  background: "var(--paper)",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: "var(--r-md)",
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "var(--shadow-card)",
  textAlign: "left",
};

const collUpdateStyle: React.CSSProperties = {
  margin: "8px auto 0",
  display: "inline-block",
  background: "var(--ochre-bg)",
  border: "1.5px dashed var(--ochre)",
  borderRadius: 999,
  padding: "6px 16px",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--ochre-deep)",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--plum)",
  color: "#fff",
  border: "none",
  padding: 14,
  borderRadius: 999,
  fontSize: 16,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  boxShadow: "0 3px 0 var(--plum-deep)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const clusterStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const clusterBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "var(--plum-bg)",
  color: "var(--plum-deep)",
  border: "1.5px solid var(--plum-soft)",
  borderRadius: 14,
  padding: "10px 6px",
  fontSize: 12.5,
  fontWeight: 700,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  textDecoration: "none",
};

const clusterIconStyle: React.CSSProperties = {
  fontSize: 18,
};

const orRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "7px 0 2px",
  color: "var(--ink-faint)",
  fontSize: 11,
};

const orLineStyle: React.CSSProperties = {
  flex: 1,
  borderTop: "1.5px dashed var(--paper-edge)",
};

const exitBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "none",
  border: "2px solid var(--terra)",
  color: "var(--terra-deep)",
  borderRadius: 999,
  padding: 12,
  fontSize: 14.5,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  textDecoration: "none",
};

"use client";

/**
 * Voyage — the guess→reveal card (mockup docs/mockups/pivot-jeu-decouverte.html,
 * states 1 & 2). Front content (expression + literal + hints + "Révéler le
 * sens") is swapped IN PLACE for the revealed content (meaning + collapsible
 * origin/example panels) — same DOM node, not a 3D flip (see mockup's own
 * reveal() JS: it just toggles two sibling <div>s' display).
 *
 * The card background reuses Random mode's photo mechanism (HERO_IMAGE_COUNTRIES
 * + /public/images/{country}.jpg, flag-gradient fallback) but applies it
 * directly on this contained card rather than the page-level .country-photo
 * class (that class is tuned for full-bleed hero sections with a sidebar
 * offset — not appropriate for a rounded card), baking in the same dark
 * vignette the mockup uses so white text stays legible over any photo.
 */

import { useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import type { GameCard as GameCardType } from "@/lib/api";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT, HERO_IMAGE_COUNTRIES } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { tagIcon } from "@/lib/tagIcons";
import { useFavorite } from "@/lib/useFavorite";
import { useAudio } from "@/lib/useAudio";
import type { LanguageMode } from "@/lib/carnet";
import { VOYAGE_PLAY, VOYAGE_RARE } from "@/lib/voyageLabels";

type Props = {
  uiLang: string;
  card: GameCardType;
  // Collection's Découverte/Maîtrisée mode for this card's language (S227
  // L8) — null when undecided. Only conditions the literal-translation
  // hint below: "mastered" hides it pre-reveal for a real challenge,
  // "discovery"/undecided keep it as a guessing aid (prior behaviour).
  mode?: LanguageMode | null;
  onNext: () => void;
  // TODO(Report lot): wire to POST /reports (expression_id, reason?, comment?, client_id?, ui_lang?)
  onReport?: (expressionId: string) => void;
  onKeepToggle?: (expressionId: string, kept: boolean) => void;
};

export default function VoyageCard({ uiLang, card, mode = null, onNext, onReport = () => {}, onKeepToggle }: Props) {
  const t = VOYAGE_PLAY[uiLang] ?? VOYAGE_PLAY.en;
  const rareT = VOYAGE_RARE[uiLang] ?? VOYAGE_RARE.en;
  const [revealed, setRevealed] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [fav, handleFavRaw] = useFavorite(card.id);
  const { speaking, voiceAvailable, handleListen } = useAudio(card.expression, card.language);

  const countryCode = card.country || card.language;
  const hintIcons = Array.from(new Set(card.tags.map((tg) => tagIcon(tg)).filter(Boolean))).slice(0, 3);

  function handleKeep(ev?: React.MouseEvent) {
    const willBeFav = !fav;
    handleFavRaw(ev);
    onKeepToggle?.(card.id, willBeFav);
  }

  const bgStyle: React.CSSProperties = HERO_IMAGE_COUNTRIES.has(countryCode)
    ? {
        backgroundImage: `linear-gradient(rgba(20,12,28,0.52), rgba(24,16,10,0.6)), url('/images/${countryCode}.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(rgba(20,12,28,0.42), rgba(24,16,10,0.5)), ${COUNTRY_GRADIENT[countryCode] ?? "var(--paper-deep)"}`,
      };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ ...cardStyle, ...bgStyle }}>
        {card.rare && <span style={rareBadgeStyle}>{rareT.badge}</span>}
        <div style={stampStyle} aria-hidden="true">{FLAG[countryCode] ?? "🌍"}</div>

        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>
          {getTypeLabel(card.type, uiLang)} · {COUNTRY_NAME[countryCode] ?? countryCode.toUpperCase()}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 27, fontWeight: 600, lineHeight: 1.18, flex: 1 }}>
            {card.expression}
          </div>
          <button
            onClick={voiceAvailable === false ? undefined : handleListen}
            disabled={voiceAvailable === false}
            aria-label={t.listenAria}
            title={t.listenAria}
            style={{
              ...listenBtnStyle,
              opacity: voiceAvailable === false ? 0.4 : 0.85,
              cursor: voiceAvailable === false ? "not-allowed" : "pointer",
            }}
          >
            {speaking ? <VolumeX size={16} strokeWidth={1.6} /> : <Volume2 size={16} strokeWidth={1.6} />}
          </button>
        </div>
        {/* Literal translation — shown by default; hidden pre-reveal in
            "mastered" mode for a real challenge (S227 L8, resolves the old
            decision #1 TODO). Reappears once revealed regardless of mode,
            same as the rest of the answer. */}
        {card.literal && (revealed || mode !== "mastered") && (
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 20, opacity: 0.95, marginTop: 6 }}>
            “{card.literal}”
          </div>
        )}
        {hintIcons.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {hintIcons.map((icon, i) => (
              <span key={i} style={hintChipStyle} aria-hidden="true">{icon}</span>
            ))}
          </div>
        )}

        {!revealed ? (
          <div style={{ marginTop: "auto", textAlign: "center", paddingTop: 26 }}>
            <div style={{ fontSize: 15, opacity: 0.95, marginBottom: 14 }}>🤔 {t.guessQuestion}</div>
            <button onClick={() => setRevealed(true)} style={revealBtnStyle}>{t.revealBtn}</button>
          </div>
        ) : (
          <div style={{ marginTop: 18, animation: "fadeSlideUp 0.35s ease" }}>
            <div style={sectionLabelStyle}>{t.meaningLabel}</div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, marginTop: 4 }}>{card.meaning}</div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
              {card.origin && (
                <div style={depthItemStyle}>
                  <button onClick={() => setOriginOpen((o) => !o)} style={depthHeadStyle}>
                    <span>📜 {t.originLabel}</span>
                    <span style={{ display: "inline-block", transform: originOpen ? "rotate(90deg)" : "none", transition: "transform .2s", opacity: 0.7 }}>›</span>
                  </button>
                  {originOpen && <div style={depthBodyStyle}>{card.origin}</div>}
                </div>
              )}
              {card.example && (
                <div style={depthItemStyle}>
                  <button onClick={() => setExampleOpen((o) => !o)} style={depthHeadStyle}>
                    <span>💬 {t.exampleLabel}</span>
                    <span style={{ display: "inline-block", transform: exampleOpen ? "rotate(90deg)" : "none", transition: "transform .2s", opacity: 0.7 }}>›</span>
                  </button>
                  {exampleOpen && <div style={depthBodyStyle}>{card.example}</div>}
                </div>
              )}
              <Link href={`/expression/${card.id}`} target="_blank" rel="noopener noreferrer" style={depthLinkStyle}>{t.fullCard}</Link>
            </div>
          </div>
        )}

        <button
          onClick={() => onReport(card.id)}
          aria-label={t.reportAria}
          title={t.reportAria}
          style={reportBtnStyle}
        >
          🚩
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "14px 2px 4px",
          opacity: revealed ? 1 : 0.4,
          pointerEvents: revealed ? "auto" : "none",
          transition: "opacity 0.15s",
        }}
      >
        <button onClick={handleKeep} style={{ ...keepBtnStyle, ...(fav ? keepBtnActiveStyle : {}) }}>
          {fav ? t.keptBtn : t.keepBtn}
        </button>
        <button onClick={onNext} style={nextBtnStyle}>{t.nextBtn}</button>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: "var(--r-lg)",
  overflow: "hidden",
  boxShadow: "var(--shadow-deep)",
  color: "#fff",
  padding: "22px 20px 18px",
  flex: 1,
  minHeight: 420,
  display: "flex",
  flexDirection: "column",
};

const stampStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 14,
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: 20,
  padding: "4px 8px",
  borderRadius: 3,
  transform: "rotate(4deg)",
  boxShadow: "1px 2px 0 rgba(0,0,0,0.3)",
  border: "1px dashed var(--ink-faint)",
};

const rareBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  left: 14,
  background: "var(--ochre-bg)",
  color: "var(--ochre-deep)",
  border: "1.5px solid var(--ochre)",
  borderRadius: 999,
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 10px",
  zIndex: 2,
};

const hintChipStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: 999,
  padding: "4px 11px",
  fontSize: 15,
};

const revealBtnStyle: React.CSSProperties = {
  background: "var(--ochre)",
  color: "var(--ink)",
  border: "none",
  fontSize: 15.5,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  padding: "12px 26px",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "0 3px 0 var(--ochre-deep)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 2,
  textTransform: "uppercase",
  opacity: 0.75,
  fontWeight: 700,
};

const depthItemStyle: React.CSSProperties = {
  background: "rgba(253,248,238,0.13)",
  border: "1px solid rgba(255,255,255,0.28)",
  borderRadius: "var(--r-md)",
  overflow: "hidden",
};

const depthHeadStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "var(--font-body)",
  padding: "9px 12px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const depthBodyStyle: React.CSSProperties = {
  padding: "0 12px 11px",
  fontSize: 12.5,
  lineHeight: 1.5,
  opacity: 0.94,
  animation: "fadeSlideUp 0.25s ease",
};

const depthLinkStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  marginTop: 4,
  color: "#fff",
  fontSize: 12.5,
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  opacity: 0.9,
};

const listenBtnStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.16)",
  border: "none",
  borderRadius: "50%",
  width: 30,
  height: 30,
  color: "#fff",
  marginTop: 2,
};

const reportBtnStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 10,
  right: 12,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  opacity: 0.6,
  zIndex: 2,
};

const keepBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "13px 0",
  borderRadius: 999,
  fontSize: 14.5,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  background: "var(--terra)",
  color: "#fff",
  border: "none",
  boxShadow: "0 3px 0 var(--terra-deep)",
};

const keepBtnActiveStyle: React.CSSProperties = {
  background: "var(--paper)",
  color: "var(--terra)",
  border: "2px solid var(--terra)",
  boxShadow: "none",
};

const nextBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "13px 0",
  borderRadius: 999,
  fontSize: 14.5,
  fontWeight: 800,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  background: "var(--paper)",
  color: "var(--ink-soft)",
  border: "2px solid var(--paper-edge)",
};

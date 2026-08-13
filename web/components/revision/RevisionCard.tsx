"use client";

/**
 * Révision — the flashcard (lot D, docs/pivot-lot0-contract.md §1/§5).
 * Adapted from components/voyage/VoyageCard.tsx: same reveal-in-place
 * pattern (front content swapped for back content in the SAME DOM node —
 * not a CSS 3D flip, see that file's own top comment) and the same
 * background-image / collapsible origin-example / report / fiche-link
 * mechanics. Two differences from Voyage's card:
 * - no "keep ❤️" button (every card here is already a favorite by
 *   definition — Révision only draws from the collection);
 * - the bottom action row is "pas encore / je savais" (self-assessment)
 *   instead of "garder / suivante".
 * No "vocabulaire à retenir" chips (mockup feature, skipped — see lot D
 * brief: no extraction heuristic exists in this codebase for that yet).
 */

import { useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import type { GameCard as GameCardType } from "@/lib/api";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT, HERO_IMAGE_COUNTRIES } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { REVISION_LABELS } from "@/lib/revisionLabels";
import { useAudio } from "@/lib/useAudio";

type Props = {
  uiLang: string;
  card: GameCardType;
  onAnswer: (expressionId: string, result: "knew" | "not_yet") => void;
  onReport?: (expressionId: string) => void;
};

export default function RevisionCard({ uiLang, card, onAnswer, onReport = () => {} }: Props) {
  const t = REVISION_LABELS[uiLang] ?? REVISION_LABELS.en;
  const [flipped, setFlipped] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const { speaking, voiceAvailable, handleListen } = useAudio(card.expression, card.language);

  const countryCode = card.country || card.language;

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
        {card.literal && (
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 20, opacity: 0.95, marginTop: 6 }}>
            “{card.literal}”
          </div>
        )}

        {!flipped ? (
          <div style={{ marginTop: "auto", textAlign: "center", paddingTop: 26 }}>
            <div style={{ fontSize: 15, opacity: 0.95, marginBottom: 14 }}>🔄 {t.flip}</div>
            <button onClick={() => setFlipped(true)} style={revealBtnStyle}>{t.flipBtn}</button>
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
          opacity: flipped ? 1 : 0.4,
          pointerEvents: flipped ? "auto" : "none",
          transition: "opacity 0.15s",
        }}
      >
        <button onClick={() => onAnswer(card.id, "not_yet")} style={notYetBtnStyle}>{t.notYet}</button>
        <button onClick={() => onAnswer(card.id, "knew")} style={knewBtnStyle}>{t.knew}</button>
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

const notYetBtnStyle: React.CSSProperties = {
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

const knewBtnStyle: React.CSSProperties = {
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

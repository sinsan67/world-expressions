"use client";

/**
 * Guess/reveal card for Jeu 3 — Constellation, ported from the wireframe's
 * `.overlay`/`.card` markup (scratchpad/wireframe-game3-constellation.html).
 * Two deliberate departures from that wireframe (itself explicitly labelled
 * low-fidelity), both mandated by the build plan:
 *
 * - No "Suivant ▶" button — it was a no-op alias for closing in the
 *   wireframe (there's no "next node" concept in free exploration, unlike
 *   Voyage's fixed 10-card deck), and it isn't among the contract's §4
 *   required label keys. Only "close" remains.
 * - ❤️ "Garder" is per example row, not one global button — each shown
 *   proverb is a distinct expression_id. `ExampleRow` calls
 *   `useFavorite(example.expression_id)` once per row (Rules of Hooks: the
 *   hook itself is always called unconditionally at the top of ExampleRow;
 *   what's conditional is whether ExampleRow ever mounts, which is fine),
 *   matching the app-wide "one expression_id at a time" favoriting pattern
 *   used everywhere else (e.g. VoyageCard.tsx). No new endpoint, no new
 *   api.ts favorites function — this hook is reused exactly as-is.
 * - No "Révéler" button (removed S240, addendum §7.1) — examples fade in
 *   automatically as soon as `detail` resolves, no click required. Reuses
 *   the app's existing `fadeSlideUp` keyframe (globals.css) rather than a
 *   new animation, same ~0.4s used elsewhere (e.g. type/[slug]/page.tsx).
 */

import { FLAG } from "@/lib/constants";
import { useFavorite } from "@/lib/useFavorite";
import type { ConstellationExample, ConstellationTag } from "@/lib/api";
import type { ConstellationLabels } from "@/lib/constellationLabels";

type Props = {
  open: boolean;
  loading: boolean;
  detail: ConstellationTag | null;
  onClose: () => void;
  labels: ConstellationLabels;
};

export default function ConstellationOverlay({ open, loading, detail, onClose, labels }: Props) {
  if (!open) return null;

  const hasExamples = !!detail && detail.examples.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail?.label ?? labels.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={overlayStyle}
    >
      <div style={cardStyle}>
        <div style={{ fontSize: "2rem", marginBottom: "0.3rem" }} aria-hidden="true">
          {detail?.emoji ?? "✨"}
        </div>
        <div style={conceptNameStyle}>{detail?.label ?? ""}</div>

        {loading && <p style={placeholderStyle}>…</p>}

        {!loading && !hasExamples && (
          <p style={placeholderStyle}>{labels.placeholder}</p>
        )}

        {!loading && hasExamples && (
          <div style={examplesFadeInStyle}>
            {detail!.examples.map((example) => (
              <ExampleRow key={example.expression_id} example={example} labels={labels} />
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} style={closeStyle} data-testid="constellation-close">
          {labels.close}
        </button>
      </div>
    </div>
  );
}

function ExampleRow({ example, labels }: { example: ConstellationExample; labels: ConstellationLabels }) {
  const [fav, handleFav] = useFavorite(example.expression_id);

  return (
    <div style={langRowStyle}>
      <div style={exprStyle}>
        <span aria-hidden="true">{FLAG[example.country] ?? "🌍"}</span> {example.text}
      </div>
      <p style={meaningStyle}>{example.meaning}</p>
      <button
        type="button"
        onClick={handleFav}
        style={{ ...keepBtnStyle, ...(fav ? keepBtnActiveStyle : {}) }}
        data-testid={`constellation-keep-${example.expression_id}`}
      >
        {fav ? labels.keptBtn : labels.keepBtn}
      </button>
    </div>
  );
}

// z-index: 60 — one level above GlobalHeader's z-index: 50 (globals.css
// .wex-global-header) so the modal fully covers the floating lang/auth pill
// while open. The wireframe used 50 for both, fine in isolation but not once
// layered under the app's real fixed header.
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  zIndex: 60,
};

const cardStyle: React.CSSProperties = {
  background: "var(--paper)",
  color: "var(--ink)",
  borderRadius: 20,
  padding: "1.6rem 1.4rem",
  maxWidth: 400,
  width: "100%",
  // Nodes can carry 2-3 example rows with long meaning paragraphs (proverb
  // content, longer on average than idiom cards) — without a cap the card
  // can exceed the viewport height and push "Fermer" out of reach with no
  // way to scroll to it. maxHeight + scroll keeps the close button always
  // reachable regardless of content length or viewport size.
  maxHeight: "85vh",
  overflowY: "auto",
  textAlign: "center",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
};

const conceptNameStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--ink-faint)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "0.9rem",
};

const placeholderStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--ink-faint)",
  margin: "0 0 1rem",
  lineHeight: 1.5,
};

const langRowStyle: React.CSSProperties = {
  textAlign: "left",
  background: "var(--paper-deep)",
  borderRadius: 12,
  padding: "0.6rem 0.8rem",
  marginBottom: "0.55rem",
};

const exprStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: "1.02rem",
  margin: "0 0 0.15rem",
};

const meaningStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--ink-soft)",
  margin: "0 0 0.5rem",
};

// Auto-reveal fade-in (S240, addendum §7.1) — reuses globals.css'
// `fadeSlideUp` keyframe (opacity 0→1, translateY 10px→0) instead of
// inventing a new one, same ~0.4s timing used elsewhere in the app (e.g.
// type/[slug]/page.tsx's header block).
const examplesFadeInStyle: React.CSSProperties = {
  animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both",
};

const closeStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  background: "none",
  border: "none",
  color: "var(--ink-faint)",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const keepBtnStyle: React.CSSProperties = {
  padding: "0.45rem 1rem",
  borderRadius: 999,
  border: "none",
  background: "var(--terra)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.8rem",
  cursor: "pointer",
};

const keepBtnActiveStyle: React.CSSProperties = {
  background: "var(--paper)",
  color: "var(--terra)",
  border: "2px solid var(--terra)",
};

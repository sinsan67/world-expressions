"use client";

/**
 * Révision — end-of-session recap. Simpler than VoyageRecap.tsx: a revision
 * session mixes languages/countries by construction (queue drawn across the
 * whole collection), so a single most-seen-country hero photo would
 * misrepresent it — just a plain card with an emoji, no pickMostSeenCountry.
 */

import Link from "next/link";
import { REVISION_LABELS } from "@/lib/revisionLabels";

type Props = {
  uiLang: string;
  knewCount: number;
  total: number;
  hasMoreDue: boolean;
  onReplay: () => void;
};

export default function RevisionRecap({ uiLang, knewCount, total, hasMoreDue, onReplay }: Props) {
  const t = REVISION_LABELS[uiLang] ?? REVISION_LABELS.en;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, textAlign: "center" }}>
      <div style={heroStyle}>
        <div style={{ fontSize: 40 }} aria-hidden="true">🃏</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 25, marginTop: 8 }}>{t.recap.title}</div>
        <div style={{ fontSize: 14, marginTop: 6, opacity: 0.95 }}>{t.recap.tally(knewCount, total)}</div>
      </div>

      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9, paddingTop: 22 }}>
          {hasMoreDue && (
            <button onClick={onReplay} style={primaryBtnStyle}>{t.recap.replay}</button>
          )}
          <Link href="/collection" style={secondaryBtnStyle}>{t.recap.viewCollection}</Link>
          <Link href="/" style={secondaryBtnStyle}>{t.recap.backHub}</Link>
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
  background: "linear-gradient(135deg, var(--terra-deep), var(--terra))",
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
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--ink-soft)",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  display: "block",
  textAlign: "center",
};

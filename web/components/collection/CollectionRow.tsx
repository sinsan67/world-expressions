"use client";

/**
 * Ma collection (/collection, lot C) — a single favorite row. Deliberately
 * simpler than the mockup's "Écran 2" (retravail/study view, mockup
 * docs/mockups/pivot-carnet.html) — that view overlaps with the future
 * Révision lot (D, not built yet), so per the lot C brief a row click just
 * navigates to the existing expression detail page.
 */

import Link from "next/link";
import type { Expression } from "@/lib/api";

type Props = {
  expression: Expression;
  uiLang: string;
  needsReview: boolean;
  toReviewLabel: string;
};

export default function CollectionRow({ expression, uiLang, needsReview, toReviewLabel }: Props) {
  // browseByIds(ids, uiLang) already localizes `literal` server-side when a
  // translation exists (content_translations); literal_fr is the FR-only
  // fallback used elsewhere in the app for the same field (see FavoriteRow's
  // sibling components) — kept here defensively in case a caller ever hydrates
  // without a locale.
  const literal = expression.literal ?? expression.literal_fr ?? null;

  return (
    <Link
      href={`/expression/${expression.id}?lang=${uiLang}`}
      style={{
        display: "block",
        background: "var(--paper)",
        border: "1.5px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        padding: "0.65rem 0.85rem",
        boxShadow: "var(--shadow-card)",
        position: "relative",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 150ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--paper-edge)"; }}
    >
      {needsReview && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            fontSize: 10,
            fontWeight: 800,
            color: "var(--terra)",
            background: "var(--terra-bg)",
            padding: "2px 8px",
            borderRadius: "var(--r-pill)",
          }}
        >
          {toReviewLabel}
        </span>
      )}
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--ink)", paddingRight: needsReview ? 64 : 0 }}>
        {expression.expression}
      </div>
      {literal && (
        <div style={{ fontFamily: "var(--font-hand)", fontSize: 15, color: "var(--ink-soft)" }}>
          « {literal} »
        </div>
      )}
      <div style={{ fontSize: 12.5, color: "var(--ink-softer)", marginTop: 2 }}>
        {expression.meaning}
      </div>
    </Link>
  );
}

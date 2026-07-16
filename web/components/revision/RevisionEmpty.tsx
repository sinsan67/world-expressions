"use client";

import Link from "next/link";
import { REVISION_LABELS } from "@/lib/revisionLabels";
import { REVISION_LOCK_THRESHOLD } from "@/lib/reviewQueue";

/**
 * Révision — the two non-playable states (lot D, decision #2: lock
 * threshold = 5 favorites). Visual pattern copied from
 * components/collection/EmptyCollection.tsx (icon/title/body/CTA). Both
 * variants point to /voyage — the only way to gain favorites.
 */

type Props = {
  variant: "empty" | "locked";
  uiLang: string;
  favoritesCount: number;
};

export default function RevisionEmpty({ variant, uiLang, favoritesCount }: Props) {
  const t = REVISION_LABELS[uiLang] ?? REVISION_LABELS.en;

  const icon = variant === "empty" ? "🃏" : "🔒";
  const title = variant === "empty" ? t.empty.rebound.title : t.locked.title;
  const body = variant === "empty"
    ? t.empty.rebound.body
    : t.locked.pairing(Math.max(0, REVISION_LOCK_THRESHOLD - favoritesCount));
  const cta = variant === "empty" ? t.empty.rebound.cta : t.locked.cta;

  return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem", maxWidth: 420, margin: "2rem auto 0" }}>
      <div style={{ fontSize: 42, marginBottom: "1rem" }} aria-hidden="true">{icon}</div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)", marginBottom: "0.5rem" }}>
        {title}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        {body}
      </p>
      <Link
        href="/voyage"
        style={{
          display: "inline-block",
          padding: "0.625rem 1.5rem",
          borderRadius: "var(--r-pill)",
          background: "var(--plum)",
          color: "#fff",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 2px 0 var(--plum-deep)",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

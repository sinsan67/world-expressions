"use client";

import Link from "next/link";
import type { CollectionLabels } from "@/lib/collectionLabels";

// Ma collection (/collection, lot C) — zero-favorites state. Voyage is the
// direct "go get some favorites" CTA (no hub link needed here, per brief).
export default function EmptyCollection({ t }: { t: CollectionLabels }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem", maxWidth: 420, margin: "2rem auto 0" }}>
      <div style={{ fontSize: 42, marginBottom: "1rem" }} aria-hidden="true">🧳</div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)", marginBottom: "0.5rem" }}>
        {t.empty.title}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        {t.empty.body}
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
        {t.empty.cta}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { tagIcon } from "@/lib/tagIcons";

// Curated concept slugs for the no-results rebound — each returns 150+
// expressions in prod and has a tag emoji (F9, Luke L4)
const REBOUND_TAGS = ["money", "love", "luck", "animals", "food", "travel"];

type Props = {
  eyebrow: string;
  surpriseLabel: string;
  tagNames: Record<string, string>;
  onConceptClick: (tag: string) => void;
};

export default function EmptyStateRebound({ eyebrow, surpriseLabel, tagNames, onConceptClick }: Props) {
  return (
    <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-softer)", marginBottom: "0.75rem", fontFamily: "var(--font-body)" }}>
        {eyebrow}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {REBOUND_TAGS.map((tag) => (
          <button
            key={tag}
            data-testid="rebound-chip"
            onClick={() => onConceptClick(tag)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, padding: "6px 14px", borderRadius: "var(--r-pill)", border: "1.5px solid var(--plum-soft)", background: "var(--plum-bg)", color: "var(--plum)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "border-color 120ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
          >
            {tagIcon(tag) && <span>{tagIcon(tag)}</span>}
            <span>{tagNames[tag] ?? tag}</span>
          </button>
        ))}
      </div>
      <Link
        href="/random-mode"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: "1.5rem", padding: "10px 22px", borderRadius: "var(--r-pill)", background: "var(--terra)", color: "var(--paper)", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-body)" }}
      >
        🎲 {surpriseLabel}
      </Link>
    </div>
  );
}

"use client";

/**
 * "🎲 Play with these cards" — the exploration → game bridge (lot N2,
 * atelier S208 décision 2, mockup-nav-globale-A). A floating pill pinned
 * above the mobile BottomNav (desktop: above the content area, offset past
 * the fixed sidebar — positioning shared with .expr-mode-switcher via the
 * .wex-ctx-play class) that opens /voyage with the page's context
 * pre-filled as filters.
 */

import Link from "next/link";
import type { VoyageFilters } from "@/components/voyage/VoyageSetup";

const LABEL: Record<string, string> = {
  fr: "Jouer avec ces cartes",
  en: "Play with these cards",
  es: "Jugar con estas cartas",
  it: "Gioca con queste carte",
  tr: "Bu kartlarla oyna",
  de: "Mit diesen Karten spielen",
  ja: "このカードで遊ぶ",
};

export default function PlayWithCardsCta({
  uiLang,
  filters,
}: {
  uiLang: string;
  filters?: Partial<VoyageFilters>;
}) {
  const params = new URLSearchParams();
  if (filters?.country) params.set("country", filters.country);
  if (filters?.kind) params.set("kind", filters.kind);
  if (filters?.domain) params.set("domain", filters.domain);
  const qs = params.toString();

  return (
    <div className="wex-ctx-play">
      <Link
        href={`/voyage${qs ? `?${qs}` : ""}`}
        data-testid="play-with-cards"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--terra)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 20px",
          fontSize: 14.5,
          fontWeight: 700,
          fontFamily: "var(--font-body)",
          textDecoration: "none",
          boxShadow: "0 3px 0 var(--terra-deep), 0 6px 14px rgba(193,84,58,0.3)",
        }}
      >
        <span aria-hidden="true">🎲</span>
        {LABEL[uiLang] ?? LABEL.en}
      </Link>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import WelcomeModal from "@/components/WelcomeModal";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import GameCard from "@/components/home/GameCard";
import DailyPostcard from "@/components/home/DailyPostcard";
import CollectionStrip from "@/components/home/CollectionStrip";
import CarnetHeartLink from "@/components/ui/CarnetHeartLink";
import LangDropdown from "@/components/ui/LangDropdown";
import { getDailyExpression, Expression } from "@/lib/api";
import { HUB_LABELS } from "@/lib/hubLabels";
import { useUILangContext } from "@/lib/UILangContext";
import { UI_LANGS, type UILang } from "@/lib/useUILang";

type DailyExpression = Expression & { meaning_locale: string; literal: string | null; date: string };

// Games hub — new "/" home. Replaces the old search-first HomePage (moved to
// /search). See docs/pivot-lot0-contract.md §1/§5 (lot A) and the mockup
// docs/mockups/pivot-hub.html for the visual reference this mirrors.
export default function Hub() {
  const { uiLang, setUILang } = useUILangContext();
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [daily, setDaily] = useState<DailyExpression | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  const t = HUB_LABELS[uiLang] ?? HUB_LABELS.en;

  // First-visit language gate — same localStorage check as the old HomePage.
  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    setShowWelcome(!stored || !UI_LANGS.includes(stored as UILang));
  }, []);

  // GET /daily — deterministic pick for the UTC day, no client-side caching
  // needed (unlike the old getRandomExpression() sessionStorage pattern).
  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    getDailyExpression(uiLang)
      .then((expr) => { if (!cancelled) setDaily(expr); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDailyLoading(false); });
    return () => { cancelled = true; };
  }, [uiLang]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      {showWelcome && (
        <WelcomeModal onSelect={(lang) => { setUILang(lang); setShowWelcome(false); }} />
      )}

      {/* Sidebar — desktop only */}
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>
        {/* Mobile-only header: wordmark + search/heart/lang. On desktop the
            Sidebar carries the wordmark and GlobalHeader carries lang+auth —
            see components/ui/GlobalHeader.tsx's isHome special-case. */}
        <header
          className="wex-mobile-header"
          style={{ alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1rem 0.4rem" }}
        >
          <Link href="/" style={{ textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>
            <span style={{ color: "var(--plum-deep)" }}>World </span>
            <span style={{ color: "var(--terra)" }}>Expressions</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Link
              href="/search"
              aria-label={t.search.title}
              style={{ color: "var(--ink-soft)", display: "flex", alignItems: "center" }}
            >
              <Search size={20} strokeWidth={1.6} />
            </Link>
            <CarnetHeartLink uiLang={uiLang} />
            <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
          </div>
        </header>

        {/* Hub title */}
        <div style={{ padding: "0.3rem 1.1rem 0.9rem", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-softer)", fontWeight: 700 }}>
            World Expressions
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 27, color: "var(--ink)", lineHeight: 1.15, marginTop: 2, fontWeight: 500 }}>
            {t.title}
          </h1>
        </div>

        {/* Game cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 1rem", maxWidth: 640, margin: "0 auto" }}>
          <GameCard
            variant="discover"
            emoji="🧭"
            title={t.voyage.title}
            subtitle={t.voyage.tagline}
            ctaLabel={t.voyage.cta}
            href="/voyage"
            testId="game-card-voyage"
          />
          <GameCard
            variant="review"
            emoji="🃏"
            title={t.revision.title}
            subtitle={t.revision.tagline}
            ctaLabel={t.revision.cta}
            href="/revision"
            testId="game-card-revision"
          />

          {/* Teaser — 3rd game, static & non-clickable (S196 decision) */}
          <div
            data-testid="game-card-teaser"
            style={{
              background: "transparent",
              border: "2px dashed var(--ink-faint)",
              borderRadius: "var(--r-lg)",
              padding: "0.85rem 1.1rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "default",
            }}
          >
            <span style={{ fontSize: 26, filter: "grayscale(0.4)" }} aria-hidden="true">🗺️</span>
            <div style={{ fontSize: 13, color: "var(--ink-softer)", lineHeight: 1.35 }}>
              <strong style={{ color: "var(--ink-soft)" }}>{t.comingSoon.title}</strong>
              <br />
              {t.comingSoon.body}
            </div>
          </div>
        </div>

        {/* Collection teaser + daily postcard */}
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <CollectionStrip title={t.collection.teaser} countLabel={t.collection.count} emptyLabel={t.collection.empty} />
          <DailyPostcard
            expression={daily}
            loading={dailyLoading}
            uiLang={uiLang}
            label={t.daily.title}
            hint={t.daily.hint}
          />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav uiLang={uiLang} />
    </div>
  );
}

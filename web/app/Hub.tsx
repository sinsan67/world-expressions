"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import WelcomeModal from "@/components/WelcomeModal";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import GameCard from "@/components/home/GameCard";
import DailyPostcard from "@/components/home/DailyPostcard";
import CollectionStrip from "@/components/home/CollectionStrip";
import CarnetHeartLink from "@/components/ui/CarnetHeartLink";
import LangDropdown from "@/components/ui/LangDropdown";
import { getDailyExpression, getUserFavorites, Expression } from "@/lib/api";
import { getCarnet } from "@/lib/carnet";
import { classifyFavorites, FavoriteReviewState } from "@/lib/reviewQueue";
import { HUB_LABELS, type HubLabels } from "@/lib/hubLabels";
import { REVISION_LABELS } from "@/lib/revisionLabels";
import { useUILangContext } from "@/lib/UILangContext";
import { UI_LANGS, type UILang } from "@/lib/useUILang";

type DailyExpression = Expression & { meaning_locale: string; literal: string | null; date: string };

// "Explorer le monde" hub section (Lot N1) — Atlas/Concepts/Pays/Proverbes
// left the persistent nav (atelier S208 décision 2), demoted to a 2-tap
// discovery grid here. "Pays" is a direct shortcut to /country/fr (the
// flagship country page, regions included), not a duplicate of Atlas.
const EXPLORE_ITEMS: { id: string; emoji: string; href: string; labelKey: keyof HubLabels["explore"] }[] = [
  { id: "atlas", emoji: "🗺️", href: "/atlas", labelKey: "atlas" },
  { id: "concepts", emoji: "💡", href: "/emoji", labelKey: "concepts" },
  { id: "countries", emoji: "🇫🇷", href: "/country/fr", labelKey: "countries" },
  { id: "proverbs", emoji: "📜", href: "/type/proverb", labelKey: "proverbs" },
];

// Games hub — new "/" home. Replaces the old search-first HomePage (moved to
// /search). See docs/pivot-lot0-contract.md §1/§5 (lot A) and the mockup
// docs/mockups/pivot-hub.html for the visual reference this mirrors.
export default function Hub() {
  const { uiLang, setUILang } = useUILangContext();
  const { data: authSession, status } = useSession();
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [daily, setDaily] = useState<DailyExpression | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  // Révision chip counts (lot D) — total favorites + how many are due for
  // review. Loaded the same anon-local/logged-in-server dual path as
  // Collection.tsx; classification logic lives once in lib/reviewQueue.ts.
  const [favStats, setFavStats] = useState<{ total: number; toReview: number }>({ total: 0, toReview: 0 });

  const t = HUB_LABELS[uiLang] ?? HUB_LABELS.en;
  const revisionT = REVISION_LABELS[uiLang] ?? REVISION_LABELS.en;

  // First-visit language gate — same localStorage check as the old HomePage.
  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    setShowWelcome(!stored || !UI_LANGS.includes(stored as UILang));
  }, []);

  // Révision chip counts — fire once auth status resolves.
  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    async function load() {
      const userId = authSession?.user?.id;
      let favs: FavoriteReviewState[];
      if (status === "authenticated" && userId) {
        try {
          const raw = await getUserFavorites(userId);
          favs = raw.map((f) => ({ expressionId: f.expression_id, reviewBox: f.review_box, reviewedAt: f.reviewed_at }));
        } catch {
          favs = [];
        }
      } else {
        favs = getCarnet().favorites.map((f) => ({ expressionId: f.expressionId, reviewBox: f.reviewBox, reviewedAt: f.reviewedAt }));
      }
      if (cancelled) return;
      const { toReview } = classifyFavorites(favs);
      setFavStats({ total: favs.length, toReview: toReview.length });
    }
    load();
    return () => { cancelled = true; };
  }, [status, authSession]);

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
            chips={favStats.total === 0 ? undefined : [
              { label: t.collection.count(favStats.total) },
              ...(favStats.toReview > 0
                ? [{ label: `${favStats.toReview} ${revisionT.queue.toReview}`, tone: "warn" as const }]
                : []),
            ]}
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

          {/* Explorer le monde — Atlas/Concepts/Pays/Proverbes left the
              persistent nav in Lot N1, demoted to this hub section. */}
          <div style={{ padding: "1.1rem 1rem 0" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--ink-soft)", margin: "0 0 0.6rem" }}>
              {t.explore.title}
            </h2>
            <div data-testid="explore-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {EXPLORE_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  data-testid={`explore-item-${item.id}`}
                  style={{
                    background: "var(--paper-deep)",
                    border: "1px solid var(--paper-edge)",
                    borderRadius: "var(--r-md)",
                    padding: "0.6rem 0.2rem",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "var(--ink-soft)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden="true" style={{ display: "block", fontSize: 22, marginBottom: 2 }}>{item.emoji}</span>
                  {t.explore[item.labelKey]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav uiLang={uiLang} />
    </div>
  );
}

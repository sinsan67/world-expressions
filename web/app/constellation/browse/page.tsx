"use client";

/**
 * "Parcourir/Filtrer" — Jeu 3, Constellation (S240, addendum §7.2/§7.3 of
 * docs/game3-constellation-lot0-contract.md). Adapted from
 * web/app/type/[slug]/page.tsx, which is already exactly this shape
 * ("country filter only, no theme, no sort, ExpressionCard grid +
 * ResultsFilterBar + load-more pagination") — no new visual component
 * invented, per the contract.
 *
 * Differences from that gabarit:
 * - Static route, no `[slug]` — `kind` is hardcoded to "proverb".
 * - Results are scoped to the constellation's own tag-nodes (not every DB
 *   tag): `getConstellationGraph(uiLang)` supplies the node tag set, then
 *   `searchByConcept(nodeTags, ...)` (OR logic across tags, backend `GET
 *   /concept?tags=...`) replaces `browseByCountry`. This guarantees every
 *   card shown here points back to a real, tappable node (§7.3).
 * - `getFacets` isn't called — it only accepts a single concept, not a tag
 *   set, and `facets` is an optional prop on ResultsFilterBar. Omitted for
 *   this lot rather than approximated with one representative tag.
 * - Back link goes to `/constellation` (this is a sub-view of the game, not
 *   a top-level page) — not `/`.
 * - No PlayWithCardsCta (hors scope of this addendum).
 * - Light chrome (Sidebar/BottomNav, `--paper` background) like the
 *   gabarit — NOT constellation's own dark full-bleed stage, since
 *   ExpressionCard is styled for a light background.
 * - New copy lives in constellationLabels.ts's browse* keys, FR+EN only —
 *   same documented i18n scope as the rest of that file (contract §4), not
 *   widened just for this view.
 *
 * Card → node link (§7.3): each ExpressionCard gets `onOpen`, which picks
 * the first of the expression's tags that is also a constellation node
 * (falling back to its first tag if none match — "pas de désambiguïsation
 * à construire" per the contract) and navigates to `/constellation?tag=X`,
 * which Constellation.tsx reads to re-open that node's overlay and center
 * the camera on it.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import ExpressionCard from "@/components/ExpressionCard";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import { searchByConcept, getConstellationGraph, getCountries, getAllTagNames, Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { useUILangContext } from "@/lib/UILangContext";
import { CONSTELLATION_LABELS } from "@/lib/constellationLabels";

const LIMIT = 30;

export default function ConstellationBrowsePage() {
  const router = useRouter();
  const { uiLang } = useUILangContext();
  const t = CONSTELLATION_LABELS[uiLang] ?? CONSTELLATION_LABELS.en;

  const [nodeTags, setNodeTags] = useState<string[]>([]);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<{ code: string; label: string }[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);

  useEffect(() => {
    getCountries().then((data) => setCountries(data.map((c) => ({ code: c.code, label: `${FLAG[c.code] ?? "🌍"} ${COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}` }))));
  }, []);

  // The node tag set is locale-invariant (slugs, not labels) — fetched once,
  // independent of uiLang changes, unlike the results below.
  useEffect(() => {
    let active = true;
    getConstellationGraph(uiLang)
      .then((g) => { if (active) setNodeTags(g.nodes.map((n) => n.tag)); })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nodeTags.length === 0) return;
    let active = true;
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    Promise.all([
      searchByConcept(nodeTags, [], LIMIT, 0, "proverb", uiLang, undefined, filterCountries),
      getAllTagNames(uiLang),
    ])
      .then(([exprData, names]) => {
        if (!active) return;
        setExpressions(exprData.results);
        setTotal(exprData.total);
        setOffset(LIMIT);
        setTagNames(names);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeTags, uiLang]);

  const applyCountryFilter = useCallback(async (newCountries: string[]) => {
    setFilterCountries(newCountries);
    if (nodeTags.length === 0) return;
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    try {
      const data = await searchByConcept(nodeTags, [], LIMIT, 0, "proverb", uiLang, undefined, newCountries);
      setExpressions(data.results);
      setTotal(data.total);
      setOffset(LIMIT);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [nodeTags, uiLang]);

  const loadMore = useCallback(async () => {
    if (loadingMore || nodeTags.length === 0) return;
    setLoadingMore(true);
    try {
      const data = await searchByConcept(nodeTags, [], LIMIT, offset, "proverb", uiLang, undefined, filterCountries);
      setExpressions((prev) => [...prev, ...data.results]);
      setOffset((o) => o + LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [nodeTags, offset, filterCountries, loadingMore, uiLang]);

  // Card → node link (§7.3): first tag that's also a constellation node
  // wins, falling back to the expression's first tag if none match.
  const handleCardOpen = useCallback((expr: Expression) => {
    const nodeTagSet = new Set(nodeTags);
    const tag = expr.tags.find((tg) => nodeTagSet.has(tg)) ?? expr.tags[0];
    if (tag) router.push(`/constellation?tag=${encodeURIComponent(tag)}`);
  }, [nodeTags, router]);

  const hasMore = expressions.length < total;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>

        {/* Mobile header */}
        <div
          className="wex-mobile-header"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--paper-edge)",
            background: "var(--paper)",
          }}
        >
          <button
            onClick={() => router.push("/constellation")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-softer)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ← {t.browseBack}
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            {t.browseTitle}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

          {/* Breadcrumb */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/constellation" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>{t.browseBack}</Link>
              {" › "}
              <span style={{ color: "var(--ink)" }}>{t.browseTitle}</span>
            </p>
          </div>

          {/* Header */}
          <div
            style={{
              background: "var(--terra-bg)",
              border: "1px solid var(--terra-soft)",
              borderRadius: 20,
              padding: "1.75rem 1.75rem 1.5rem",
              marginBottom: "2rem",
              animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both",
            }}
          >
            <span style={{ fontSize: 48, lineHeight: 1, display: "block", marginBottom: "0.75rem" }}>
              📜
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              color: "var(--ink)",
              margin: "0 0 0.4rem",
              lineHeight: 1.15,
            }}>
              {t.browseTitle}
            </h1>
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: 17,
              color: "var(--ink-softer)",
              margin: 0,
            }}>
              {t.browseDesc}
            </p>
            {!loading && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ink-faint)",
                margin: "0.75rem 0 0",
              }}>
                {t.browseCount(total)}
              </p>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--terra-bg)", borderTopColor: "var(--terra)" }}
              />
            </div>
          ) : (
            <>
              {/* Country filter — shared component (country only, no types, no sort) */}
              <section style={{ marginBottom: "1.75rem" }}>
                <ResultsFilterBar
                  countries={countries}
                  filterCountries={filterCountries}
                  onFilterChange={applyCountryFilter}
                  sortMode="relevance"
                  onSortChange={() => {}}
                  uiLang={uiLang}
                  showTypes={false}
                  showSort={false}
                />
              </section>

              {/* Expression list */}
              <section>
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--ink-faint)",
                  marginBottom: "1rem",
                  fontFamily: "var(--font-body)",
                }}>
                  {t.browseResultsHeading}
                </p>

                {expressions.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>
                    {t.browseNoResults}
                  </p>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1rem",
                  }}>
                    {expressions.map((expr, i) => (
                      <div
                        key={expr.id}
                        style={{
                          height: "100%",
                          animation: "fadeSlideUp 0.35s ease-out both",
                          animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms`,
                        }}
                      >
                        <ExpressionCard
                          expression={expr}
                          onTagClick={(tag) => router.push(`/search?concept=${encodeURIComponent(tag)}`)}
                          onOpen={handleCardOpen}
                          uiLang={uiLang}
                          tagNames={tagNames}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer count / load more */}
                <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
                  {hasMore ? (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: 500,
                        padding: "10px 28px",
                        borderRadius: "var(--r-pill)",
                        border: "1.5px solid var(--paper-edge)",
                        background: "var(--paper)",
                        color: "var(--ink)",
                        cursor: loadingMore ? "default" : "pointer",
                        opacity: loadingMore ? 0.5 : 1,
                        transition: "all 120ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingMore) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = "var(--terra)";
                          el.style.color = "var(--terra)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "var(--paper-edge)";
                        el.style.color = "var(--ink)";
                      }}
                    >
                      {loadingMore ? t.browseLoading : t.browseLoadMore}
                    </button>
                  ) : expressions.length > 0 && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)" }}>
                      {t.browseAllDisplayed(total)}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

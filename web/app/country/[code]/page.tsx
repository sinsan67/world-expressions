"use client";

import { use, useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import ExpressionCard from "@/components/ExpressionCard";
import { browseByRegion, searchByConcept, getTopTags, getAllTagNames, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

const LIMIT = 20;
const HERO_IMAGES = new Set(["fr", "uk", "us", "au", "es", "tr", "it"]);

const REGION_LANG: Record<string, string> = {
  fr: "fr", uk: "en", us: "en", au: "en",
  es: "es", ar: "es", mx: "es", co: "es", cl: "es", pe: "es", cu: "es", ve: "es",
  tr: "tr", it: "it",
};

const REGION_GRADIENTS: Record<string, string> = {
  fr: "linear-gradient(135deg, #8da7c4 0%, #c5cfe8 40%, #d4a0a8 100%)",
  uk: "linear-gradient(135deg, #7a8fb5 0%, #b5c0d8 45%, #c49090 100%)",
  us: "linear-gradient(135deg, #7a90b8 0%, #aabbd8 45%, #c49898 100%)",
  au: "linear-gradient(135deg, #6e8ab5 0%, #9eb0d0 50%, #c09090 100%)",
  es: "linear-gradient(135deg, #c49090 0%, #d8b8a0 40%, #d4c070 100%)",
  tr: "linear-gradient(135deg, #c49090 0%, #d4a8a8 50%, #3a3a4a 100%)",
  it: "linear-gradient(135deg, #90b8a0 0%, #d8d8d8 45%, #c49090 100%)",
  ar: "linear-gradient(135deg, #74acdf 0%, #e8f0f8 50%, #74acdf 100%)",
  mx: "linear-gradient(135deg, #90b8a0 0%, #d8e8d8 45%, #c49090 100%)",
  default: "linear-gradient(135deg, #9090b8 0%, #b0a0c8 50%, #c8b0d8 100%)",
};

type UILang = "fr" | "en" | "es" | "tr" | "it";
type Mode = "country" | "explore";

const T: Record<UILang, {
  backHome: string;
  countryOnly: (name: string) => string;
  exploreAll: string;
  topConcepts: string;
  selectConcept: string;
  selectConceptSub: string;
  expressions: (n: number) => string;
  conceptLabel: (name: string) => string;
}> = {
  fr: {
    backHome: "← World Expressions",
    countryOnly: (name) => `${name} uniquement`,
    exploreAll: "Explorer toutes les langues",
    topConcepts: "Concepts populaires",
    selectConcept: "Comment le monde exprime les mêmes idées ?",
    selectConceptSub: "Choisissez un concept ci-dessus pour voir comment différentes cultures l'expriment.",
    expressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    conceptLabel: (name) => `"${name}" — toutes les langues`,
  },
  en: {
    backHome: "← World Expressions",
    countryOnly: (name) => `${name} only`,
    exploreAll: "Explore all languages",
    topConcepts: "Top concepts",
    selectConcept: "How does the world say the same thing?",
    selectConceptSub: "Pick a concept above to see how different cultures express it.",
    expressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    conceptLabel: (name) => `"${name}" — all languages`,
  },
  es: {
    backHome: "← World Expressions",
    countryOnly: (name) => `Solo ${name}`,
    exploreAll: "Explorar todos los idiomas",
    topConcepts: "Conceptos populares",
    selectConcept: "¿Cómo expresa el mundo las mismas ideas?",
    selectConceptSub: "Elige un concepto arriba para ver cómo distintas culturas lo expresan.",
    expressions: (n) => `${n} expresión${n > 1 ? "es" : ""}`,
    conceptLabel: (name) => `"${name}" — todos los idiomas`,
  },
  tr: {
    backHome: "← World Expressions",
    countryOnly: (name) => `Yalnızca ${name}`,
    exploreAll: "Tüm dilleri keşfet",
    topConcepts: "Popüler kavramlar",
    selectConcept: "Dünya aynı şeyi nasıl söylüyor?",
    selectConceptSub: "Farklı kültürlerin bunu nasıl ifade ettiğini görmek için yukarıdan bir kavram seçin.",
    expressions: (n) => `${n} deyim`,
    conceptLabel: (name) => `"${name}" — tüm diller`,
  },
  it: {
    backHome: "← World Expressions",
    countryOnly: (name) => `Solo ${name}`,
    exploreAll: "Esplora tutte le lingue",
    topConcepts: "Concetti popolari",
    selectConcept: "Come il mondo esprime le stesse idee?",
    selectConceptSub: "Scegli un concetto qui sopra per vedere come culture diverse lo esprimono.",
    expressions: (n) => `${n} espression${n > 1 ? "i" : "e"}`,
    conceptLabel: (name) => `"${name}" — tutte le lingue`,
  },
};

function CountryPageContent({ code }: { code: string }) {
  const [uiLang, setUILang] = useState<UILang>("en");
  const [mode, setMode] = useState<Mode>("country");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [topTags, setTopTags] = useState<{ slug: string; name: string }[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const lang = REGION_LANG[code] || "en";
  const flag = FLAG[code] || "🌍";
  const countryName = COUNTRY_NAME[code] || code.toUpperCase();
  const hasHeroImage = HERO_IMAGES.has(code);
  const t = T[uiLang];

  const heroBackground = hasHeroImage
    ? `url('/images/${code}.jpg') center/cover, ${REGION_GRADIENTS[code] || REGION_GRADIENTS.default}`
    : REGION_GRADIENTS[code] || REGION_GRADIENTS.default;

  // Restore uiLang from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames);
  }, [uiLang]);

  useEffect(() => {
    getTopTags(lang, 30, uiLang)
      .then((tags) => {
        const withEmoji = tags.filter((tag) => tagIcon(tag.slug)).slice(0, 10);
        setTopTags(withEmoji.map((tag) => ({ slug: tag.slug, name: tag.name })));
      })
      .catch(() => {});
  }, [lang, uiLang]);

  const doFetch = useCallback(
    async (currentMode: Mode, tag: string | null, offset: number) => {
      if (tag) {
        const regions = currentMode === "country" ? [code] : [];
        const r = await searchByConcept([tag], regions, LIMIT, offset);
        return { results: r.results, total: r.total };
      }
      if (currentMode === "explore") {
        // Empty regions array → backend returns all regions
        const r = await browseByRegion([], LIMIT, offset);
        return { results: r.results, total: r.total };
      }
      const r = await browseByRegion([code], LIMIT, offset);
      return { results: r.results, total: r.total };
    },
    [code]
  );

  const load = useCallback(
    async (currentMode: Mode, tag: string | null) => {
      // In explore mode without a tag, wait for user to pick a concept
      if (currentMode === "explore" && !tag) {
        setExpressions([]);
        setTotal(0);
        setHasMore(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      setExpressions([]);
      try {
        const data = await doFetch(currentMode, tag, 0);
        setExpressions(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setExpressions([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [doFetch]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const offset = expressions.length;
    try {
      const data = await doFetch(mode, activeTag, offset);
      setExpressions((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, expressions.length, mode, activeTag, doFetch]);

  // Initial load in country mode
  useEffect(() => {
    load("country", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setActiveTag(null);
    load(newMode, null);
  };

  const selectTag = (slug: string) => {
    const newTag = activeTag === slug ? null : slug;
    setActiveTag(newTag);
    load(mode, newTag);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <main className="min-h-screen" style={{ background: "#f5f3ff" }}>

      {/* ===== HERO ===== */}
      <div className="relative" style={{ minHeight: 220, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: heroBackground,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(10,4,28,0.5) 0%, rgba(10,4,28,0.28) 45%, rgba(10,4,28,0.68) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 2, padding: "1.5rem 2rem 2rem" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link
              href="/"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none", fontWeight: 500 }}
            >
              {t.backHome}
            </Link>
            <div style={{ display: "flex", gap: 4 }}>
              {(["fr", "en", "es", "tr", "it"] as UILang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setUILang(l); localStorage.setItem("wex_lang", l); }}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    border: "1.5px solid",
                    borderColor: uiLang === l ? "#a78bfa" : "rgba(255,255,255,0.25)",
                    background: uiLang === l ? "#7c3aed" : "rgba(255,255,255,0.08)",
                    color: uiLang === l ? "#fff" : "rgba(255,255,255,0.55)",
                    cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Country identity */}
          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: "0.4rem" }}>{flag}</div>
            <h1 style={{
              fontSize: 30, fontWeight: 800, color: "#fff", margin: 0,
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}>
              {countryName}
            </h1>
            {mode === "country" && total > 0 && !loading && (
              <p style={{ color: "rgba(255,255,255,0.58)", fontSize: 13, marginTop: "0.3rem" }}>
                {t.expressions(total)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODE TOGGLE + CONCEPT CHIPS ===== */}
      <div style={{ background: "#f5f3ff", padding: "1.5rem 1rem 1.25rem", borderBottom: "1px solid #ede9fe" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* Toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{
              display: "inline-flex", borderRadius: 14,
              background: "#ede9fe", padding: 4, gap: 2,
            }}>
              <button
                onClick={() => switchMode("country")}
                style={{
                  padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: mode === "country" ? "#7c3aed" : "transparent",
                  color: mode === "country" ? "#fff" : "#7c3aed",
                }}
              >
                {flag} {t.countryOnly(countryName)}
              </button>
              <button
                onClick={() => switchMode("explore")}
                style={{
                  padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: mode === "explore" ? "#7c3aed" : "transparent",
                  color: mode === "explore" ? "#fff" : "#7c3aed",
                }}
              >
                🌍 {t.exploreAll}
              </button>
            </div>
          </div>

          {/* Concept chips */}
          {topTags.length > 0 && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                letterSpacing: "0.07em", color: "#9ca3af", marginBottom: "0.6rem",
              }}>
                {t.topConcepts}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" }}>
                {topTags.map((tag) => {
                  const icon = tagIcon(tag.slug) || "🔍";
                  const isActive = activeTag === tag.slug;
                  return (
                    <button
                      key={tag.slug}
                      onClick={() => selectTag(tag.slug)}
                      style={{
                        fontSize: 13, padding: "6px 14px", borderRadius: 20,
                        background: isActive ? "#7c3aed" : "#fff",
                        border: `1.5px solid ${isActive ? "#7c3aed" : "#e9d5ff"}`,
                        color: isActive ? "#fff" : "#7c3aed",
                        cursor: "pointer", display: "inline-flex" as const,
                        alignItems: "center" as const, gap: "0.3rem",
                        fontWeight: 500,
                        boxShadow: isActive ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {icon} {tag.name}
                      {isActive && (
                        <span style={{ marginLeft: 2, opacity: 0.7, fontSize: 11 }}>×</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== RESULTS ===== */}
      <div ref={resultsRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem 3rem" }}>

        {/* Explore mode: empty state */}
        {mode === "explore" && !activeTag && !loading && (
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>🌍</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#4b5563", marginBottom: "0.4rem" }}>
              {t.selectConcept}
            </p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>
              {t.selectConceptSub}
            </p>
          </div>
        )}

        {/* Explore mode with concept: context label */}
        {mode === "explore" && activeTag && !loading && total > 0 && (
          <p style={{ textAlign: "right", fontSize: 13, color: "#9ca3af", marginBottom: "1rem" }}>
            {total} expression{total > 1 ? "s" : ""} — {t.conceptLabel(tagNames[activeTag] || activeTag)}
          </p>
        )}

        {/* Country mode: context label */}
        {mode === "country" && !loading && total > 0 && activeTag && (
          <p style={{ textAlign: "right", fontSize: 13, color: "#9ca3af", marginBottom: "1rem" }}>
            {total} expression{total > 1 ? "s" : ""} — {flag} {countryName} · {tagNames[activeTag] || activeTag}
          </p>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
            <div
              className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#ede9fe", borderTopColor: "#7c3aed" }}
            />
          </div>
        )}

        {/* Expression grid */}
        {expressions.length > 0 && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}>
              {expressions.map((expr, i) => (
                <div
                  key={expr.id}
                  style={{
                    animation: "fadeSlideUp 0.35s ease-out both",
                    animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms`,
                  }}
                >
                  <ExpressionCard
                    expression={expr}
                    onTagClick={selectTag}
                    uiLang={uiLang}
                    tagNames={tagNames}
                  />
                </div>
              ))}
            </div>
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#ede9fe", borderTopColor: "#7c3aed" }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f3ff" }}>
          <div style={{ color: "#c4b5fd", fontSize: "2rem" }}>…</div>
        </div>
      }
    >
      <CountryPageContent code={code} />
    </Suspense>
  );
}

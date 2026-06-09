"use client";

import { use, useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ExpressionCard from "@/components/ExpressionCard";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import {
  browseByRegion, searchExpressions, searchByConcept,
  getTopTags, getAllTagNames, getTypeCounts, Expression, TypeCounts,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { TYPE_LABELS } from "@/lib/typeLabels";

const LIMIT = 20;
const HERO_IMAGES = new Set(["fr", "uk", "us", "au", "es", "tr", "it", "de"]);

const COUNTRY_REGIONS: Record<string, { code: string; name: string; emoji: string; bg: string; accent: string; count: number }[]> = {
  fr: [
    { code: "alsace",   name: "Alsace",   emoji: "🥨", bg: "#f5ecd0", accent: "#7a4f1e", count: 35 },
    { code: "bretagne", name: "Bretagne", emoji: "🦞", bg: "#deeaf5", accent: "#1a3a5c", count: 40 },
  ],
};

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

type UILang = "fr" | "en" | "es" | "tr" | "it" | "de" | "ja";

const T: Record<UILang, {
  backHome: string;
  countryOnly: (name: string) => string;
  exploreAll: string;
  filterByConcept: string;
  filterByType: string;
  allTypes: string;
  searchPlaceholder: (name: string) => string;
  noResults: string;
  expressions: (n: number) => string;
  searchLabel: (q: string) => string;
  exploreByRegion: string;
}> = {
  fr: {
    backHome: "Accueil",
    countryOnly: (name) => `${name} uniquement`,
    exploreAll: "Explorer toutes les langues",
    filterByConcept: "Filtrer par concept",
    filterByType: "Filtrer par type",
    allTypes: "Tous",
    searchPlaceholder: (name) => `Chercher dans ${name}…`,
    noResults: "Aucun résultat.",
    expressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    searchLabel: (q) => `Résultats pour "${q}"`,
    exploreByRegion: "Explorer par région",
  },
  en: {
    backHome: "Home",
    countryOnly: (name) => `${name} only`,
    exploreAll: "Explore all languages",
    filterByConcept: "Filter by concept",
    filterByType: "Filter by type",
    allTypes: "All",
    searchPlaceholder: (name) => `Search in ${name}…`,
    noResults: "No results.",
    expressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    searchLabel: (q) => `Results for "${q}"`,
    exploreByRegion: "Explore by region",
  },
  es: {
    backHome: "Inicio",
    countryOnly: (name) => `Solo ${name}`,
    exploreAll: "Explorar todos los idiomas",
    filterByConcept: "Filtrar por concepto",
    filterByType: "Filtrar por tipo",
    allTypes: "Todos",
    searchPlaceholder: (name) => `Buscar en ${name}…`,
    noResults: "Sin resultados.",
    expressions: (n) => `${n} expresión${n > 1 ? "es" : ""}`,
    searchLabel: (q) => `Resultados para "${q}"`,
    exploreByRegion: "Explorar por región",
  },
  tr: {
    backHome: "Ana sayfa",
    countryOnly: (name) => `Yalnızca ${name}`,
    exploreAll: "Tüm dilleri keşfet",
    filterByConcept: "Kavrama göre filtrele",
    filterByType: "Türe göre filtrele",
    allTypes: "Tümü",
    searchPlaceholder: (name) => `${name}'de ara…`,
    noResults: "Sonuç yok.",
    expressions: (n) => `${n} deyim`,
    searchLabel: (q) => `"${q}" için sonuçlar`,
    exploreByRegion: "Bölgeye göre keşfet",
  },
  it: {
    backHome: "Home",
    countryOnly: (name) => `Solo ${name}`,
    exploreAll: "Esplora tutte le lingue",
    filterByConcept: "Filtra per concetto",
    filterByType: "Filtra per tipo",
    allTypes: "Tutti",
    searchPlaceholder: (name) => `Cerca in ${name}…`,
    noResults: "Nessun risultato.",
    expressions: (n) => `${n} espression${n > 1 ? "i" : "e"}`,
    searchLabel: (q) => `Risultati per "${q}"`,
    exploreByRegion: "Esplora per regione",
  },
  de: {
    backHome: "Startseite",
    countryOnly: (name) => `Nur ${name}`,
    exploreAll: "Alle Sprachen erkunden",
    filterByConcept: "Nach Konzept filtern",
    filterByType: "Nach Typ filtern",
    allTypes: "Alle",
    searchPlaceholder: (name) => `In ${name} suchen…`,
    noResults: "Keine Ergebnisse.",
    expressions: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""}`,
    searchLabel: (q) => `Ergebnisse für „${q}"`,
    exploreByRegion: "Nach Region erkunden",
  },
  ja: {
    backHome: "ホーム",
    countryOnly: (name) => `${name}のみ`,
    exploreAll: "すべての言語を探索",
    filterByConcept: "概念で絞り込む",
    filterByType: "タイプで絞り込む",
    allTypes: "すべて",
    searchPlaceholder: (name) => `${name}内を検索…`,
    noResults: "結果がありません。",
    expressions: (n) => `${n}件の表現`,
    searchLabel: (q) => `「${q}」の結果`,
    exploreByRegion: "地域別に探索",
  },
};

function CountryPageContent({ code }: { code: string }) {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("en");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [topTags, setTopTags] = useState<{ slug: string; name: string }[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [typeCounts, setTypeCounts] = useState<TypeCounts>({ idiom: 0, proverb: 0, locution: 0, word: 0 });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const lang = REGION_LANG[code] || "en";
  const flag = FLAG[code] || "🌍";
  const countryName = COUNTRY_NAME[code] || code.toUpperCase();
  const hasHeroImage = HERO_IMAGES.has(code);
  const t = T[uiLang];

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr", "de", "ja"];
    if (stored && valid.includes(stored)) setUILang(stored);
  }, []);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
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

  const fetchTypeCounts = useCallback(
    async (tag: string | null, query: string | null) => {
      const counts = await getTypeCounts([code], tag ? [tag] : [], query ?? "").catch(() => null);
      if (counts) setTypeCounts(counts);
    },
    [code]
  );

  useEffect(() => {
    fetchTypeCounts(activeTag, searchQuery);
  }, [activeTag, searchQuery, fetchTypeCounts]);

  const doFetch = useCallback(
    async (tag: string | null, query: string | null, offset: number, tf: string | null = null) => {
      const typeParam = tf || undefined;
      if (query && query.trim()) {
        const r = await searchExpressions(query.trim(), [code], LIMIT, offset, typeParam, uiLang);
        return { results: r.results, total: r.total };
      }
      if (tag) {
        const r = await searchByConcept([tag], [code], LIMIT, offset, typeParam, uiLang);
        return { results: r.results, total: r.total };
      }
      const r = await browseByRegion([code], LIMIT, offset, typeParam, uiLang);
      return { results: r.results, total: r.total };
    },
    [code, uiLang]
  );

  const load = useCallback(
    async (tag: string | null, query: string | null, tf: string | null = null) => {
      setLoading(true);
      setExpressions([]);
      try {
        const data = await doFetch(tag, query, 0, tf);
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
      const data = await doFetch(activeTag, searchQuery, offset, typeFilter);
      setExpressions((prev) => [...prev, ...data.results]);
      setHasMore(offset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, expressions.length, activeTag, searchQuery, typeFilter, doFetch]);

  useEffect(() => {
    load(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const selectTag = (slug: string) => {
    const newTag = activeTag === slug ? null : slug;
    setActiveTag(newTag);
    setSearchInput("");
    setSearchQuery(null);
    load(newTag, null, typeFilter);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) {
      setSearchQuery(null);
      load(activeTag, null, typeFilter);
      return;
    }
    setActiveTag(null);
    setSearchQuery(q);
    load(null, q, typeFilter);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery(null);
    load(activeTag, null, typeFilter);
  };

  const selectTypeFilter = (newType: string | null) => {
    setTypeFilter(newType);
    load(activeTag, searchQuery, newType);
  };

  const goExploreAll = () => {
    const q = searchInput.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

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
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-softer)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ← {t.backHome}
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            {flag} {countryName}
          </span>
          <div style={{ width: 48 }} />
        </div>

        {/* Hero */}
        <div
          className={`country-photo country-photo-hero${hasHeroImage ? " fade-bottom" : ""}`}
          style={{
            minHeight: 220,
            ...(hasHeroImage
              ? ({ "--photo": `url('/images/${code}.jpg')` } as React.CSSProperties)
              : { background: REGION_GRADIENTS[code] || REGION_GRADIENTS.default }),
          }}
        >
          <div style={{ padding: "1.25rem 2rem 3rem" }}>
            {/* Desktop breadcrumb */}
            <div className="wex-atlas-card">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
                <Link href="/" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
                  ← {t.backHome}
                </Link>
              </p>
            </div>

            {/* Country identity */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <div style={{ fontSize: 52, lineHeight: 1, marginBottom: "0.4rem" }}>{flag}</div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                textShadow: "0 2px 16px rgba(28,20,16,0.5)",
              }}>
                {countryName}
              </h1>
              {total > 0 && !loading && !searchQuery && !activeTag && (
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: "0.35rem", fontFamily: "var(--font-body)" }}>
                  {t.expressions(total)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Regions — France only */}
        {COUNTRY_REGIONS[code] && (
          <div style={{ background: "var(--paper)", padding: "1.25rem 1rem 1rem", borderBottom: "1px solid var(--paper-edge)" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: "0.75rem",
                fontFamily: "var(--font-body)",
              }}>
                {t.exploreByRegion}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.75rem" }}>
                {COUNTRY_REGIONS[code].map((region) => (
                  <Link
                    key={region.code}
                    href={`/regions/${region.code}`}
                    style={{
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "flex-start" as const,
                      gap: "0.5rem",
                      padding: "1.25rem 1.5rem 1rem",
                      borderRadius: "var(--r-lg)",
                      textDecoration: "none",
                      background: region.bg,
                      boxShadow: "0 1px 6px rgba(28,20,16,0.08)",
                      minWidth: 160,
                      transition: "transform 150ms ease, box-shadow 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-4px)";
                      el.style.boxShadow = "0 10px 28px rgba(28,20,16,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "0 1px 6px rgba(28,20,16,0.08)";
                    }}
                  >
                    <span style={{ fontSize: 36, lineHeight: 1 }}>{region.emoji}</span>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 17,
                      fontWeight: 700,
                      color: region.accent,
                      lineHeight: 1.2,
                    }}>
                      {region.name}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: region.accent,
                      opacity: 0.7,
                      fontWeight: 500,
                    }}>
                      {t.expressions(region.count)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ background: "var(--paper)", padding: "1.5rem 1rem 1.25rem", borderBottom: "1px solid var(--paper-edge)" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: "1.25rem", position: "relative" }}>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchPlaceholder(countryName)}
                className="wex-input"
                style={{
                  width: "100%", padding: "10px 44px 10px 16px",
                  borderRadius: "var(--r-pill)", border: "1.5px solid var(--paper-edge)",
                  background: "var(--paper)", fontSize: 14, color: "var(--ink)",
                  boxSizing: "border-box",
                  boxShadow: searchQuery ? `0 0 0 2px var(--plum-soft)` : "none",
                  transition: "box-shadow 0.15s",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px var(--plum-soft)`; }}
                onBlur={(e) => { if (!searchQuery) e.currentTarget.style.boxShadow = "none"; }}
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 16, color: "var(--ink-faint)", padding: 4,
                  }}
                >
                  ×
                </button>
              ) : (
                <button
                  type="submit"
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "var(--plum-soft)", padding: 4,
                  }}
                >
                  🔍
                </button>
              )}
            </form>

            {/* Concept chips */}
            {topTags.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                  letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: "0.6rem",
                  fontFamily: "var(--font-body)",
                }}>
                  {t.filterByConcept}
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
                          fontSize: 13, padding: "6px 14px", borderRadius: "var(--r-pill)",
                          background: isActive ? "var(--plum)" : "var(--paper)",
                          border: `1.5px solid ${isActive ? "var(--plum)" : "var(--paper-edge)"}`,
                          color: isActive ? "#fff" : "var(--plum)",
                          cursor: "pointer", display: "inline-flex" as const,
                          alignItems: "center" as const, gap: "0.3rem",
                          fontWeight: 500,
                          boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                          transition: "all 0.15s",
                          fontFamily: "var(--font-body)",
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

            {/* Type filter pills */}
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: "0.6rem",
                fontFamily: "var(--font-body)",
              }}>
                {t.filterByType}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" }}>
                {([null, "idiom", "proverb", "locution", "word"] as const).map((type) => {
                  const isActive = typeFilter === type;
                  const baseLabel = type === null
                    ? t.allTypes
                    : (TYPE_LABELS[type]?.[uiLang] ?? TYPE_LABELS[type]?.["en"] ?? type);
                  const count = type !== null ? typeCounts[type] : null;
                  const label = count !== null && count > 0 ? `${baseLabel} (${count})` : baseLabel;
                  return (
                    <button
                      key={type ?? "all"}
                      onClick={() => selectTypeFilter(type)}
                      style={{
                        fontSize: 13, padding: "6px 14px", borderRadius: "var(--r-pill)",
                        background: isActive ? "var(--terra)" : "var(--paper)",
                        border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                        color: isActive ? "#fff" : "var(--terra)",
                        cursor: "pointer", fontWeight: 500,
                        boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                        transition: "all 0.15s",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem 3rem" }}>

          {/* Context label */}
          {!loading && total > 0 && (searchQuery || activeTag) && (
            <p style={{ textAlign: "right", fontSize: 13, color: "var(--ink-faint)", marginBottom: "1rem", fontFamily: "var(--font-body)" }}>
              {searchQuery
                ? `${total} expression${total > 1 ? "s" : ""} — ${t.searchLabel(searchQuery)}`
                : `${total} expression${total > 1 ? "s" : ""} — ${flag} ${countryName} · ${tagNames[activeTag!] || activeTag!}`
              }
            </p>
          )}

          {/* Loading spinner */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--plum-bg)", borderTopColor: "var(--plum)" }}
              />
            </div>
          )}

          {/* No results (search/filter active) */}
          {!loading && expressions.length === 0 && (searchQuery || activeTag) && (
            <div style={{ textAlign: "center", marginTop: "4rem", color: "var(--ink-faint)" }}>
              <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>🔍</div>
              <p style={{ fontSize: 16, fontFamily: "var(--font-body)" }}>{t.noResults}</p>
            </div>
          )}

          {/* No expressions for this country yet */}
          {!loading && total === 0 && !searchQuery && !activeTag && (
            <div style={{ textAlign: "center", marginTop: "5rem", color: "var(--ink-faint)" }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>{flag}</div>
              <p style={{ fontSize: 17, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--ink-soft)", marginBottom: "0.5rem" }}>
                {countryName}
              </p>
              <p style={{ fontSize: 14, fontFamily: "var(--font-body)", marginBottom: "1.5rem" }}>
                {uiLang === "fr"
                  ? "Aucune expression disponible pour ce pays pour l'instant."
                  : uiLang === "es"
                  ? "No hay expresiones disponibles para este país por ahora."
                  : uiLang === "it"
                  ? "Nessuna espressione disponibile per questo paese al momento."
                  : uiLang === "tr"
                  ? "Bu ülke için henüz ifade bulunmuyor."
                  : "No expressions available for this country yet."}
              </p>
              <button
                onClick={goExploreAll}
                style={{
                  padding: "10px 22px", borderRadius: "var(--r-pill)",
                  background: "var(--plum)", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                🌍 {t.exploreAll}
              </button>
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
                    style={{ borderColor: "var(--plum-bg)", borderTopColor: "var(--plum)" }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
          <div style={{ color: "var(--plum-soft)", fontSize: "2rem" }}>…</div>
        </div>
      }
    >
      <CountryPageContent code={code} />
    </Suspense>
  );
}

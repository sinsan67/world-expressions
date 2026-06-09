"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import ExpressionCard from "@/components/ExpressionCard";
import { tagIcon } from "@/lib/tagIcons";
import { searchByDomain, getConcepts, getAllTagNames, getRegions, getFacets, ConceptItem, Expression, Facets } from "@/lib/api";
import { EDITORIAL_DOMAIN_MAP } from "@/lib/editorialDomains";
import { TYPE_LABELS } from "@/lib/typeLabels";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";

const LIMIT = 30;
const CONCEPTS_PREVIEW = 6;

const T: Record<UILang, {
  back: string;
  loading: string;
  loadMore: string;
  noResults: string;
  allDisplayed: (n: number) => string;
  concepts: string;
  expressions: string;
  nExpressions: (n: number) => string;
  showMore: (n: number) => string;
  showLess: string;
  filterByType: string;
  allTypes: string;
  allCountries: string;
}> = {
  fr: {
    back: "Accueil",
    loading: "Chargement…",
    loadMore: "Voir plus",
    noResults: "Aucune expression trouvée.",
    allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} au total`,
    concepts: "Thèmes",
    expressions: "Expressions",
    nExpressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    showMore: (n) => `Voir les ${n} autres →`,
    showLess: "Voir moins",
    filterByType: "Filtrer par type",
    allTypes: "Tous",
    allCountries: "Tous les pays",
  },
  en: {
    back: "Home",
    loading: "Loading…",
    loadMore: "Load more",
    noResults: "No expressions found.",
    allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} in total`,
    concepts: "Themes",
    expressions: "Expressions",
    nExpressions: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    showMore: (n) => `Show ${n} more →`,
    showLess: "Show less",
    filterByType: "Filter by type",
    allTypes: "All",
    allCountries: "All countries",
  },
  es: {
    back: "Inicio",
    loading: "Cargando…",
    loadMore: "Ver más",
    noResults: "No se encontraron expresiones.",
    allDisplayed: (n) => `${n} expresion${n > 1 ? "es" : ""} en total`,
    concepts: "Temas",
    expressions: "Expresiones",
    nExpressions: (n) => `${n} expresion${n > 1 ? "es" : ""}`,
    showMore: (n) => `Ver ${n} más →`,
    showLess: "Ver menos",
    filterByType: "Filtrar por tipo",
    allTypes: "Todos",
    allCountries: "Todos los países",
  },
  it: {
    back: "Home",
    loading: "Caricamento…",
    loadMore: "Carica altri",
    noResults: "Nessuna espressione trovata.",
    allDisplayed: (n) => `${n} esprssion${n > 1 ? "i" : "e"} in totale`,
    concepts: "Temi",
    expressions: "Espressioni",
    nExpressions: (n) => `${n} espression${n > 1 ? "i" : "e"}`,
    showMore: (n) => `Vedi altri ${n} →`,
    showLess: "Vedi meno",
    filterByType: "Filtra per tipo",
    allTypes: "Tutti",
    allCountries: "Tutti i paesi",
  },
  tr: {
    back: "Ana sayfa",
    loading: "Yükleniyor…",
    loadMore: "Daha fazla göster",
    noResults: "Deyim bulunamadı.",
    allDisplayed: (n) => `Toplam ${n} deyim`,
    concepts: "Temalar",
    expressions: "Deyimler",
    nExpressions: (n) => `${n} deyim`,
    showMore: (n) => `${n} tanesini daha gör →`,
    showLess: "Daha az göster",
    filterByType: "Türe göre filtrele",
    allTypes: "Tümü",
    allCountries: "Tüm ülkeler",
  },
  de: {
    back: "Startseite",
    loading: "Laden…",
    loadMore: "Mehr laden",
    noResults: "Keine Ausdrücke gefunden.",
    allDisplayed: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} insgesamt`,
    concepts: "Themen",
    expressions: "Ausdrücke",
    nExpressions: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""}`,
    showMore: (n) => `${n} weitere anzeigen →`,
    showLess: "Weniger anzeigen",
    filterByType: "Nach Typ filtern",
    allTypes: "Alle",
    allCountries: "Alle Länder",
  },
  ja: {
    back: "ホーム",
    loading: "読み込み中…",
    loadMore: "もっと見る",
    noResults: "表現が見つかりません。",
    allDisplayed: (n) => `合計${n}件の表現`,
    concepts: "テーマ",
    expressions: "表現",
    nExpressions: (n) => `${n}件の表現`,
    showMore: (n) => `他${n}件を見る →`,
    showLess: "少なく表示",
    filterByType: "タイプで絞り込む",
    allTypes: "すべて",
    allCountries: "すべての国",
  },
};

export default function DomainPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const domain = EDITORIAL_DOMAIN_MAP[slug];

  const [uiLang, setUILang] = useState<UILang>("en");
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [conceptsExpanded, setConceptsExpanded] = useState(false);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [facets, setFacets] = useState<Facets | undefined>(undefined);
  const [regions, setRegions] = useState<{ code: string }[]>([]);
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr", "de", "ja"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getRegions().then((data) => setRegions(data.map((r) => ({ code: r.code }))));
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Fetch concepts and initial expressions
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    setTypeFilter(null);
    setConceptsExpanded(false);

    Promise.all([
      getConcepts(uiLang, "", slug, 1),
      searchByDomain(slug, [], LIMIT, 0, uiLang),
      getAllTagNames(uiLang),
    ])
      .then(([conceptsData, exprData, names]) => {
        setConcepts(conceptsData.concepts);
        setExpressions(exprData.results);
        setTotal(exprData.total);
        setOffset(LIMIT);
        setTagNames(names);
        getFacets([], "", null).then(setFacets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, uiLang]);

  const applyTypeFilter = useCallback(async (newType: string | null) => {
    setTypeFilter(newType);
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    try {
      const data = await searchByDomain(slug, filterRegions, LIMIT, 0, uiLang, newType ?? undefined);
      setExpressions(data.results);
      setTotal(data.total);
      setOffset(LIMIT);
      getFacets(filterRegions, "", newType).then(setFacets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [slug, filterRegions, uiLang]);

  const applyCountryFilter = useCallback(async (newRegions: string[]) => {
    setFilterRegions(newRegions);
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    try {
      const data = await searchByDomain(slug, newRegions, LIMIT, 0, uiLang, typeFilter ?? undefined);
      setExpressions(data.results);
      setTotal(data.total);
      setOffset(LIMIT);
      getFacets(newRegions, "", typeFilter).then(setFacets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [slug, typeFilter, uiLang]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await searchByDomain(slug, filterRegions, LIMIT, offset, uiLang, typeFilter ?? undefined);
      setExpressions((prev) => [...prev, ...data.results]);
      setOffset((o) => o + LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [slug, offset, filterRegions, loadingMore, uiLang, typeFilter]);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  // Unknown domain → redirect home
  useEffect(() => {
    if (slug && !domain) router.replace("/");
  }, [slug, domain, router]);

  if (!domain) return null;

  const t = T[uiLang];
  const hasMore = expressions.length < total;
  const visibleConcepts = conceptsExpanded ? concepts : concepts.slice(0, CONCEPTS_PREVIEW);
  const hiddenCount = concepts.length - CONCEPTS_PREVIEW;

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
            ← {t.back}
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--plum)" }}>
            {domain.labels[uiLang]}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

          {/* Breadcrumb */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>{t.back}</Link>
              {" › "}
              <span style={{ color: "var(--ink)" }}>{domain.labels[uiLang]}</span>
            </p>
          </div>

          {/* Domain header */}
          <div
            style={{
              background: domain.bg,
              border: `1px solid ${domain.border}`,
              borderRadius: 20,
              padding: "1.75rem 1.75rem 1.5rem",
              marginBottom: "2rem",
              animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both",
            }}
          >
            <span style={{ fontSize: 48, lineHeight: 1, display: "block", marginBottom: "0.75rem" }}>
              {domain.emoji}
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              color: "var(--ink)",
              margin: "0 0 0.4rem",
              lineHeight: 1.15,
            }}>
              {domain.labels[uiLang]}
            </h1>
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: 17,
              color: "var(--ink-softer)",
              margin: 0,
            }}>
              {domain.desc[uiLang]}
            </p>
            {!loading && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ink-faint)",
                margin: "0.75rem 0 0",
              }}>
                {t.nExpressions(total)}
              </p>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--plum-bg)", borderTopColor: "var(--plum)" }}
              />
            </div>
          ) : (
            <>
              {/* Concept chips — collapsed by default */}
              {concepts.length > 0 && (
                <section style={{ marginBottom: "1.75rem" }}>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--ink-faint)",
                    marginBottom: "0.6rem",
                    fontFamily: "var(--font-body)",
                  }}>
                    {t.concepts}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {visibleConcepts.map((c) => {
                      const icon = tagIcon(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => router.push(`/search?concept=${encodeURIComponent(c.slug)}`)}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            padding: "6px 14px",
                            borderRadius: "var(--r-pill)",
                            border: "1.5px solid var(--paper-edge)",
                            background: "var(--paper)",
                            color: "var(--plum)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontWeight: 500,
                            boxShadow: "none",
                            transition: "all 120ms ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "var(--plum)";
                            el.style.background = "var(--plum-bg)";
                            el.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "var(--paper-edge)";
                            el.style.background = "var(--paper)";
                            el.style.transform = "translateY(0)";
                          }}
                        >
                          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
                          <span>{c.name}</span>
                          {c.count > 0 && (
                            <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{c.count}</span>
                          )}
                        </button>
                      );
                    })}

                    {/* Show more / less button */}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setConceptsExpanded((e) => !e)}
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          padding: "6px 14px",
                          borderRadius: "var(--r-pill)",
                          border: "1.5px dashed var(--paper-edge)",
                          background: "transparent",
                          color: "var(--ink-softer)",
                          cursor: "pointer",
                          fontWeight: 500,
                          transition: "all 120ms ease",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--plum)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-softer)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--paper-edge)"; }}
                      >
                        {conceptsExpanded ? t.showLess : t.showMore(hiddenCount)}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Type filter pills */}
              <section style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>

                  {/* Country dropdown */}
                  <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: "var(--r-pill)",
                        border: `1.5px solid ${filterRegions.length > 0 ? "var(--plum)" : "var(--paper-edge)"}`,
                        background: filterRegions.length > 0 ? "rgba(107,77,143,0.08)" : "var(--paper)",
                        color: filterRegions.length > 0 ? "var(--plum)" : "var(--ink-soft)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-body)", transition: "all 0.15s",
                      }}
                    >
                      {filterRegions.length === 0
                        ? t.allCountries
                        : filterRegions.map((c) => FLAG[c] ?? c.toUpperCase()).join(" ")}
                      <span style={{ fontSize: 9, opacity: 0.5 }}>{dropdownOpen ? "▲" : "▼"}</span>
                    </button>
                    {dropdownOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
                        background: "var(--paper)", border: "1px solid var(--paper-edge)",
                        borderRadius: 10, padding: "0.4rem 0", minWidth: 180,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                          <input type="checkbox" checked={filterRegions.length === 0}
                            onChange={() => { applyCountryFilter([]); setDropdownOpen(false); }}
                            style={{ accentColor: "var(--plum)", width: 14, height: 14 }} />
                          {t.allCountries}
                        </label>
                        <div style={{ height: 1, background: "var(--paper-edge)", margin: "0.2rem 0" }} />
                        {regions.map((r) => {
                          const cnt = facets?.region[r.code];
                          return (
                            <label key={r.code} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                              <input type="checkbox" checked={filterRegions.includes(r.code)}
                                onChange={() => {
                                  const next = filterRegions.includes(r.code)
                                    ? filterRegions.filter((c) => c !== r.code)
                                    : [...filterRegions, r.code];
                                  applyCountryFilter(next);
                                }}
                                style={{ accentColor: "var(--plum)", width: 14, height: 14 }} />
                              <span style={{ flex: 1 }}>{FLAG[r.code] ?? ""} {COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}</span>
                              {cnt != null && <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>({cnt})</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div style={{ width: 1, height: 18, background: "var(--paper-edge)", flexShrink: 0, margin: "0 0.1rem" }} />

                  {/* Type pills */}
                  {([null, "idiom", "proverb", "locution"] as const).map((type) => {
                    const isActive = typeFilter === type;
                    const label = type === null
                      ? t.allTypes
                      : (TYPE_LABELS[type]?.[uiLang] ?? TYPE_LABELS[type]?.["en"] ?? type);
                    const cnt = type !== null ? facets?.kind[type] : undefined;
                    return (
                      <button
                        key={type ?? "all"}
                        onClick={() => applyTypeFilter(type)}
                        style={{
                          fontSize: 13,
                          padding: "6px 14px",
                          borderRadius: "var(--r-pill)",
                          background: isActive ? "var(--terra)" : "var(--paper)",
                          border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                          color: isActive ? "#fff" : "var(--terra)",
                          cursor: "pointer",
                          fontWeight: 500,
                          boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                          transition: "all 0.15s",
                          fontFamily: "var(--font-body)",
                          display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                      >
                        <span>{label}</span>
                        {cnt != null && <span style={{ fontSize: 11, opacity: isActive ? 0.85 : 0.55 }}>({cnt})</span>}
                      </button>
                    );
                  })}
                </div>
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
                  {t.expressions}
                </p>

                {expressions.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>
                    {t.noResults}
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
                          animation: "fadeSlideUp 0.35s ease-out both",
                          animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms`,
                        }}
                      >
                        <ExpressionCard
                          expression={expr}
                          onTagClick={(tag) => router.push(`/search?concept=${encodeURIComponent(tag)}`)}
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
                          el.style.borderColor = "var(--plum)";
                          el.style.color = "var(--plum)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "var(--paper-edge)";
                        el.style.color = "var(--ink)";
                      }}
                    >
                      {loadingMore ? t.loading : t.loadMore}
                    </button>
                  ) : expressions.length > 0 && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)" }}>
                      {t.allDisplayed(total)}
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

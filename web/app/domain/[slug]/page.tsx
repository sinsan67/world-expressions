"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import ExpressionCard from "@/components/ExpressionCard";
import { tagIcon } from "@/lib/tagIcons";
import { searchByDomain, getConcepts, getAllTagNames, ConceptItem, Expression } from "@/lib/api";
import { EDITORIAL_DOMAIN_MAP } from "@/lib/editorialDomains";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const LIMIT = 30;

const T: Record<UILang, {
  back: string;
  loading: string;
  loadMore: string;
  noResults: string;
  allDisplayed: (n: number) => string;
  concepts: string;
  expressions: string;
  nExpressions: (n: number) => string;
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
  },
};

export default function DomainPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const domain = EDITORIAL_DOMAIN_MAP[slug];

  const [uiLang, setUILang] = useState<UILang>("en");
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr"].includes(stored)) setUILang(stored);
  }, []);

  // Fetch concepts and initial expressions
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setExpressions([]);
    setOffset(0);

    Promise.all([
      getConcepts(uiLang, "", slug, 1),
      searchByDomain(slug, [], LIMIT, 0),
      getAllTagNames(uiLang),
    ])
      .then(([conceptsData, exprData, names]) => {
        setConcepts(conceptsData.concepts);
        setExpressions(exprData.results);
        setTotal(exprData.total);
        setOffset(LIMIT);
        setTagNames(names);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, uiLang]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await searchByDomain(slug, [], LIMIT, offset);
      setExpressions((prev) => [...prev, ...data.results]);
      setOffset((o) => o + LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [slug, offset, loadingMore]);

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
            <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>
              {t.loading}
            </p>
          ) : (
            <>
              {/* Concept pills */}
              {concepts.length > 0 && (
                <section style={{ marginBottom: "2rem" }}>
                  <h2 style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--plum)",
                    marginBottom: "0.75rem",
                  }}>
                    {t.concepts}
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {concepts.map((c) => {
                      const icon = tagIcon(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => router.push(`/search?concept=${encodeURIComponent(c.slug)}`)}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            padding: "5px 12px",
                            borderRadius: "var(--r-pill)",
                            border: "1.5px solid var(--paper-edge)",
                            background: "var(--paper)",
                            color: "var(--ink)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "var(--shadow-postcard)",
                            transition: "all 120ms ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "var(--plum)";
                            el.style.color = "var(--plum)";
                            el.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "var(--paper-edge)";
                            el.style.color = "var(--ink)";
                            el.style.transform = "translateY(0)";
                          }}
                        >
                          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{c.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Expression list */}
              <section>
                <h2 style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--plum)",
                  marginBottom: "1rem",
                }}>
                  {t.expressions}
                </h2>

                {expressions.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>
                    {t.noResults}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {expressions.map((expr) => (
                      <ExpressionCard
                        key={expr.id}
                        expression={expr}
                        onTagClick={(tag) => router.push(`/search?concept=${encodeURIComponent(tag)}`)}
                        uiLang={uiLang}
                        tagNames={tagNames}
                      />
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

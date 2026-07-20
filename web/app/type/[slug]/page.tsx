"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import ExpressionCard from "@/components/ExpressionCard";
import PlayWithCardsCta from "@/components/PlayWithCardsCta";
import ResultsFilterBar from "@/components/home/ResultsFilterBar";
import { browseByCountry, getCountries, getAllTagNames, getFacets, Expression, Facets } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { useUILangContext } from "@/lib/UILangContext";
import type { UILang } from "@/lib/useUILang";

const LIMIT = 30;

const TYPE_META: Record<string, {
  emoji: string;
  labels: Record<UILang, string>;
  desc: Record<UILang, string>;
}> = {
  proverb: {
    emoji: "📜",
    labels: { fr: "Proverbes", en: "Proverbs", es: "Proverbios", it: "Proverbi", tr: "Atasözleri", de: "Sprichwörter", ja: "ことわざ" },
    desc: { fr: "La sagesse populaire en quelques mots.", en: "Popular wisdom distilled into a few words.", es: "La sabiduría popular en pocas palabras.", it: "La saggezza popolare in poche parole.", tr: "Halk bilgeliği birkaç kelimeyle.", de: "Volksweisheit in wenigen Worten.", ja: "民衆の知恵を凝縮した言葉。" },
  },
  word: {
    emoji: "📖",
    labels: { fr: "Mots", en: "Words", es: "Palabras", it: "Parole", tr: "Kelimeler", de: "Wörter", ja: "言葉" },
    desc: { fr: "Des mots qui portent une culture.", en: "Words that carry an entire culture.", es: "Palabras que llevan una cultura.", it: "Parole che portano una cultura.", tr: "Bir kültürü taşıyan kelimeler.", de: "Wörter, die eine ganze Kultur tragen.", ja: "文化を担う言葉。" },
  },
  locution: {
    emoji: "🔤",
    labels: { fr: "Locutions", en: "Set phrases", es: "Locuciones", it: "Locuzioni", tr: "Deyimler", de: "Feste Wendungen", ja: "成句" },
    desc: { fr: "Formules figées aux sens bien précis.", en: "Fixed phrases with precise meanings.", es: "Fórmulas fijas con significados precisos.", it: "Formule fisse con significati precisi.", tr: "Kesin anlamlı kalıp ifadeler.", de: "Feste Ausdrücke mit präzisen Bedeutungen.", ja: "正確な意味を持つ固定表現。" },
  },
};

const T: Record<UILang, {
  back: string;
  loading: string;
  loadMore: string;
  noResults: string;
  allDisplayed: (n: number) => string;
  expressions: string;
  nExpressions: (n: number) => string;
  allCountries: string;
}> = {
  fr: { back: "Accueil", loading: "Chargement…", loadMore: "Voir plus", noResults: "Aucune expression trouvée.", allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} au total`, expressions: "Expressions", nExpressions: (n) => `${n} expression${n > 1 ? "s" : ""}`, allCountries: "Tous les pays" },
  en: { back: "Home", loading: "Loading…", loadMore: "Load more", noResults: "No expressions found.", allDisplayed: (n) => `${n} expression${n > 1 ? "s" : ""} in total`, expressions: "Expressions", nExpressions: (n) => `${n} expression${n > 1 ? "s" : ""}`, allCountries: "All countries" },
  es: { back: "Inicio", loading: "Cargando…", loadMore: "Ver más", noResults: "No se encontraron expresiones.", allDisplayed: (n) => `${n} expresion${n > 1 ? "es" : ""} en total`, expressions: "Expresiones", nExpressions: (n) => `${n} expresion${n > 1 ? "es" : ""}`, allCountries: "Todos los países" },
  it: { back: "Home", loading: "Caricamento…", loadMore: "Carica altri", noResults: "Nessuna espressione trovata.", allDisplayed: (n) => `${n} espression${n > 1 ? "i" : "e"} in totale`, expressions: "Espressioni", nExpressions: (n) => `${n} espression${n > 1 ? "i" : "e"}`, allCountries: "Tutti i paesi" },
  tr: { back: "Ana sayfa", loading: "Yükleniyor…", loadMore: "Daha fazla göster", noResults: "Deyim bulunamadı.", allDisplayed: (n) => `Toplam ${n} deyim`, expressions: "Deyimler", nExpressions: (n) => `${n} deyim`, allCountries: "Tüm ülkeler" },
  de: { back: "Startseite", loading: "Laden…", loadMore: "Mehr laden", noResults: "Keine Ausdrücke gefunden.", allDisplayed: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""} insgesamt`, expressions: "Ausdrücke", nExpressions: (n) => `${n} Ausdruck${n !== 1 ? "...ausdrücke".slice(3) : ""}`, allCountries: "Alle Länder" },
  ja: { back: "ホーム", loading: "読み込み中…", loadMore: "もっと見る", noResults: "表現が見つかりません。", allDisplayed: (n) => `合計${n}件の表現`, expressions: "表現", nExpressions: (n) => `${n}件の表現`, allCountries: "すべての国" },
};

function TypePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const initialCountry = searchParams.get("country") ?? "";

  const meta = TYPE_META[slug];

  const { uiLang } = useUILangContext();
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [facets, setFacets] = useState<Facets | undefined>(undefined);
  const [countries, setCountries] = useState<{ code: string; label: string }[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>(
    initialCountry ? initialCountry.split(",").filter(Boolean) : []
  );

  useEffect(() => {
    getCountries().then((data) => setCountries(data.map((c) => ({ code: c.code, label: `${FLAG[c.code] ?? "🌍"} ${COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}` }))));
  }, []);

  useEffect(() => {
    if (!slug || !meta) return;
    let active = true;
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    Promise.all([
      browseByCountry(filterCountries, LIMIT, 0, slug, uiLang),
      getAllTagNames(uiLang),
    ])
      .then(([exprData, names]) => {
        if (!active) return;
        setExpressions(exprData.results);
        setTotal(exprData.total);
        setOffset(LIMIT);
        setTagNames(names);
        getFacets(filterCountries, "", slug, "", uiLang).then((f) => { if (active) setFacets(f); });
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, uiLang]);

  const applyCountryFilter = useCallback(async (newCountries: string[]) => {
    setFilterCountries(newCountries);
    setLoading(true);
    setExpressions([]);
    setOffset(0);
    try {
      const data = await browseByCountry(newCountries, LIMIT, 0, slug, uiLang);
      setExpressions(data.results);
      setTotal(data.total);
      setOffset(LIMIT);
      getFacets(newCountries, "", slug, "", uiLang).then(setFacets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [slug, uiLang]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await browseByCountry(filterCountries, LIMIT, offset, slug, uiLang);
      setExpressions((prev) => [...prev, ...data.results]);
      setOffset((o) => o + LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [slug, offset, filterCountries, loadingMore, uiLang]);

  useEffect(() => {
    if (slug && !meta) router.replace("/");
  }, [slug, meta, router]);

  if (!meta) return null;

  const t = T[uiLang];
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
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-softer)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ← {t.back}
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            {meta.labels[uiLang]}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

          {/* Breadcrumb */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>{t.back}</Link>
              {" › "}
              <span style={{ color: "var(--ink)" }}>{meta.labels[uiLang]}</span>
            </p>
          </div>

          {/* Type header */}
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
              {meta.emoji}
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              color: "var(--ink)",
              margin: "0 0 0.4rem",
              lineHeight: 1.15,
            }}>
              {meta.labels[uiLang]}
            </h1>
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: 17,
              color: "var(--ink-softer)",
              margin: 0,
            }}>
              {meta.desc[uiLang]}
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
                  facets={facets}
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
                          height: "100%",
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

      {/* Context = this type (+ the country when exactly one is filtered —
          Voyage takes a single country). No CTA on /type/word: the Voyage
          pool excludes words, the game would always come back empty. */}
      {slug !== "word" && (
        <PlayWithCardsCta
          uiLang={uiLang}
          filters={{ kind: slug, country: filterCountries.length === 1 ? filterCountries[0] : "" }}
        />
      )}

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

export default function TypePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
          <div className="wex-skeleton" style={{ width: 320, height: 80, background: "var(--paper-deep)", borderRadius: "var(--r-lg)", border: "1px solid var(--paper-edge)" }} />
        </div>
      }
    >
      <TypePageContent />
    </Suspense>
  );
}

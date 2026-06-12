"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { tagIcon } from "@/lib/tagIcons";
import { getConcepts, ConceptItem } from "@/lib/api";
import { DOMAIN_DEFS, DOMAIN_COLORS, DomainDef } from "@/lib/domainDefs";
import { useUILang, type UILang } from "@/lib/useUILang";

// ─── Localisation ────────────────────────────────────────────────────────────

const T: Record<UILang, {
  eyebrow: string;
  title: string;
  subtitle: string;
  back: string;
  loading: string;
  all: string;
  tabThemes: string;
  tabStyles: string;
  expressions: (n: number) => string;
  styleSubtitle: string;
  noResults: string;
  backToDomains: string;
  nConcepts: (n: number) => string;
  seeExpressions: (n: number) => string;
}> = {
  fr: {
    eyebrow: "Explore par thème",
    title: "Concepts",
    subtitle: "Les mêmes idées, dans toutes les langues.",
    back: "Accueil",
    loading: "Chargement…",
    all: "Tous",
    tabThemes: "Thèmes",
    tabStyles: "Styles",
    expressions: (n) => `${n} expressions`,
    styleSubtitle: "Explorer par registre de langue",
    noResults: "Aucun concept trouvé pour ce filtre.",
    backToDomains: "Tous les thèmes",
    nConcepts: (n) => `${n} concepts`,
    seeExpressions: (n) => `Voir les ${n} expressions →`,
  },
  en: {
    eyebrow: "Explore by theme",
    title: "Concepts",
    subtitle: "The same ideas, in every language.",
    back: "Home",
    loading: "Loading…",
    all: "All",
    tabThemes: "Themes",
    tabStyles: "Styles",
    expressions: (n) => `${n} expressions`,
    styleSubtitle: "Explore by language register",
    noResults: "No concepts found for this filter.",
    backToDomains: "All themes",
    nConcepts: (n) => `${n} concepts`,
    seeExpressions: (n) => `See ${n} expressions →`,
  },
  es: {
    eyebrow: "Explorar por tema",
    title: "Conceptos",
    subtitle: "Las mismas ideas, en todos los idiomas.",
    back: "Inicio",
    loading: "Cargando…",
    all: "Todos",
    tabThemes: "Temas",
    tabStyles: "Estilos",
    expressions: (n) => `${n} expresiones`,
    styleSubtitle: "Explorar por registro lingüístico",
    noResults: "No se encontraron conceptos para este filtro.",
    backToDomains: "Todos los temas",
    nConcepts: (n) => `${n} conceptos`,
    seeExpressions: (n) => `Ver ${n} expresiones →`,
  },
  it: {
    eyebrow: "Esplora per tema",
    title: "Concetti",
    subtitle: "Le stesse idee, in tutte le lingue.",
    back: "Home",
    loading: "Caricamento…",
    all: "Tutti",
    tabThemes: "Temi",
    tabStyles: "Stili",
    expressions: (n) => `${n} espressioni`,
    styleSubtitle: "Esplora per registro linguistico",
    noResults: "Nessun concetto trovato per questo filtro.",
    backToDomains: "Tutti i temi",
    nConcepts: (n) => `${n} concetti`,
    seeExpressions: (n) => `Vedi ${n} espressioni →`,
  },
  tr: {
    eyebrow: "Temaya göre keşfet",
    title: "Kavramlar",
    subtitle: "Aynı fikirler, tüm dillerde.",
    back: "Ana sayfa",
    loading: "Yükleniyor…",
    all: "Tümü",
    tabThemes: "Temalar",
    tabStyles: "Stiller",
    expressions: (n) => `${n} deyim`,
    styleSubtitle: "Dil kaydına göre keşfet",
    noResults: "Bu filtre için kavram bulunamadı.",
    backToDomains: "Tüm temalar",
    nConcepts: (n) => `${n} kavram`,
    seeExpressions: (n) => `${n} deyimi gör →`,
  },
  de: {
    eyebrow: "Nach Thema erkunden",
    title: "Konzepte",
    subtitle: "Dieselben Ideen, in jeder Sprache.",
    back: "Startseite",
    loading: "Laden…",
    all: "Alle",
    tabThemes: "Themen",
    tabStyles: "Stile",
    expressions: (n) => `${n} Ausdrücke`,
    styleSubtitle: "Nach Sprachregister erkunden",
    noResults: "Keine Konzepte für diesen Filter gefunden.",
    backToDomains: "Alle Themen",
    nConcepts: (n) => `${n} Konzepte`,
    seeExpressions: (n) => `${n} Ausdrücke sehen →`,
  },
  ja: {
    eyebrow: "テーマ別に探索",
    title: "概念",
    subtitle: "同じ考え、すべての言語で。",
    back: "ホーム",
    loading: "読み込み中…",
    all: "すべて",
    tabThemes: "テーマ",
    tabStyles: "スタイル",
    expressions: (n) => `${n}件の表現`,
    styleSubtitle: "言語レジスター別に探索",
    noResults: "このフィルターに一致する概念がありません。",
    backToDomains: "すべてのテーマ",
    nConcepts: (n) => `${n}件の概念`,
    seeExpressions: (n) => `${n}件の表現を見る →`,
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES: Array<{
  emoji: string;
  concept: string;
  labels: Record<string, string>;
  desc: Record<string, string>;
}> = [
  {
    emoji: "📜",
    concept: "proverb",
    labels: { fr: "Proverbes", en: "Proverbs", es: "Proverbios", it: "Proverbi", tr: "Atasözleri" },
    desc: { fr: "La sagesse populaire en formule", en: "Folk wisdom in a phrase", es: "La sabiduría popular", it: "La saggezza popolare", tr: "Halk bilgeliği" },
  },
  {
    emoji: "😄",
    concept: "slang",
    labels: { fr: "Argot & familier", en: "Slang & informal", es: "Argot & coloquial", it: "Gergo & familiare", tr: "Argo & gündelik" },
    desc: { fr: "Ce qu'on dit entre amis", en: "What friends say to each other", es: "Lo que se dice entre amigos", it: "Quello che si dice tra amici", tr: "Arkadaşlar arasında söylenenler" },
  },
  {
    emoji: "📚",
    concept: "formal",
    labels: { fr: "Littéraire & formel", en: "Literary & formal", es: "Literario & formal", it: "Letterario & formale", tr: "Edebi & resmi" },
    desc: { fr: "Le registre soutenu", en: "The elevated register", es: "El registro elevado", it: "Il registro elevato", tr: "Yüksek dil seviyesi" },
  },
  {
    emoji: "😂",
    concept: "vulgar",
    labels: { fr: "Populaire & vulgaire", en: "Popular & vulgar", es: "Popular & vulgar", it: "Popolare & volgare", tr: "Kaba & argo" },
    desc: { fr: "L'expression sans filtre", en: "Unfiltered expression", es: "La expresión sin filtros", it: "L'espressione senza filtri", tr: "Filtresiz ifade" },
  },
  {
    emoji: "🔞",
    concept: "vulgar",
    labels: { fr: "Moins de 18", en: "Adults only", es: "Solo adultos", it: "Solo adulti", tr: "18+" },
    desc: { fr: "Expressions vulgaires et à caractère sexuel", en: "Vulgar and sexual expressions", es: "Expresiones vulgares y sexuales", it: "Espressioni volgari e sessuali", tr: "Kaba ve cinsel ifadeler" },
  },
];

// ─── Constantes UI ───────────────────────────────────────────────────────────

const LANG_FLAGS: Record<string, string> = { fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", it: "🇮🇹", tr: "🇹🇷", de: "🇩🇪", ja: "🇯🇵" };
const LANG_API: Record<string, string>   = { fr: "fr", en: "uk", es: "es", it: "it", tr: "tr", de: "de", ja: "jp" };

// ─── Composant ───────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const router = useRouter();
  const [uiLang, changeLang] = useUILang();
  const [langFilter, setLangFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"themes" | "styles">("themes");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pills" | "bubbles">("pills");
  const [isDesktop, setIsDesktop] = useState(true);

  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [domainExprCounts, setDomainExprCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore active domain from URL on mount (e.g. /concepts?domain=emotions)
    const domFromUrl = new URLSearchParams(window.location.search).get("domain");
    if (domFromUrl) setActiveDomain(domFromUrl);
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync activeDomain with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const domFromUrl = new URLSearchParams(window.location.search).get("domain");
      setActiveDomain(domFromUrl);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openDomain = useCallback((slug: string) => {
    window.history.pushState({ domain: slug }, "", `/emoji?domain=${encodeURIComponent(slug)}`);
    setActiveDomain(slug);
  }, []);

  const closeDomain = useCallback(() => {
    window.history.pushState({}, "", "/emoji");
    setActiveDomain(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    const lang = langFilter !== "all" ? LANG_API[langFilter] ?? "" : "";
    getConcepts(uiLang, lang)
      .then((data) => {
        setConcepts(data.concepts);
        setDomainExprCounts(data.domain_expr_counts ?? {});
      })
      .catch(() => setConcepts([]))
      .finally(() => setLoading(false));
  }, [uiLang, langFilter]);

  const handleConceptClick = useCallback((concept: ConceptItem) => {
    router.push(`/search?concept=${encodeURIComponent(concept.slug)}`);
  }, [router]);

  const t = T[uiLang];

  const conceptsByDomain = useMemo(() => {
    const map: Record<string, ConceptItem[]> = {};
    for (const c of concepts) {
      for (const d of c.domains) {
        if (!map[d]) map[d] = [];
        map[d].push(c);
      }
    }
    return map;
  }, [concepts]);


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
            {t.title}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

          {/* Breadcrumb desktop */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>{t.back}</Link>
              {" › "}<span style={{ color: "var(--ink)" }}>{t.title}</span>
            </p>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: "1.5rem", animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--plum)", marginBottom: "0.4rem" }}>
              {t.eyebrow}
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--ink)", lineHeight: 1.1, margin: "0 0 0.5rem" }}>
              {t.title}
            </h1>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-softer)", margin: 0 }}>
              {t.subtitle}
            </p>
          </div>

          {/* Tabs + Language filter — même ligne sur desktop */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem" }}>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.25rem", background: "var(--paper-edge)", borderRadius: "var(--r-pill)", padding: "3px" }}>
              {(["themes", "styles"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); closeDomain(); }}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: activeTab === tab ? 600 : 400,
                    padding: "5px 14px",
                    borderRadius: "var(--r-pill)",
                    border: "none",
                    background: activeTab === tab ? "var(--paper)" : "transparent",
                    color: activeTab === tab ? "var(--ink)" : "var(--ink-soft)",
                    cursor: "pointer",
                    boxShadow: activeTab === tab ? "0 1px 4px rgba(28,20,16,0.10)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  {tab === "themes" ? t.tabThemes : t.tabStyles}
                </button>
              ))}
            </div>

            {/* Language filter (uniquement onglet Thèmes) */}
            {activeTab === "themes" && (
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {(["all", "fr", "en", "es", "it", "tr"] as const).map((lang) => {
                  const isActive = langFilter === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => setLangFilter(lang)}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        padding: "4px 10px",
                        borderRadius: "var(--r-pill)",
                        border: `1.5px solid ${isActive ? "var(--plum)" : "var(--paper-edge)"}`,
                        background: isActive ? "var(--plum-bg)" : "transparent",
                        color: isActive ? "var(--plum)" : "var(--ink-soft)",
                        cursor: "pointer",
                        transition: "all 120ms ease",
                      }}
                    >
                      {lang === "all" ? t.all : `${LANG_FLAGS[lang]} ${lang.toUpperCase()}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ONGLET THÈMES ── */}
          {activeTab === "themes" && (
            <>
              {loading ? (
                <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>{t.loading}</p>
              ) : concepts.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>{t.noResults}</p>
              ) : activeDomain === null ? (

                /* ── Grille des domaines ── */
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "3rem",
                  animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both",
                }}>
                  {Object.keys(DOMAIN_DEFS)
                    .filter((d) => (conceptsByDomain[d]?.length ?? 0) > 0)
                    .sort((a, b) => (domainExprCounts[b] ?? 0) - (domainExprCounts[a] ?? 0))
                    .map((domSlug) => {
                      const def = DOMAIN_DEFS[domSlug];
                      const count = conceptsByDomain[domSlug]?.length ?? 0;
                      const colors = DOMAIN_COLORS[domSlug] ?? { bg: "#f5f5f5", accent: "#666" };
                      const exprCount = domainExprCounts[domSlug] ?? 0;
                      return (
                        <div
                          key={domSlug}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            borderRadius: "var(--r-lg)",
                            border: "none",
                            background: colors.bg,
                            boxShadow: "0 1px 6px rgba(28,20,16,0.08)",
                            overflow: "hidden",
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
                          {/* Accent bar */}
                          <div style={{ height: 4, width: "100%", background: colors.accent, opacity: 0.35 }} />

                          {/* Main clickable area */}
                          <button
                            data-testid="domain-card"
                            onClick={() => openDomain(domSlug)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "1.1rem 1.1rem 0.6rem",
                              width: "100%",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <span style={{ fontSize: 40, lineHeight: 1 }}>{def.emoji}</span>
                            <span style={{
                              fontFamily: "var(--font-display)",
                              fontStyle: "italic",
                              fontSize: 16,
                              fontWeight: 600,
                              color: "#1c1410",
                              lineHeight: 1.2,
                            }}>
                              {def.labels[uiLang]}
                            </span>
                            <span style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 11,
                              color: colors.accent,
                              fontWeight: 500,
                            }}>
                              {t.nConcepts(count)}
                            </span>
                          </button>

                          {/* Expression count — clickable → /search?domain= */}
                          <button
                            onClick={() => router.push(`/search?domain=${encodeURIComponent(domSlug)}`)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 11,
                              color: colors.accent,
                              fontWeight: 500,
                              padding: "0.4rem 1.1rem 0.8rem",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "underline",
                              textDecorationStyle: "dotted",
                              textUnderlineOffset: "3px",
                              opacity: 0.8,
                              transition: "opacity 120ms ease",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                          >
                            {t.expressions(exprCount)} →
                          </button>
                        </div>
                      );
                    })}
                </div>

              ) : (

                /* ── Vue d'un domaine ── */
                <div style={{ marginBottom: "3rem", animation: "fadeSlideUp 0.35s cubic-bezier(0.2, 0.7, 0.3, 1) both" }}>

                  {/* Retour + toggle vue */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                    <button
                      onClick={closeDomain}
                      style={{
                        background: "var(--paper-edge)",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink-soft)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "6px 14px",
                        borderRadius: "var(--r-pill)",
                        transition: "background 120ms ease, color 120ms ease",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "var(--plum-bg)";
                        el.style.color = "var(--plum)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "var(--paper-edge)";
                        el.style.color = "var(--ink-soft)";
                      }}
                    >
                      ← {t.backToDomains}
                    </button>

                    {isDesktop && (
                      <button
                        onClick={() => setViewMode(v => v === "pills" ? "bubbles" : "pills")}
                        title={viewMode === "pills" ? "Vue bulles" : "Vue liste"}
                        style={{
                          background: "var(--paper-edge)",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--ink-soft)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "6px 12px",
                          borderRadius: "var(--r-pill)",
                          fontSize: 13,
                          fontFamily: "var(--font-body)",
                          fontWeight: 500,
                          transition: "background 120ms ease, color 120ms ease",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "var(--plum-bg)";
                          el.style.color = "var(--plum)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "var(--paper-edge)";
                          el.style.color = "var(--ink-soft)";
                        }}
                      >
                        {viewMode === "pills" ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="3.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
                              <circle cx="10.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
                              <circle cx="3.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
                              <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
                            </svg>
                            Bulles
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <line x1="1" y1="3.5" x2="13" y2="3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                              <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                              <line x1="1" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                            Liste
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* En-tête du domaine — cliquable pour revenir */}
                  <button
                    onClick={closeDomain}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid var(--paper-edge)",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "0 0 1rem",
                      marginBottom: "1.75rem",
                      borderRadius: 0,
                      transition: "opacity 150ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    title={t.backToDomains}
                  >
                    <span style={{ fontSize: 38 }}>{DOMAIN_DEFS[activeDomain]?.emoji}</span>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--ink)", margin: "0 0 0.15rem", fontWeight: 600 }}>
                        {DOMAIN_DEFS[activeDomain]?.labels[uiLang]}
                      </h2>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)", margin: 0 }}>
                        {t.nConcepts(conceptsByDomain[activeDomain]?.length ?? 0)}
                      </p>
                    </div>
                  </button>

                  {/* Expression count → /search?domain= */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.75rem", marginBottom: "1.25rem" }}>
                    <button
                      onClick={() => router.push(`/search?domain=${encodeURIComponent(activeDomain)}`)}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--plum)",
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.25rem 0",
                        opacity: 0.85,
                        transition: "opacity 120ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                    >
                      {t.seeExpressions(domainExprCounts[activeDomain] ?? 0)}
                    </button>
                  </div>

                  {/* Concepts — vue pills ou vue bulles */}
                  {(!isDesktop || viewMode === "pills") ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {(conceptsByDomain[activeDomain] ?? []).map((concept) => {
                        const icon = tagIcon(concept.slug);
                        return (
                          <button
                            key={concept.slug}
                            data-testid="concept-card"
                            onClick={() => handleConceptClick(concept)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 14,
                              padding: "6px 14px",
                              borderRadius: "var(--r-pill)",
                              border: "1.5px solid var(--paper-edge)",
                              background: "var(--paper)",
                              color: "var(--ink)",
                              cursor: "pointer",
                              transition: "all 120ms ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              boxShadow: "var(--shadow-postcard)",
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
                            {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
                            <span style={{ fontWeight: 500 }}>{concept.name}</span>
                            <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{concept.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", padding: "0.5rem 0" }}>
                      {(conceptsByDomain[activeDomain] ?? []).map((concept) => {
                        const icon = tagIcon(concept.slug) ?? "💡";
                        const yShift = (concept.slug.charCodeAt(0) % 3 - 1) * 5;
                        return (
                          <button
                            key={concept.slug}
                            data-testid="concept-card"
                            onClick={() => handleConceptClick(concept)}
                            style={{
                              width: 90,
                              height: 90,
                              borderRadius: "50%",
                              border: "1.5px solid var(--paper-edge)",
                              background: "var(--paper)",
                              color: "var(--ink)",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 3,
                              boxShadow: "var(--shadow-postcard)",
                              transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                              transform: `translateY(${yShift}px)`,
                              padding: "0 6px",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.transform = `translateY(${yShift - 4}px) scale(1.08)`;
                              el.style.boxShadow = "0 6px 20px rgba(108,70,132,0.18)";
                              el.style.borderColor = "var(--plum)";
                              el.style.color = "var(--plum)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.transform = `translateY(${yShift}px)`;
                              el.style.boxShadow = "var(--shadow-postcard)";
                              el.style.borderColor = "var(--paper-edge)";
                              el.style.color = "var(--ink)";
                            }}
                          >
                            <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.25, maxWidth: 72, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {concept.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── ONGLET STYLES ── */}
          {activeTab === "styles" && (
            <div style={{ marginBottom: "3rem" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-softer)", marginBottom: "1.5rem" }}>
                {t.styleSubtitle}
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
              }}>
                {STYLES.map((style) => (
                  <button
                    key={style.concept + style.emoji}
                    onClick={() => router.push(`/search?concept=${style.concept}`)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      padding: "1.25rem 1rem",
                      borderRadius: "var(--r-lg)",
                      border: "1.5px solid var(--paper-edge)",
                      background: "var(--paper)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                      boxShadow: "var(--shadow-postcard)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = "0 6px 20px rgba(28,20,16,0.12)";
                      el.style.borderColor = "var(--plum)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "var(--shadow-postcard)";
                      el.style.borderColor = "var(--paper-edge)";
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{style.emoji}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                      {style.labels[uiLang]}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-softer)", lineHeight: 1.4 }}>
                      {style.desc[uiLang]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

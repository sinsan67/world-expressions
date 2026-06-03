"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { getConcepts, ConceptItem } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "it" | "tr";

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
  clearFilter: string;
  styleSubtitle: string;
  noResults: string;
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
    clearFilter: "Voir tous les thèmes",
    styleSubtitle: "Explorer par registre de langue",
    noResults: "Aucun concept trouvé pour ce filtre.",
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
    clearFilter: "Show all themes",
    styleSubtitle: "Explore by language register",
    noResults: "No concepts found for this filter.",
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
    clearFilter: "Ver todos los temas",
    styleSubtitle: "Explorar por registro lingüístico",
    noResults: "No se encontraron conceptos para este filtro.",
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
    clearFilter: "Vedi tutti i temi",
    styleSubtitle: "Esplora per registro linguistico",
    noResults: "Nessun concetto trovato per questo filtro.",
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
    clearFilter: "Tüm temaları göster",
    styleSubtitle: "Dil kaydına göre keşfet",
    noResults: "Bu filtre için kavram bulunamadı.",
  },
};

// ─── Domaines ─────────────────────────────────────────────────────────────────

type DomainDef = { emoji: string; labels: Record<UILang, string> };

const DOMAIN_DEFS: Record<string, DomainDef> = {
  emotions:  { emoji: "💛", labels: { fr: "Émotions",        en: "Emotions",         es: "Emociones",       it: "Emozioni",        tr: "Duygular" } },
  relations: { emoji: "🤝", labels: { fr: "Relations",       en: "Relationships",    es: "Relaciones",      it: "Relazioni",       tr: "İlişkiler" } },
  money:     { emoji: "💰", labels: { fr: "Argent & pouvoir",en: "Money & power",    es: "Dinero & poder",  it: "Denaro & potere", tr: "Para & güç" } },
  wisdom:    { emoji: "🧠", labels: { fr: "Esprit & sagesse",en: "Mind & wisdom",    es: "Mente & sabiduría",it: "Mente & saggezza",tr: "Akıl & bilgelik" } },
  speech:    { emoji: "🗣️", labels: { fr: "Parole",          en: "Speech",           es: "Palabra",         it: "Parola",          tr: "Söz" } },
  morality:  { emoji: "⚖️", labels: { fr: "Morale & société",en: "Morality",         es: "Moral & sociedad",it: "Morale",          tr: "Ahlak" } },
  nature:    { emoji: "🌿", labels: { fr: "Nature & corps",  en: "Nature & body",    es: "Naturaleza",      it: "Natura & corpo",  tr: "Doğa & beden" } },
  time:      { emoji: "⏳", labels: { fr: "Temps & destin",  en: "Time & fate",      es: "Tiempo & destino",it: "Tempo & destino", tr: "Zaman & kader" } },
  work:      { emoji: "💪", labels: { fr: "Travail & effort",en: "Work & effort",    es: "Trabajo & esfuerzo",it: "Lavoro & sforzo",tr: "Çalışma" } },
  humor:     { emoji: "🎭", labels: { fr: "Humour & absurde",en: "Humor & absurdity",es: "Humor & absurdo",  it: "Umorismo",        tr: "Mizah" } },
  pleasure:  { emoji: "🍷", labels: { fr: "Plaisirs & excès",en: "Pleasures & excess",es: "Placeres",       it: "Piaceri",         tr: "Zevk" } },
  travel:    { emoji: "🌍", labels: { fr: "Voyage & exil",   en: "Travel & exile",   es: "Viaje & exilio",  it: "Viaggio",         tr: "Seyahat" } },
  luck:      { emoji: "🎲", labels: { fr: "Chance & risque", en: "Luck & risk",      es: "Suerte & riesgo", it: "Fortuna",         tr: "Şans & risk" } },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES: Array<{
  emoji: string;
  concept: string;
  labels: Record<UILang, string>;
  desc: Record<UILang, string>;
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
];

// ─── Constantes UI ───────────────────────────────────────────────────────────

const LANG_FLAGS: Record<string, string> = { fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", it: "🇮🇹", tr: "🇹🇷" };
const LANG_API: Record<string, string>   = { fr: "fr", en: "uk", es: "es", it: "it", tr: "tr" };

// ─── Composant ───────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"themes" | "styles">("themes");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  // Données brutes depuis l'API
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [domainCounts, setDomainCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    setLoading(true);
    const lang = langFilter !== "all" ? LANG_API[langFilter] ?? "" : "";
    getConcepts(uiLang, lang)
      .then((data) => {
        setConcepts(data.concepts);
        setDomainCounts(data.domain_counts);
      })
      .catch(() => {
        setConcepts([]);
        setDomainCounts({});
      })
      .finally(() => setLoading(false));
  }, [uiLang, langFilter]);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  const handleConceptClick = useCallback((concept: ConceptItem) => {
    router.push(`/search?concept=${encodeURIComponent(concept.slug)}`);
  }, [router]);

  const t = T[uiLang];

  // Groupement des concepts par domaine (mémoïsé)
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

  // Domaines à afficher (ordonnés selon DOMAIN_DEFS, filtrés si activeDomain)
  const visibleDomains = useMemo(() => {
    const all = Object.keys(DOMAIN_DEFS).filter((d) => (conceptsByDomain[d]?.length ?? 0) > 0);
    if (activeDomain) return all.filter((d) => d === activeDomain);
    return all;
  }, [conceptsByDomain, activeDomain]);

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
                  onClick={() => { setActiveTab(tab); setActiveDomain(null); }}
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

            {/* Language filter chips (uniquement onglet Thèmes) */}
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
              ) : (
                <>
                  {/* Domain filter chips */}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    {Object.keys(DOMAIN_DEFS)
                      .filter((d) => (conceptsByDomain[d]?.length ?? 0) > 0)
                      .map((domSlug) => {
                        const def = DOMAIN_DEFS[domSlug];
                        const count = conceptsByDomain[domSlug]?.length ?? 0;
                        const isActive = activeDomain === domSlug;
                        return (
                          <button
                            key={domSlug}
                            onClick={() => setActiveDomain(isActive ? null : domSlug)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 12,
                              fontWeight: isActive ? 600 : 400,
                              padding: "4px 10px",
                              borderRadius: "var(--r-pill)",
                              border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                              background: isActive ? "rgba(193,84,58,0.08)" : "transparent",
                              color: isActive ? "var(--terra)" : "var(--ink-soft)",
                              cursor: "pointer",
                              transition: "all 120ms ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span>{def.emoji}</span>
                            <span>{def.labels[uiLang]}</span>
                            <span style={{ opacity: 0.5, fontSize: 11 }}>{count}</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Bandeau filtre actif */}
                  {activeDomain && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1.25rem",
                      padding: "0.6rem 1rem",
                      borderRadius: "var(--r-lg)",
                      background: "rgba(193,84,58,0.06)",
                      border: "1px solid rgba(193,84,58,0.18)",
                    }}>
                      <span style={{ fontSize: 22 }}>{DOMAIN_DEFS[activeDomain]?.emoji}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "var(--terra)" }}>
                        {DOMAIN_DEFS[activeDomain]?.labels[uiLang]}
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
                        — {conceptsByDomain[activeDomain]?.length ?? 0} concepts
                      </span>
                      <button
                        onClick={() => setActiveDomain(null)}
                        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--terra)", fontWeight: 600 }}
                      >
                        {t.clearFilter} ×
                      </button>
                    </div>
                  )}

                  {/* Sections par domaine */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3rem" }}>
                    {visibleDomains.map((domSlug) => {
                      const def = DOMAIN_DEFS[domSlug];
                      const domConcepts = conceptsByDomain[domSlug] ?? [];
                      return (
                        <div key={domSlug}>
                          {/* En-tête de section — cliquable pour filtrer */}
                          <button
                            onClick={() => setActiveDomain(activeDomain === domSlug ? null : domSlug)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              background: "none",
                              border: "none",
                              cursor: activeDomain ? "default" : "pointer",
                              padding: "0 0 0.75rem",
                              marginBottom: "0.5rem",
                              borderBottom: "1px solid var(--paper-edge)",
                              width: "100%",
                              textAlign: "left",
                            }}
                          >
                            <span style={{ fontSize: 22 }}>{def?.emoji}</span>
                            <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "var(--ink)", fontWeight: 600 }}>
                              {def?.labels[uiLang]}
                            </span>
                            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-faint)", marginLeft: "0.25rem" }}>
                              {domConcepts.length}
                            </span>
                          </button>

                          {/* Grille de concepts */}
                          <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}>
                            {domConcepts.map((concept) => (
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
                                <span style={{ fontWeight: 500 }}>{concept.name}</span>
                                <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{concept.count}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
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
                    key={style.concept}
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

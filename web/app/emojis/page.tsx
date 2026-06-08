"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import EmojiKeyboard from "@/components/EmojiKeyboard";
import { tagIcon } from "@/lib/tagIcons";
import { DOMAIN_DEFS, DOMAIN_COLORS } from "@/lib/domainDefs";
import { LANG_FLAG, LANG_NATIVE } from "@/lib/langDefs";
import { getConcepts } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "it" | "tr";
type TagEntry = { slug: string; name: string; count: number };

const LANG_FILTER_OPTIONS: { value: string }[] = [
  { value: "" },
  { value: "fr" },
  { value: "en" },
  { value: "es" },
  { value: "it" },
  { value: "tr" },
];

const KIND_OPTIONS: { value: string; labels: Record<UILang, string> }[] = [
  { value: "", labels: { fr: "Tous", en: "All", es: "Todos", it: "Tutti", tr: "Tümü" } },
  { value: "idiom", labels: { fr: "Expression", en: "Expression", es: "Expresión", it: "Espressione", tr: "İfade" } },
  { value: "proverb", labels: { fr: "Proverbe", en: "Proverb", es: "Proverbio", it: "Proverbio", tr: "Atasözü" } },
  { value: "locution", labels: { fr: "Locution", en: "Set phrase", es: "Locución", it: "Locuzione", tr: "Deyim" } },
];

const T: Record<UILang, {
  eyebrow: string;
  title: string;
  subtitle: string;
  back: string;
  all: string;
  searchPlaceholder: string;
  noResults: string;
  tagCount: (n: number) => string;
  domainsLabel: string;
  viewExpressions: string;
  langFilter: string;
  typeFilter: string;
  viewDomains: string;
  viewKeyboard: string;
}> = {
  fr: {
    eyebrow: "Référence",
    title: "Emoji & thèmes",
    subtitle: "Tous les concepts du monde, un emoji chacun.",
    back: "Accueil",
    all: "Tous",
    searchPlaceholder: "Filtrer par mot-clé…",
    noResults: "Aucun tag trouvé.",
    tagCount: (n) => `${n} concepts`,
    domainsLabel: "domaines",
    viewExpressions: "Voir les expressions →",
    langFilter: "Langue",
    typeFilter: "Type",
    viewDomains: "Par domaine",
    viewKeyboard: "🎲 Clavier",
  },
  en: {
    eyebrow: "Reference",
    title: "Emoji & themes",
    subtitle: "Every concept in the world, one emoji each.",
    back: "Home",
    all: "All",
    searchPlaceholder: "Filter by keyword…",
    noResults: "No tags found.",
    tagCount: (n) => `${n} concepts`,
    domainsLabel: "domains",
    viewExpressions: "See expressions →",
    langFilter: "Language",
    typeFilter: "Type",
    viewDomains: "By domain",
    viewKeyboard: "🎲 Keyboard",
  },
  es: {
    eyebrow: "Referencia",
    title: "Emoji & temas",
    subtitle: "Todos los conceptos del mundo, un emoji cada uno.",
    back: "Inicio",
    all: "Todos",
    searchPlaceholder: "Filtrar por palabra clave…",
    noResults: "No se encontraron etiquetas.",
    tagCount: (n) => `${n} conceptos`,
    domainsLabel: "dominios",
    viewExpressions: "Ver las expresiones →",
    langFilter: "Idioma",
    typeFilter: "Tipo",
    viewDomains: "Por dominio",
    viewKeyboard: "🎲 Teclado",
  },
  it: {
    eyebrow: "Riferimento",
    title: "Emoji & temi",
    subtitle: "Ogni concetto del mondo, un emoji ciascuno.",
    back: "Home",
    all: "Tutti",
    searchPlaceholder: "Filtra per parola chiave…",
    noResults: "Nessun tag trovato.",
    tagCount: (n) => `${n} concetti`,
    domainsLabel: "domini",
    viewExpressions: "Vedi le espressioni →",
    langFilter: "Lingua",
    typeFilter: "Tipo",
    viewDomains: "Per dominio",
    viewKeyboard: "🎲 Tastiera",
  },
  tr: {
    eyebrow: "Referans",
    title: "Emoji & temalar",
    subtitle: "Dünyadaki her kavram, birer emoji ile.",
    back: "Ana sayfa",
    all: "Tümü",
    searchPlaceholder: "Anahtar kelimeyle filtrele…",
    noResults: "Etiket bulunamadı.",
    tagCount: (n) => `${n} kavram`,
    domainsLabel: "alan",
    viewExpressions: "İfadeleri gör →",
    langFilter: "Dil",
    typeFilter: "Tür",
    viewDomains: "Alana göre",
    viewKeyboard: "🎲 Klavye",
  },
};

export default function EmojisPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [viewMode, setViewMode] = useState<"domains" | "keyboard">("domains");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [domainTagMap, setDomainTagMap] = useState<Record<string, TagEntry[]>>({});

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getConcepts(uiLang, filterLang, "", 1, filterKind).then(({ concepts }) => {
      const map: Record<string, TagEntry[]> = {};
      for (const c of concepts) {
        for (const domain of c.domains) {
          if (!map[domain]) map[domain] = [];
          if (!map[domain].find((t) => t.slug === c.slug)) {
            map[domain].push({ slug: c.slug, name: c.name, count: c.count });
          }
        }
      }
      setDomainTagMap(map);
    });
  }, [uiLang, filterLang, filterKind]);

  const changeLang = (lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  };

  const t = T[uiLang];

  const totalTags = useMemo(
    () => {
      const seen = new Set<string>();
      Object.values(domainTagMap).flat().forEach((t) => seen.add(t.slug));
      return seen.size;
    },
    [domainTagMap]
  );

  const filteredTagsFor = (domain: string): TagEntry[] => {
    const q = search.trim().toLowerCase();
    const tags = domainTagMap[domain] ?? [];
    if (!q) return tags;
    return tags.filter((t) =>
      t.slug.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  };

  const visibleDomains = useMemo(() => {
    const allDomains = Object.keys(DOMAIN_DEFS);
    const domains = activeDomain ? [activeDomain] : allDomains;
    const q = search.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter((d) =>
      (domainTagMap[d] ?? []).some(
        (t) => t.slug.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      )
    );
  }, [activeDomain, search, domainTagMap]);

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

          {/* Breadcrumb */}
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
            <p style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-softer)", margin: "0 0 0.25rem" }}>
              {t.subtitle}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-faint)", margin: 0 }}>
              {t.tagCount(totalTags)} · {Object.keys(DOMAIN_DEFS).length} {t.domainsLabel}
            </p>
          </div>

          {/* View mode toggle */}
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
            {(["domains", "keyboard"] as const).map((mode) => {
              const label = mode === "domains" ? t.viewDomains : t.viewKeyboard;
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    padding: "5px 14px",
                    borderRadius: "var(--r-pill)",
                    border: `1.5px solid ${isActive ? "var(--plum)" : "var(--paper-edge)"}`,
                    background: isActive ? "var(--plum-bg)" : "transparent",
                    color: isActive ? "var(--plum)" : "var(--ink-soft)",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Keyboard mode */}
          {viewMode === "keyboard" && (
            <div style={{ marginBottom: "3rem" }}>
              <EmojiKeyboard
                size={48}
                onSelect={(slug) => router.push(`/search?concept=${encodeURIComponent(slug)}`)}
              />
            </div>
          )}

          {/* Search + filters + domain chips + domain sections */}
          {viewMode === "domains" && (
          <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.75rem" }}>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                padding: "8px 14px",
                borderRadius: "var(--r-pill)",
                border: "1.5px solid var(--paper-edge)",
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
                width: "100%",
                maxWidth: 320,
                transition: "border-color 120ms ease",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--plum)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--paper-edge)"; }}
            />

            {/* Language filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-softer)", minWidth: 52 }}>
                {t.langFilter}
              </span>
              {LANG_FILTER_OPTIONS.map(({ value }) => {
                const isActive = filterLang === value;
                return (
                  <button
                    key={value || "all"}
                    onClick={() => setFilterLang(value)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${isActive ? "var(--plum)" : "var(--paper-edge)"}`,
                      background: isActive ? "var(--plum-bg)" : "transparent",
                      color: isActive ? "var(--plum)" : "var(--ink-soft)",
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {value ? (
                      <><span>{LANG_FLAG[value]}</span><span>{value.toUpperCase()}</span></>
                    ) : (
                      <span>{t.all}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Type filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-softer)", minWidth: 52 }}>
                {t.typeFilter}
              </span>
              {KIND_OPTIONS.map(({ value, labels }) => {
                const isActive = filterKind === value;
                return (
                  <button
                    key={value || "all"}
                    onClick={() => setFilterKind(value)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                      background: isActive ? "var(--terra)" : "var(--paper)",
                      color: isActive ? "#fff" : "var(--terra)",
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                    }}
                  >
                    {labels[uiLang]}
                  </button>
                );
              })}
            </div>

            {/* Domain chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {/* All chip */}
              <button
                onClick={() => setActiveDomain(null)}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: activeDomain === null ? 600 : 400,
                  padding: "5px 12px",
                  borderRadius: "var(--r-pill)",
                  border: `1.5px solid ${activeDomain === null ? "var(--plum)" : "var(--paper-edge)"}`,
                  background: activeDomain === null ? "var(--plum-bg)" : "transparent",
                  color: activeDomain === null ? "var(--plum)" : "var(--ink-soft)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {t.all}
              </button>

              {/* Domain chips */}
              {Object.entries(DOMAIN_DEFS).map(([slug, def]) => {
                const isActive = activeDomain === slug;
                const colors = DOMAIN_COLORS[slug];
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveDomain(isActive ? null : slug)}
                    title={def.labels[uiLang]}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      padding: "5px 10px",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${isActive ? colors?.accent ?? "var(--plum)" : "var(--paper-edge)"}`,
                      background: isActive ? (colors?.bg ?? "var(--plum-bg)") : "transparent",
                      color: isActive ? (colors?.accent ?? "var(--plum)") : "var(--ink-soft)",
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <span>{def.emoji}</span>
                    <span className="wex-desktop-only">{def.labels[uiLang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Domain sections */}
          {visibleDomains.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>{t.noResults}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "3rem" }}>
              {visibleDomains.map((domSlug) => {
                const def = DOMAIN_DEFS[domSlug];
                const colors = DOMAIN_COLORS[domSlug] ?? { bg: "#f5f5f5", accent: "#666" };
                const tags = filteredTagsFor(domSlug);
                if (tags.length === 0) return null;

                return (
                  <section
                    key={domSlug}
                    style={{ animation: "fadeSlideUp 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both" }}
                  >
                    {/* Domain header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.75rem",
                        paddingBottom: "0.6rem",
                        borderBottom: `2px solid ${colors.accent}22`,
                      }}
                    >
                      <button
                        onClick={() => setActiveDomain(activeDomain === domSlug ? null : domSlug)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{def.emoji}</span>
                        <span style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 18,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}>
                          {def.labels[uiLang]}
                        </span>
                      </button>
                      <span style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: colors.accent,
                        fontWeight: 500,
                        marginLeft: "0.25rem",
                      }}>
                        {t.tagCount(tags.length)}
                      </span>
                      <button
                        onClick={() => router.push(`/search?domain=${encodeURIComponent(domSlug)}`)}
                        style={{
                          marginLeft: "auto",
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: colors.accent,
                          fontWeight: 500,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          opacity: 0.75,
                          transition: "opacity 120ms ease",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          textUnderlineOffset: "3px",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                      >
                        {t.viewExpressions}
                      </button>
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                      {tags.map(({ slug, name, count }) => {
                        const icon = tagIcon(slug);
                        return (
                          <button
                            key={slug}
                            onClick={() => router.push(`/search?concept=${encodeURIComponent(slug)}`)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 13,
                              padding: "5px 12px",
                              borderRadius: "var(--r-pill)",
                              border: "1.5px solid var(--paper-edge)",
                              background: "var(--paper)",
                              color: "var(--ink)",
                              cursor: "pointer",
                              transition: "all 120ms ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              boxShadow: "var(--shadow-postcard)",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = colors.accent;
                              el.style.color = colors.accent;
                              el.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = "var(--paper-edge)";
                              el.style.color = "var(--ink)";
                              el.style.transform = "translateY(0)";
                            }}
                          >
                            {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
                            <span style={{ fontWeight: 500 }}>{name}</span>
                            <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 400 }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          </div>
          )}

        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

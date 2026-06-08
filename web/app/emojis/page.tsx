"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { tagIcon } from "@/lib/tagIcons";
import { DOMAIN_DEFS, DOMAIN_COLORS } from "@/lib/domainDefs";
import { DOMAIN_TAGS } from "@/lib/domainTags";
import { getAllTagNames } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "it" | "tr";

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
  },
};

function formatLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EmojisPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagNames, setTagNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames);
  }, [uiLang]);

  const changeLang = (lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  };

  const t = T[uiLang];

  const visibleDomains = useMemo(() => {
    const q = search.trim().toLowerCase();
    const domains = activeDomain ? [activeDomain] : Object.keys(DOMAIN_DEFS);
    if (!q) return domains;
    return domains.filter((d) =>
      (DOMAIN_TAGS[d] ?? []).some((tag) =>
        tag.toLowerCase().includes(q) ||
        (tagNames[tag] ?? "").toLowerCase().includes(q)
      )
    );
  }, [activeDomain, search, tagNames]);

  const filteredTagsFor = (domain: string): string[] => {
    const q = search.trim().toLowerCase();
    const tags = DOMAIN_TAGS[domain] ?? [];
    if (!q) return tags;
    return tags.filter((tag) =>
      tag.toLowerCase().includes(q) ||
      (tagNames[tag] ?? "").toLowerCase().includes(q)
    );
  };

  const totalTags = useMemo(
    () => Object.values(DOMAIN_TAGS).flat().filter((v, i, a) => a.indexOf(v) === i).length,
    []
  );

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

          {/* Search + domain filter row */}
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
                      {tags.map((tag) => {
                        const icon = tagIcon(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => router.push(`/search?concept=${encodeURIComponent(tag)}`)}
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
                            <span style={{ fontWeight: 500 }}>{tagNames[tag] ?? formatLabel(tag)}</span>
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
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

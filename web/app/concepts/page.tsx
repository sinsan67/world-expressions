"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { getTopTags, TagInfo } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const T: Record<UILang, {
  eyebrow: string;
  title: string;
  subtitle: string;
  expressions: (n: number) => string;
  back: string;
  loading: string;
  all: string;
  explore: string;
}> = {
  fr: {
    eyebrow: "Explore par thème",
    title: "Concepts",
    subtitle: "Les mêmes idées, dans toutes les langues.",
    expressions: (n) => `${n} expressions`,
    back: "Accueil",
    loading: "Chargement…",
    all: "Tous",
    explore: "Explorer",
  },
  en: {
    eyebrow: "Explore by theme",
    title: "Concepts",
    subtitle: "The same ideas, in every language.",
    expressions: (n) => `${n} expressions`,
    back: "Home",
    loading: "Loading…",
    all: "All",
    explore: "Explore",
  },
  es: {
    eyebrow: "Explorar por tema",
    title: "Conceptos",
    subtitle: "Las mismas ideas, en todos los idiomas.",
    expressions: (n) => `${n} expresiones`,
    back: "Inicio",
    loading: "Cargando…",
    all: "Todos",
    explore: "Explorar",
  },
  it: {
    eyebrow: "Esplora per tema",
    title: "Concetti",
    subtitle: "Le stesse idee, in tutte le lingue.",
    expressions: (n) => `${n} espressioni`,
    back: "Home",
    loading: "Caricamento…",
    all: "Tutti",
    explore: "Esplora",
  },
  tr: {
    eyebrow: "Temaya göre keşfet",
    title: "Kavramlar",
    subtitle: "Aynı fikirler, tüm dillerde.",
    expressions: (n) => `${n} deyim`,
    back: "Ana sayfa",
    loading: "Yükleniyor…",
    all: "Tümü",
    explore: "Keşfet",
  },
};

const LANG_FLAGS: Record<string, string> = {
  fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", it: "🇮🇹", tr: "🇹🇷",
};

const LANG_API: Record<string, string> = {
  fr: "fr", en: "uk", es: "es", it: "it", tr: "tr",
};

export default function ConceptsPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [langFilter, setLangFilter] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    setLoading(true);
    const language = langFilter !== "all" ? LANG_API[langFilter] ?? "" : "";
    getTopTags(language, 60, uiLang)
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [uiLang, langFilter]);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  const handleConceptClick = useCallback((tag: TagInfo) => {
    const name = tag.name || tag.slug;
    router.push(`/#q=${encodeURIComponent(name)}`);
  }, [router]);

  const t = T[uiLang];

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
          <div style={{ marginBottom: "1.75rem", animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both" }}>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--plum)",
              marginBottom: "0.4rem",
            }}>
              {t.eyebrow}
            </p>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--ink)",
              lineHeight: 1.1,
              margin: "0 0 0.5rem",
            }}>
              {t.title}
            </h1>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-softer)", margin: 0 }}>
              {t.subtitle}
            </p>
          </div>

          {/* Language filter chips */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {(["all", "fr", "en", "es", "it", "tr"] as const).map((lang) => {
              const isActive = langFilter === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setLangFilter(lang)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    padding: "5px 12px",
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

          {/* Grid */}
          {loading ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-faint)", fontSize: 14 }}>
              {t.loading}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "1rem",
                marginBottom: "3rem",
              }}
            >
              {tags.map((tag, i) => {
                const icon = tagIcon(tag.slug) || "💡";
                const name = tag.name || tag.slug;
                return (
                  <button
                    key={tag.slug}
                    onClick={() => handleConceptClick(tag)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.6rem",
                      padding: "1.5rem 1rem",
                      borderRadius: "var(--r-lg)",
                      border: "1.5px solid var(--paper-edge)",
                      background: "var(--paper)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                      boxShadow: "var(--shadow-postcard)",
                      animation: `fadeSlideUp ${0.3 + i * 0.02}s cubic-bezier(0.2, 0.7, 0.3, 1) both`,
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 8px 24px rgba(28,20,16,0.14)";
                      el.style.borderColor = "var(--plum)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "var(--shadow-postcard)";
                      el.style.borderColor = "var(--paper-edge)";
                    }}
                  >
                    {/* Count badge */}
                    <span style={{
                      position: "absolute",
                      top: 8, right: 10,
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                    }}>
                      {tag.count}
                    </span>

                    <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink)",
                      lineHeight: 1.25,
                      wordBreak: "break-word",
                    }}>
                      {name}
                    </span>
                  </button>
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

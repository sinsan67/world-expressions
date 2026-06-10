"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { getCountries, CountryInfo } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";

const T: Record<UILang, {
  eyebrow: string;
  title: string;
  subtitle: string;
  expressions: (n: number) => string;
  back: string;
  loading: string;
}> = {
  fr: {
    eyebrow: "Explore le monde",
    title: "Atlas",
    subtitle: "Chaque pays a sa propre folie.",
    expressions: (n) => `${n.toLocaleString()} expressions`,
    back: "Accueil",
    loading: "Chargement…",
  },
  en: {
    eyebrow: "Explore the world",
    title: "Atlas",
    subtitle: "Every country has its own madness.",
    expressions: (n) => `${n.toLocaleString()} expressions`,
    back: "Home",
    loading: "Loading…",
  },
  es: {
    eyebrow: "Explora el mundo",
    title: "Atlas",
    subtitle: "Cada país tiene su propia locura.",
    expressions: (n) => `${n.toLocaleString()} expresiones`,
    back: "Inicio",
    loading: "Cargando…",
  },
  it: {
    eyebrow: "Esplora il mondo",
    title: "Atlas",
    subtitle: "Ogni paese ha la sua follia.",
    expressions: (n) => `${n.toLocaleString()} espressioni`,
    back: "Home",
    loading: "Caricamento…",
  },
  tr: {
    eyebrow: "Dünyayı keşfet",
    title: "Atlas",
    subtitle: "Her ülkenin kendine özgü bir çılgınlığı var.",
    expressions: (n) => `${n.toLocaleString()} deyim`,
    back: "Ana sayfa",
    loading: "Yükleniyor…",
  },
  de: {
    eyebrow: "Die Welt erkunden",
    title: "Atlas",
    subtitle: "Jedes Land hat seinen eigenen Wahnsinn.",
    expressions: (n) => `${n.toLocaleString()} Ausdrücke`,
    back: "Startseite",
    loading: "Laden…",
  },
  ja: {
    eyebrow: "世界を探索",
    title: "アトラス",
    subtitle: "どの国にも、それぞれの狂気がある。",
    expressions: (n) => `${n.toLocaleString()}件の表現`,
    back: "ホーム",
    loading: "読み込み中…",
  },
};

const HERO_IMAGES = new Set(["fr", "uk", "us", "au", "es", "tr", "it", "de", "jp", "ar", "pe", "co", "cu"]);
const SUB_REGION_CODES = new Set(["alsace", "bretagne"]);

const PASTEL_GRADIENTS: Record<string, string> = {
  ar: "linear-gradient(135deg, #74acdf 0%, #e8f4fc 50%, #74acdf 100%)",
  mx: "linear-gradient(135deg, #7ab89a 0%, #f0f8f0 45%, #c8908a 100%)",
  co: "linear-gradient(135deg, #e8c840 0%, #d8eef8 45%, #c84040 100%)",
  cl: "linear-gradient(135deg, #4060b8 0%, #f0f4fc 50%, #c83030 100%)",
  pe: "linear-gradient(135deg, #c83030 0%, #f8f0f0 50%, #c83030 100%)",
  cu: "linear-gradient(135deg, #3040a0 0%, #f0f4fc 50%, #c83030 100%)",
  ve: "linear-gradient(135deg, #c83030 0%, #3060a0 50%, #e8c830 100%)",
  default: "linear-gradient(135deg, #9090b8 0%, #c8b8d8 100%)",
};

const LANG_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", tr: "Türkçe",
  it: "Italiano", de: "Deutsch", ja: "日本語",
};

export default function AtlasPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [regions, setRegions] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    if (stored && ["fr", "en", "es", "it", "tr", "de", "ja"].includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    getCountries()
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.count - a.count);
        setRegions(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

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
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
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
          <div
            style={{
              marginBottom: "2rem",
              animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both",
            }}
          >
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
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: 18,
              color: "var(--ink-softer)",
              margin: 0,
            }}>
              {t.subtitle}
            </p>
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
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "3rem",
              }}
            >
              {regions.filter((r) => !SUB_REGION_CODES.has(r.code)).map((r, i) => {
                const hasPhoto = HERO_IMAGES.has(r.code);
                const bg = hasPhoto
                  ? `url('/images/${r.code}.jpg')`
                  : (PASTEL_GRADIENTS[r.code] ?? PASTEL_GRADIENTS.default);
                const flag = FLAG[r.code] ?? "🌍";
                const name = COUNTRY_NAME[r.code] ?? r.code.toUpperCase();
                const lang = r.languages.map(l => LANG_NAME[l] ?? l).join(", ");

                return (
                  <Link
                    key={r.code}
                    href={`/country/${r.code}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: 160,
                        borderRadius: "var(--r-lg)",
                        overflow: "hidden",
                        boxShadow: "var(--shadow-postcard)",
                        cursor: "pointer",
                        background: hasPhoto ? "var(--ink)" : bg,
                        backgroundImage: hasPhoto ? bg : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center 30%",
                        transition: "transform 150ms ease, box-shadow 150ms ease",
                        animation: `fadeSlideUp ${0.3 + i * 0.04}s cubic-bezier(0.2, 0.7, 0.3, 1) both`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(28,20,16,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-postcard)";
                      }}
                    >
                      {/* Gradient overlay */}
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: hasPhoto
                          ? "linear-gradient(to top, rgba(10,4,28,0.78) 0%, rgba(10,4,28,0.2) 60%, transparent 100%)"
                          : "linear-gradient(to top, rgba(10,4,28,0.35) 0%, transparent 60%)",
                      }} />

                      {/* Flag stripe top */}
                      <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        height: 5,
                        background: "var(--plum)",
                        opacity: 0.7,
                      }} />

                      {/* Count badge — top right */}
                      <div style={{
                        position: "absolute",
                        top: 12, right: 12,
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)",
                        borderRadius: "var(--r-pill)",
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.9)",
                        fontFamily: "var(--font-body)",
                      }}>
                        {r.count}
                      </div>

                      {/* Country info — bottom */}
                      <div style={{
                        position: "absolute",
                        bottom: 0, left: 0, right: 0,
                        padding: "0.75rem 1rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: 2 }}>
                          <span style={{ fontSize: 22 }}>{flag}</span>
                          <span style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                            fontSize: 18,
                            color: "#fff",
                            lineHeight: 1.1,
                          }}>
                            {name}
                          </span>
                        </div>
                        {lang && (
                          <p style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.65)",
                            margin: 0,
                          }}>
                            {lang}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
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

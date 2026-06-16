"use client";

import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import { REGION_DEFS } from "@/lib/regionDefs";
import { useUILangContext } from "@/lib/UILangContext";
import type { UILang } from "@/lib/useUILang";

const T = {
  fr: {
    title: "Régions de France",
    subtitle: "Le français parlé varie selon les régions — accents, mots empruntés, calques de la langue locale.",
    back: "← France",
    expressions: (n: number) => `${n} expressions`,
  },
  en: {
    title: "Regions of France",
    subtitle: "Spoken French varies by region — accents, borrowed words, and calques from local languages.",
    back: "← France",
    expressions: (n: number) => `${n} expressions`,
  },
  es: {
    title: "Regiones de Francia",
    subtitle: "El francés hablado varía según la región — acentos, palabras prestadas y calcos del idioma local.",
    back: "← Francia",
    expressions: (n: number) => `${n} expresiones`,
  },
  it: {
    title: "Regioni di Francia",
    subtitle: "Il francese parlato varia a seconda della regione — accenti, parole prese in prestito e calchi dalla lingua locale.",
    back: "← Francia",
    expressions: (n: number) => `${n} espressioni`,
  },
  tr: {
    title: "Fransa Bölgeleri",
    subtitle: "Konuşulan Fransızca bölgeye göre farklılık gösterir — aksanlar, ödünç kelimeler ve yerel dilden alıntılar.",
    back: "← Fransa",
    expressions: (n: number) => `${n} deyim`,
  },
  de: {
    title: "Regionen Frankreichs",
    subtitle: "Das gesprochene Französisch variiert je nach Region — Akzente, Lehnwörter und Lehnübersetzungen aus lokalen Sprachen.",
    back: "← Frankreich",
    expressions: (n: number) => `${n} Ausdrücke`,
  },
  ja: {
    title: "フランスの地方",
    subtitle: "話し言葉のフランス語は地方によって異なる——訛り、借用語、地域言語からの言語転移。",
    back: "← フランス",
    expressions: (n: number) => `${n}件の表現`,
  },
};

const REGION_COUNTS: Record<string, number> = {
  alsace: 35,
  bretagne: 40,
};

export default function RegionsPage() {
  const { uiLang } = useUILangContext();

  const t = T[uiLang] ?? T.fr;
  const regions = Object.values(REGION_DEFS);

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
          <Link
            href="/country/fr"
            style={{ fontSize: 13, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}
          >
            {t.back}
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--plum)" }}>
            🗺️ Régions
          </span>
          <div style={{ width: 48 }} />
        </div>

        {/* Hero */}
        <div style={{
          minHeight: 160,
          background: "linear-gradient(135deg, #4a3565 0%, #1e3a5f 60%, #1a5c50 100%)",
          padding: "2rem 2rem 2.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            textShadow: "0 2px 16px rgba(28,20,16,0.5)",
            textAlign: "center",
          }}>
            🇫🇷 {t.title}
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: 520,
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Region grid */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem 3rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}>
            {regions.map((region) => {
              const count = REGION_COUNTS[region.code] ?? 0;
              const defaultSection = region.sections.find((s) => s.key === null);
              return (
                <Link
                  key={region.code}
                  href={`/regions/${region.code}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: region.sectionStyles[Object.keys(region.sectionStyles)[0]]?.bg ?? "var(--paper-deep)",
                      border: `1.5px solid ${region.sectionStyles[Object.keys(region.sectionStyles)[0]]?.strip ?? "var(--paper-edge)"}`,
                      borderRadius: "var(--r-lg)",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 1px 6px rgba(28,20,16,0.07)",
                      transition: "transform 150ms ease, box-shadow 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 8px 24px rgba(28,20,16,0.13)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "0 1px 6px rgba(28,20,16,0.07)";
                    }}
                  >
                    <div style={{ height: 4, background: region.heroGradient }} />
                    <div style={{ padding: "1.25rem 1.25rem 1rem" }}>
                      <div style={{ fontSize: 40, lineHeight: 1, marginBottom: "0.6rem" }}>{region.emoji}</div>
                      <p style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: region.sectionStyles[Object.keys(region.sectionStyles)[0]]?.accent ?? "var(--ink)",
                        margin: "0 0 0.25rem",
                        lineHeight: 1.2,
                      }}>
                        {region.name}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "var(--ink-softer)",
                        fontStyle: "italic",
                        margin: "0 0 0.75rem",
                      }}>
                        {region.subtitle}
                      </p>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
                        {region.sections.filter((s) => s.key !== null).map((s) => (
                          <span key={s.key} style={{
                            fontSize: 10,
                            background: "rgba(255,255,255,0.6)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: "var(--r-pill)",
                            padding: "2px 8px",
                            color: "var(--ink-soft)",
                          }}>
                            {s.emoji} {s.label}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--ink-faint)", margin: "0.6rem 0 0", fontFamily: "var(--font-body)" }}>
                        {t.expressions(count)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

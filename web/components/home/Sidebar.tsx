"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NAV_ITEMS, NAV_LABELS, NAV_ARIA_LABEL } from "@/components/home/navConfig";
import { useFavoritesCount } from "@/lib/useFavoritesCount";
import { getCountries, getGlobalStats, GlobalStats } from "@/lib/api";
import type { UILang } from "@/lib/useUILang";

const TAGLINE: Record<string, string> = {
  fr: "Chaque langue a sa propre folie.",
  en: "Every language has its own madness.",
  es: "Cada lengua tiene su propia locura.",
  it: "Ogni lingua ha la sua follia.",
  tr: "Her dilin kendine özgü bir çılgınlığı var.",
  de: "Jede Sprache hat ihren eigenen Wahnsinn.",
  ja: "沈黙は金、雄弁は銀。",
};

// Stat line — counts come live from the API (single source of truth).
const STATS_LABEL: Record<string, { expressions: (n: string) => string; languages: (n: string) => string; countries: (n: string) => string }> = {
  fr: { expressions: (n) => `${n} expressions`,  languages: (n) => `${n} langues`,   countries: (n) => `${n} pays` },
  en: { expressions: (n) => `${n} expressions`,  languages: (n) => `${n} languages`, countries: (n) => `${n} countries` },
  es: { expressions: (n) => `${n} expresiones`,  languages: (n) => `${n} idiomas`,   countries: (n) => `${n} países` },
  it: { expressions: (n) => `${n} espressioni`,  languages: (n) => `${n} lingue`,    countries: (n) => `${n} paesi` },
  tr: { expressions: (n) => `${n} deyim`,        languages: (n) => `${n} dil`,       countries: (n) => `${n} ülke` },
  de: { expressions: (n) => `${n} Ausdrücke`,    languages: (n) => `${n} Sprachen`,  countries: (n) => `${n} Länder` },
  ja: { expressions: (n) => `${n}の表現`,        languages: (n) => `${n}言語`,       countries: (n) => `${n}か国` },
};

type Props = {
  uiLang: UILang;
};

export default function Sidebar({ uiLang }: Props) {
  const pathname = usePathname();
  const favCount = useFavoritesCount();
  const [countryCount, setCountryCount] = useState<number | undefined>(undefined);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    getCountries().then((countries) => setCountryCount(countries.length));
    getGlobalStats().then(setGlobalStats).catch(() => {});
  }, []);

  return (
    <aside
      className="wex-sidebar"
      style={{
        width: 220,
        background: "var(--paper)",
        borderRight: "1px solid var(--paper-edge)",
        padding: "1.5rem 1rem",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Wordmark */}
      <a href="/" style={{ textDecoration: "none", display: "block", marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", lineHeight: 1.2 }}>
          World
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--terra)" }}>
          Expressions
        </div>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--ink-softer)", marginTop: "0.4rem", lineHeight: 1.4 }}>
          {TAGLINE[uiLang] ?? TAGLINE.en}
        </p>
      </a>

      {/* Nav */}
      <nav
        aria-label={NAV_ARIA_LABEL[uiLang] ?? NAV_ARIA_LABEL.en}
        style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href !== null && pathname === item.href;

          // Random mode: plum action button — it launches an experience,
          // it's not a navigation link like the others
          if (item.id === "random") {
            return (
              <Link
                key={item.id}
                href="/voyage?quick=1"
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.5rem 0.75rem",
                  margin: "0.25rem 0",
                  borderRadius: "var(--r-sm)",
                  background: "var(--plum)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  textDecoration: "none",
                  boxShadow: "0 2px 0 var(--plum-deep)",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(1px)";
                  el.style.boxShadow = "0 1px 0 var(--plum-deep)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "none";
                  el.style.boxShadow = "0 2px 0 var(--plum-deep)";
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 16 }}>🎲</span>
                <span style={{ flex: 1 }}>{NAV_LABELS.random?.[uiLang] ?? NAV_LABELS.random?.en}</span>
              </Link>
            );
          }
          const count = item.id === "collection" ? favCount : undefined;
          const sharedStyle = {
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--r-sm)",
            color: isActive ? "var(--plum)" : "var(--ink-soft)",
            background: isActive ? "var(--plum-bg)" : "transparent",
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            transition: "background 120ms ease",
            fontFamily: "var(--font-body)",
            width: "100%",
            textAlign: "left" as const,
          };
          const iconColor = isActive
            ? (item.id === "collection" ? "var(--terra)" : "var(--plum)")
            : "var(--ink-soft)";
          const inner = (
            <>
              {item.icon && <item.icon
                aria-hidden="true"
                size={17}
                strokeWidth={1.5}
                color={iconColor}
                fill={isActive && item.id === "collection" ? "var(--terra)" : "none"}
              />}
              <span style={{ flex: 1 }}>{NAV_LABELS[item.id]?.[uiLang] ?? NAV_LABELS[item.id]?.en}</span>
              {count !== undefined && (
                <span style={{ fontSize: 11, color: "var(--ink-softer)" }}>{count}</span>
              )}
            </>
          );

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (item.id === "home" && pathname === "/") {
                  window.dispatchEvent(new Event("wex-go-home"));
                }
              }}
              style={{ ...sharedStyle, textDecoration: "none" }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ margin: "1rem 0 0.5rem", height: 1, background: "var(--paper-edge)" }} />

      {/* Stats — Contact/Instagram/About/Emoji map moved to Profil (Lot N1) */}
      <p style={{ fontSize: 11, color: "var(--ink-softer)", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
        {(() => {
          const s = STATS_LABEL[uiLang] ?? STATS_LABEL.en;
          const fmt = (n: number | undefined) => n !== undefined ? n.toLocaleString(uiLang) : "…";
          return (
            <>
              {s.expressions(fmt(globalStats?.expressions))}
              <br />
              {s.languages(fmt(globalStats?.languages))} · {s.countries(fmt(countryCount))}
            </>
          );
        })()}
      </p>
    </aside>
  );
}

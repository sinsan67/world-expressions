"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Globe, Lightbulb, Dice5, Heart } from "lucide-react";
import { getCarnet } from "@/lib/carnet";

const BASE_NAV_ITEMS = [
  { id: "home",      icon: Home,       href: "/",        count: undefined as number | undefined },
  { id: "atlas",     icon: Globe,      href: "/atlas",   count: 14 },
  { id: "concepts",  icon: Lightbulb,  href: "/concepts",count: 1050 },
  { id: "random",    icon: Dice5,      href: "/random",  count: undefined as number | undefined },
  { id: "favorites", icon: Heart,      href: "/carnet",  count: undefined as number | undefined },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  home:      { fr: "Accueil",   en: "Home",      es: "Inicio",     it: "Home",      tr: "Ana sayfa" },
  atlas:     { fr: "Atlas",     en: "Atlas",      es: "Atlas",      it: "Atlante",   tr: "Atlas" },
  concepts:  { fr: "Concepts",  en: "Concepts",   es: "Conceptos",  it: "Concetti",  tr: "Kavramlar" },
  random:    { fr: "Au hasard", en: "Random",     es: "Al azar",    it: "A caso",    tr: "Rastgele" },
  favorites: { fr: "Favoris",   en: "Favourites", es: "Favoritos",  it: "Preferiti", tr: "Favoriler" },
};

const LANG_LABEL: Record<string, string> = {
  fr: "Langue", en: "Language", es: "Idioma", it: "Lingua", tr: "Dil",
};

const LANGS = ["fr", "en", "es", "it", "tr"] as const;
type UILang = typeof LANGS[number];

type Props = {
  uiLang: string;
  onLangChange: (lang: UILang) => void;
};

export default function Sidebar({ uiLang, onLangChange }: Props) {
  const pathname = usePathname();
  const [favCount, setFavCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const carnet = getCarnet();
    const n = carnet.favorites.length;
    setFavCount(n > 0 ? n : undefined);
  }, []);

  const navItems = BASE_NAV_ITEMS.map((item) =>
    item.id === "favorites" ? { ...item, count: favCount } : item
  );

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
          Every language has its own madness.
        </p>
      </a>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {navItems.map((item) => {
          const isActive = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--r-sm)",
                textDecoration: "none",
                color: isActive ? "var(--plum)" : "var(--ink-soft)",
                background: isActive ? "var(--plum-bg)" : "transparent",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: "background 120ms ease",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <item.icon
                size={17}
                strokeWidth={1.5}
                color={isActive
                  ? (item.id === "favorites" ? "var(--terra)" : "var(--plum)")
                  : "var(--ink-soft)"}
                fill={isActive && item.id === "favorites" ? "var(--terra)" : "none"}
              />
              <span style={{ flex: 1 }}>{NAV_LABELS[item.id]?.[uiLang] ?? NAV_LABELS[item.id]?.fr}</span>
              {item.count !== undefined && (
                <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ margin: "1.25rem 0", height: 1, background: "var(--paper-edge)" }} />

      {/* Language picker */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-faint)", marginBottom: "0.5rem", fontFamily: "var(--font-body)" }}>
          {LANG_LABEL[uiLang] ?? "Language"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => onLangChange(lang)}
              style={{
                fontSize: 11, fontWeight: 700, padding: "3px 8px",
                borderRadius: "var(--r-pill)",
                border: `1.5px solid ${uiLang === lang ? "var(--ink)" : "var(--paper-edge)"}`,
                background: uiLang === lang ? "var(--ink)" : "transparent",
                color: uiLang === lang ? "var(--paper)" : "var(--ink-soft)",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 120ms ease",
                fontFamily: "var(--font-body)",
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ margin: "1rem 0 0.5rem", height: 1, background: "var(--paper-edge)" }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <a href="mailto:worldsexpressions@proton.me" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          Contact
        </a>
        <a href="/instagram" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          Instagram
        </a>
      </div>
      <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: "0.75rem", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
        1 580+ expressions<br />5 langues · 14 pays
      </p>
    </aside>
  );
}

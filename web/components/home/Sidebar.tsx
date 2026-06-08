"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Globe, Lightbulb, Search, Heart } from "lucide-react";
import { getCarnet } from "@/lib/carnet";
import SearchOverlay from "@/components/SearchOverlay";

const BASE_NAV_ITEMS = [
  { id: "home",      icon: Home,       href: "/",         count: undefined as number | undefined },
  { id: "atlas",     icon: Globe,      href: "/atlas",    count: 7 },
  { id: "concepts",  icon: Lightbulb,  href: "/emoji", count: 1050 },
  { id: "search",    icon: Search,     href: null,        count: undefined as number | undefined },
  { id: "carnet",    icon: Heart,      href: "/profile",  count: undefined as number | undefined },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  home:      { fr: "Accueil",      en: "Home",       es: "Inicio",     it: "Home",      tr: "Ana sayfa" },
  atlas:     { fr: "Atlas",        en: "Atlas",       es: "Atlas",      it: "Atlante",   tr: "Atlas" },
  concepts:  { fr: "Concepts",     en: "Concepts",    es: "Conceptos",  it: "Concetti",  tr: "Kavramlar" },
  search:    { fr: "Rechercher",   en: "Search",      es: "Buscar",     it: "Cerca",     tr: "Ara" },
  carnet:    { fr: "Mon carnet",   en: "My notebook", es: "Mi cuaderno", it: "Il mio taccuino", tr: "Defterim" },
};

const TAGLINE: Record<string, string> = {
  fr: "Chaque langue a sa propre folie.",
  en: "Every language has its own madness.",
  es: "Cada lengua tiene su propia locura.",
  it: "Ogni lingua ha la sua follia.",
  tr: "Her dilin kendine özgü bir çılgınlığı var.",
};

type Props = {
  uiLang: string;
};

export default function Sidebar({ uiLang }: Props) {
  const pathname = usePathname();
  const [favCount, setFavCount] = useState<number | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const n = getCarnet().favorites.length;
      setFavCount(n > 0 ? n : undefined);
    };
    update();
    window.addEventListener("wex-carnet-updated", update);
    return () => window.removeEventListener("wex-carnet-updated", update);
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
          {TAGLINE[uiLang] ?? TAGLINE.en}
        </p>
      </a>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {navItems.map((item) => {
          const isActive = item.href !== null && pathname === item.href;
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
            ? (item.id === "favorites" ? "var(--terra)" : "var(--plum)")
            : "var(--ink-soft)";
          const inner = (
            <>
              <item.icon
                size={17}
                strokeWidth={1.5}
                color={iconColor}
                fill={isActive && item.id === "favorites" ? "var(--terra)" : "none"}
              />
              <span style={{ flex: 1 }}>{NAV_LABELS[item.id]?.[uiLang] ?? NAV_LABELS[item.id]?.fr}</span>
              {item.count !== undefined && (
                <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{item.count}</span>
              )}
            </>
          );

          if (item.href === null) {
            return (
              <button
                key={item.id}
                onClick={() => setSearchOpen(true)}
                style={{ ...sharedStyle, border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {inner}
              </button>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{ ...sharedStyle, textDecoration: "none" }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {searchOpen && <SearchOverlay uiLang={uiLang} onClose={() => setSearchOpen(false)} />}

      <div style={{ flex: 1 }} />
      <div style={{ margin: "1rem 0 0.5rem", height: 1, background: "var(--paper-edge)" }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <a href="mailto:worldsexpressions@proton.me" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          Contact
        </a>
        <a href="https://www.instagram.com/world.expressions" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          Instagram
        </a>
        <a href="/about" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          About
        </a>
        <a href="/emojis" style={{ fontSize: 12, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}>
          Emoji map
        </a>
      </div>
      <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: "0.75rem", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
        1 580+ expressions<br />5 langues · 7 pays
      </p>
    </aside>
  );
}

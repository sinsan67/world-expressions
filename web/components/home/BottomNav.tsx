"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, Lightbulb, Heart } from "lucide-react";

const NAV_ITEMS = [
  { id: "home",      icon: Home,       href: "/" },
  { id: "atlas",     icon: Globe,      href: "/atlas" },
  { id: "concepts",  icon: Lightbulb,  href: "/concepts" },
  { id: "favorites", icon: Heart,      href: "/carnet" },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  home:      { fr: "Accueil",  en: "Home",       es: "Inicio",    it: "Home",      tr: "Ana sayfa" },
  atlas:     { fr: "Atlas",    en: "Atlas",       es: "Atlas",     it: "Atlante",   tr: "Atlas" },
  concepts:  { fr: "Concepts", en: "Concepts",    es: "Conceptos", it: "Concetti",  tr: "Kavramlar" },
  favorites: { fr: "Favoris",  en: "Favourites",  es: "Favoritos", it: "Preferiti", tr: "Favoriler" },
};

type Props = {
  uiLang?: string;
};

export default function BottomNav({ uiLang = "fr" }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="wex-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: "var(--paper)",
        borderTop: "1px solid var(--paper-edge)",
        zIndex: 50,
        boxShadow: "0 -2px 12px rgba(28,20,16,0.06)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.href !== "#" && pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 0 0.75rem",
              gap: "0.2rem",
              textDecoration: "none",
              color: isActive ? "var(--plum)" : "var(--ink-faint)",
              transition: "color 120ms ease",
            }}
          >
            <item.icon
              size={21}
              strokeWidth={1.5}
              color={isActive
                ? (item.id === "favorites" ? "var(--terra)" : "var(--plum)")
                : "var(--ink-faint)"}
              fill={isActive && item.id === "favorites" ? "var(--terra)" : "none"}
            />
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-body)" }}>
              {NAV_LABELS[item.id]?.[uiLang] ?? NAV_LABELS[item.id]?.fr}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

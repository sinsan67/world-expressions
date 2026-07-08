"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, Lightbulb, Search } from "lucide-react";
import SearchOverlay from "@/components/SearchOverlay";

// M2 layout: Search gets a tab (parity with desktop sidebar), the dice is the
// raised central action button, Carnet moves up to the top-right header heart.
const NAV_ITEMS = [
  { id: "home",      icon: Home,       href: "/" },
  { id: "search",    icon: Search,     href: null },
  { id: "random",    icon: null,       href: "/random-mode" },
  { id: "atlas",     icon: Globe,      href: "/atlas" },
  { id: "concepts",  icon: Lightbulb,  href: "/emoji" },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  home:      { fr: "Accueil",    en: "Home",     es: "Inicio",    it: "Home",      tr: "Ana sayfa", de: "Startseite", ja: "ホーム" },
  search:    { fr: "Rechercher", en: "Search",   es: "Buscar",    it: "Cerca",     tr: "Ara",       de: "Suchen",     ja: "検索" },
  random:    { fr: "Hasard",     en: "Random",   es: "Azar",      it: "Caso",      tr: "Rastgele",  de: "Zufall",     ja: "ランダム" },
  atlas:     { fr: "Atlas",      en: "Atlas",    es: "Atlas",     it: "Atlante",   tr: "Atlas",     de: "Atlas",      ja: "地図" },
  concepts:  { fr: "Concepts",   en: "Concepts", es: "Conceptos", it: "Concetti",  tr: "Kavramlar", de: "Konzepte",   ja: "概念" },
};

const NAV_ARIA_LABEL: Record<string, string> = {
  fr: "Navigation principale",
  en: "Main navigation",
  es: "Navegación principal",
  it: "Navigazione principale",
  tr: "Ana gezinme",
  de: "Hauptnavigation",
  ja: "メインナビゲーション",
};

type Props = {
  uiLang?: string;
};

export default function BottomNav({ uiLang = "fr" }: Props) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0.5rem 0 0.75rem",
    gap: "0.2rem",
    textDecoration: "none",
    background: "none",
    border: "none",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    color: isActive ? "var(--plum)" : "var(--ink-softer)",
    transition: "color 120ms ease",
  });

  const label = (id: string) => (
    <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-body)" }}>
      {NAV_LABELS[id]?.[uiLang] ?? NAV_LABELS[id]?.fr}
    </span>
  );

  return (
    <>
      <nav
        className="wex-bottom-nav"
        data-testid="bottom-nav"
        aria-label={NAV_ARIA_LABEL[uiLang] ?? NAV_ARIA_LABEL.en}
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "var(--paper)",
          borderTop: "1px solid var(--paper-edge)",
          zIndex: 50,
          boxShadow: "0 -2px 12px rgba(28,20,16,0.06)",
          alignItems: "flex-end",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href !== null && pathname === item.href;

          // Central raised dice button
          if (item.id === "random") {
            return (
              <Link
                key={item.id}
                href="/random-mode"
                aria-current={isActive ? "page" : undefined}
                style={itemStyle(isActive)}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--plum)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 25,
                    marginTop: -24,
                    boxShadow: "0 4px 0 var(--plum-deep), 0 6px 14px rgba(74,53,101,0.35)",
                    border: "3px solid var(--paper)",
                  }}
                >
                  🎲
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--plum)" }}>
                  {NAV_LABELS.random?.[uiLang] ?? NAV_LABELS.random?.fr}
                </span>
              </Link>
            );
          }

          // Search opens the overlay instead of navigating
          if (item.id === "search") {
            return (
              <button
                key={item.id}
                onClick={() => setSearchOpen(true)}
                style={itemStyle(false)}
              >
                <Search aria-hidden="true" size={21} strokeWidth={1.5} color="var(--ink-softer)" />
                {label(item.id)}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href!}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (item.id === "home" && pathname === "/") {
                  window.dispatchEvent(new Event("wex-go-home"));
                }
              }}
              style={itemStyle(isActive)}
            >
              {item.icon && (
                <item.icon
                  aria-hidden="true"
                  size={21}
                  strokeWidth={1.5}
                  color={isActive ? "var(--plum)" : "var(--ink-softer)"}
                />
              )}
              {label(item.id)}
            </Link>
          );
        })}
      </nav>
      {searchOpen && <SearchOverlay uiLang={uiLang} onClose={() => setSearchOpen(false)} />}
    </>
  );
}

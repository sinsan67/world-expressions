"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, Lightbulb, Heart } from "lucide-react";

const NAV_ITEMS = [
  { id: "home",      icon: Home,       href: "/" },
  { id: "atlas",     icon: Globe,      href: "/atlas" },
  { id: "concepts",  icon: Lightbulb,  href: "/emoji" },
  { id: "carnet",    icon: Heart,      href: "/profile" },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  home:      { fr: "Accueil",  en: "Home",       es: "Inicio",    it: "Home",      tr: "Ana sayfa", de: "Startseite", ja: "ホーム" },
  atlas:     { fr: "Atlas",    en: "Atlas",       es: "Atlas",     it: "Atlante",   tr: "Atlas",     de: "Atlas",      ja: "地図" },
  concepts:  { fr: "Concepts", en: "Concepts",    es: "Conceptos", it: "Concetti",  tr: "Kavramlar", de: "Konzepte",   ja: "概念" },
  carnet:    { fr: "Carnet",   en: "Notebook",    es: "Cuaderno",  it: "Taccuino",  tr: "Defter",    de: "Notizbuch",  ja: "ノート" },
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

  return (
    <nav
      className="wex-bottom-nav"
      aria-label={NAV_ARIA_LABEL[uiLang] ?? NAV_ARIA_LABEL.en}
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
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 0 0.75rem",
              gap: "0.2rem",
              textDecoration: "none",
              color: isActive ? "var(--plum)" : "var(--ink-softer)",
              transition: "color 120ms ease",
            }}
          >
            <item.icon
              aria-hidden="true"
              size={21}
              strokeWidth={1.5}
              color={isActive ? "var(--plum)" : "var(--ink-softer)"}
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

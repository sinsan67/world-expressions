"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, Lightbulb, Heart } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home,      label: "Accueil",  href: "/" },
  { icon: Globe,     label: "Atlas",    href: "/atlas" },
  { icon: Lightbulb, label: "Concepts", href: "/concepts" },
  { icon: Heart,     label: "Favoris",  href: "/carnet" },
];

export default function BottomNav() {
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
            key={item.label}
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
                ? (item.label === "Favoris" ? "var(--terra)" : "var(--plum)")
                : "var(--ink-faint)"}
              fill={isActive && item.label === "Favoris" ? "var(--terra)" : "none"}
            />
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-body)" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

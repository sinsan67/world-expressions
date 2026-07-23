"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NAV_LABELS, NAV_ARIA_LABEL } from "@/components/home/navConfig";
import { useFavoritesCount } from "@/lib/useFavoritesCount";
import type { UILang } from "@/lib/useUILang";

type Props = {
  uiLang?: UILang;
};

export default function BottomNav({ uiLang = "fr" }: Props) {
  const pathname = usePathname();
  const favCount = useFavoritesCount();

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

  const label = (id: keyof typeof NAV_LABELS) => (
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

          // Central raised dice button — quick game launcher, not a nav destination
          if (item.id === "random") {
            return (
              <Link
                key={item.id}
                href="/voyage?quick=1"
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
                <span style={{ position: "relative", display: "flex" }}>
                  <item.icon
                    aria-hidden="true"
                    size={21}
                    strokeWidth={1.5}
                    color={isActive ? "var(--plum)" : "var(--ink-softer)"}
                  />
                  {item.id === "collection" && favCount !== undefined && favCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -8,
                        background: "var(--plum)",
                        color: "white",
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "1px 5px",
                        fontFamily: "var(--font-body)",
                        lineHeight: 1.4,
                      }}
                    >
                      {favCount}
                    </span>
                  )}
                </span>
              )}
              {label(item.id)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

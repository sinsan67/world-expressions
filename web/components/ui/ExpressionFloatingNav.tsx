"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExpressionNeighbors, ExpressionNeighbors } from "@/lib/api";
import { FLAG } from "@/lib/constants";

type Mode = "random" | "country" | "tag";
type UILang = "fr" | "en" | "es" | "tr" | "it" | "de" | "ja";

const T: Record<UILang, { random: string; country: string; tag: string }> = {
  fr: { random: "Aléatoire", country: "Même pays", tag: "Même thème" },
  en: { random: "Random",    country: "Same country", tag: "Same theme" },
  es: { random: "Aleatorio", country: "Mismo país", tag: "Mismo tema" },
  tr: { random: "Rastgele",  country: "Aynı ülke",   tag: "Aynı konu" },
  it: { random: "Casuale",   country: "Stesso paese", tag: "Stesso tema" },
  de: { random: "Zufällig",  country: "Gleiches Land", tag: "Gleiches Thema" },
  ja: { random: "ランダム",  country: "同じ国",        tag: "同じテーマ" },
};

interface Props {
  expressionId: string;
  country: string;
  tags: string[];
  uiLang: UILang;
  tagNames: Record<string, string>;
}

export default function ExpressionFloatingNav({ expressionId, country, tags, uiLang, tagNames }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("random");
  const [neighbors, setNeighbors] = useState<ExpressionNeighbors | null>(null);
  const neighborsRef = useRef<ExpressionNeighbors | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const primaryTag = tags[0] || "";
  const t = T[uiLang];

  const fetchNeighbors = useCallback(async (m: Mode) => {
    try {
      const data = await getExpressionNeighbors(expressionId, m, country, primaryTag);
      setNeighbors(data);
      neighborsRef.current = data;
      if (data.mode_used !== m) {
        setMode(data.mode_used);
      }
    } catch {}
  }, [expressionId, country, primaryTag]);

  useEffect(() => {
    fetchNeighbors(mode);
  }, [fetchNeighbors, mode]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Swipe detection — document-level to cover the whole page
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (Math.abs(dx) > 60 && dy < 40) {
        const nb = neighborsRef.current;
        const id = dx < 0 ? nb?.next?.id : nb?.prev?.id;
        if (id) router.push(`/expression/${id}`);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  function modeIcon(m: Mode) {
    if (m === "random") return "🎲";
    if (m === "country") return FLAG[country] || "🗺️";
    return "🏷️";
  }

  function modeLabel(m: Mode) {
    if (m === "random") return t.random;
    if (m === "country") return t.country;
    return t.tag;
  }

  const effectiveMode = neighbors?.mode_used ?? mode;

  function FloatBtn({ id, arrow }: { id: string | null | undefined; arrow: "‹" | "›" }) {
    return (
      <button
        className="expr-float-btn"
        onClick={() => { if (id) router.push(`/expression/${id}`); }}
        disabled={!id}
        style={{
          borderRadius: "50%",
          background: "var(--paper)",
          border: "1px solid var(--paper-edge)",
          boxShadow: "var(--shadow-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: id ? "pointer" : "default",
          opacity: id ? 1 : 0.3,
          transition: "all 0.15s",
          color: "var(--ink)",
        }}
        onMouseEnter={(e) => { if (id) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--plum)"; el.style.color = "white"; el.style.borderColor = "transparent"; } }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--paper)"; el.style.color = "var(--ink)"; el.style.borderColor = "var(--paper-edge)"; }}
      >
        {arrow}
      </button>
    );
  }

  return (
    <>
      {/* Left ‹ */}
      <div className="expr-float-left">
        <FloatBtn id={neighbors?.prev?.id} arrow="‹" />
      </div>

      {/* Right › */}
      <div className="expr-float-right">
        <FloatBtn id={neighbors?.next?.id} arrow="›" />
      </div>

      {/* Mode badge — centered at bottom, opens dropdown upward */}
      <div className="expr-mode-switcher" ref={menuRef} style={{ position: "fixed" }}>
        {/* Dropdown (opens upward) */}
        {showMenu && (
          <div style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--paper)",
            border: "1px solid var(--paper-edge)",
            borderRadius: 14,
            boxShadow: "var(--shadow-card)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 150,
            zIndex: 50,
          }}>
            {(["random", "country", "tag"] as Mode[]).map((m) => {
              const active = effectiveMode === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); setShowMenu(false); }}
                  style={{
                    fontSize: 13,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--plum)" : "transparent",
                    color: active ? "white" : "var(--ink)",
                    fontWeight: active ? 600 : 400,
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span>{modeIcon(m)}</span>
                  {modeLabel(m)}
                </button>
              );
            })}
          </div>
        )}

        {/* Badge button */}
        <button
          className="expr-mode-badge"
          onClick={() => setShowMenu(v => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "var(--ink-faint)",
            background: "var(--paper)",
            border: "1px solid var(--paper-edge)",
            borderRadius: 12,
            padding: "3px 10px",
            whiteSpace: "nowrap",
            lineHeight: 1.4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--paper-edge)"; }}
        >
          <span>{modeIcon(effectiveMode)}</span>
          <span style={{ fontSize: "0.75em", opacity: 0.6 }}>▾</span>
        </button>
      </div>
    </>
  );
}

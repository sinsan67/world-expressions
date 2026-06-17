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

  function contextLabel() {
    if (!neighbors) return "";
    if (neighbors.mode_used === "random") return "🎲";
    if (neighbors.mode_used === "country") return FLAG[country] || "🗺️";
    if (neighbors.mode_used === "tag") return `🏷️ ${tagNames[primaryTag] || primaryTag}`;
    return "";
  }

  const badge = (
    <div style={{
      fontSize: 10,
      textAlign: "center",
      color: "var(--ink-faint)",
      background: "var(--paper)",
      border: "1px solid var(--paper-edge)",
      borderRadius: 10,
      padding: "2px 7px",
      whiteSpace: "nowrap",
      lineHeight: 1.4,
      maxWidth: 70,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      {contextLabel()}
    </div>
  );

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
      <div className="expr-float-left" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <FloatBtn id={neighbors?.prev?.id} arrow="‹" />
        {badge}
      </div>

      {/* Right › */}
      <div className="expr-float-right" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <FloatBtn id={neighbors?.next?.id} arrow="›" />
        {badge}
      </div>

      {/* Mode switcher */}
      <div className="expr-mode-switcher" style={{
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: 30,
        boxShadow: "var(--shadow-card)",
        display: "flex",
        alignItems: "center",
        padding: 4,
        gap: 2,
      }}>
        {(["random", "country", "tag"] as Mode[]).map((m) => {
          const active = mode === m;
          const label = m === "random"
            ? `🎲 ${t.random}`
            : m === "country"
            ? `${FLAG[country] || "🗺️"} ${t.country}`
            : `🏷️ ${t.tag}`;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background: active ? "var(--plum)" : "transparent",
                color: active ? "white" : "var(--ink-faint)",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}

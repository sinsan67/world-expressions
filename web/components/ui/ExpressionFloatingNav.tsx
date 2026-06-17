"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExpressionNeighbors, ExpressionNeighbors } from "@/lib/api";

interface Props {
  expressionId: string;
  country: string;
  kind: string;
  uiLang: string;
}

export default function ExpressionFloatingNav({ expressionId, country, kind }: Props) {
  const router = useRouter();
  const [neighbors, setNeighbors] = useState<ExpressionNeighbors | null>(null);
  const neighborsRef = useRef<ExpressionNeighbors | null>(null);

  const fetchNeighbors = useCallback(async () => {
    try {
      const data = await getExpressionNeighbors(expressionId, "country_type", country, "", kind);
      setNeighbors(data);
      neighborsRef.current = data;
    } catch {}
  }, [expressionId, country, kind]);

  useEffect(() => {
    fetchNeighbors();
  }, [fetchNeighbors]);

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
      <div className="expr-float-left">
        <FloatBtn id={neighbors?.prev?.id} arrow="‹" />
      </div>
      <div className="expr-float-right">
        <FloatBtn id={neighbors?.next?.id} arrow="›" />
      </div>
    </>
  );
}

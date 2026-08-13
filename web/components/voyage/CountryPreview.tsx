"use client";

/**
 * Non-blocking preview shown below CountryMap after a manual pin tap
 * (never on the initial/URL-prefilled selection — VoyageSetup only opens
 * this from CountryMap's onPreview, not from the useState initializer).
 * Selection itself stays 1-tap as before; this panel is a bonus, not a
 * gate — dismissing it never touches the selected country.
 */

import { useEffect, useState } from "react";
import { getRandomExpression, Expression } from "@/lib/api";
import { getTypeLabel } from "@/lib/typeLabels";
import { useFavorite } from "@/lib/useFavorite";
import { VOYAGE_SETUP, VOYAGE_PLAY } from "@/lib/voyageLabels";
import { KIND_EMOJI } from "./VoyageSetup";

type Props = {
  uiLang: string;
  country: string;
  kind: string;
  domain: string;
  onClose: () => void;
};

export default function CountryPreview({ uiLang, country, kind, domain, onClose }: Props) {
  const t = VOYAGE_SETUP[uiLang] ?? VOYAGE_SETUP.en;
  const playT = VOYAGE_PLAY[uiLang] ?? VOYAGE_PLAY.en;
  const [expr, setExpr] = useState<Expression | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fav, handleFav] = useFavorite(expr?.id ?? "");
  // Mount-triggered fade — content already changes under the same DOM node
  // (country/refresh both key the fetch, not a remount), so this only
  // needs to play once when the panel first appears.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEmpty(false);
    getRandomExpression(uiLang, country, kind, domain)
      .then((data) => {
        if (cancelled) return;
        setExpr(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setExpr(null);
        setEmpty(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uiLang, country, kind, domain, refreshKey]);

  return (
    <div style={{ ...panelStyle, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-6px)" }}>
      <div style={panelHeadStyle}>
        <span style={panelLabelStyle}>{t.previewLabel}</span>
        <button onClick={onClose} aria-label={t.previewClose} style={panelCloseStyle}>✕</button>
      </div>

      {loading && <p style={panelMutedStyle}>{t.previewLoading}</p>}
      {!loading && empty && <p style={panelMutedStyle}>{t.previewEmpty}</p>}
      {!loading && !empty && expr && (
        <>
          <span style={kindBadgeStyle}>{KIND_EMOJI[expr.type] ?? "✨"} {getTypeLabel(expr.type, uiLang)}</span>
          <p style={exprTextStyle}>{expr.expression}</p>
          <p style={meaningTextStyle}>{expr.meaning}</p>
          <div style={panelActionsStyle}>
            <button onClick={() => setRefreshKey((k) => k + 1)} style={ghostBtnStyle}>
              {t.previewAnother}
            </button>
            <button onClick={handleFav} aria-pressed={fav} style={{ ...favBtnStyle, ...(fav ? favBtnActiveStyle : {}) }}>
              {fav ? playT.keptBtn : playT.keepBtn}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 16,
  padding: "12px 14px",
  marginTop: 9,
  transition: "opacity 0.18s ease, transform 0.18s ease",
};

const panelHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};

const panelLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--ink-faint)",
};

const panelCloseStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--ink-faint)",
  fontSize: 13,
  cursor: "pointer",
  padding: 4,
  lineHeight: 1,
};

const panelMutedStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--ink-faint)",
  margin: 0,
};

const kindBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--plum-deep)",
  background: "var(--plum-bg)",
  borderRadius: 999,
  padding: "2px 8px",
  marginBottom: 6,
};

const exprTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: 17,
  margin: "0 0 4px",
  color: "var(--ink)",
};

const meaningTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--ink-soft)",
  margin: "0 0 2px",
};

const panelActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 7,
  marginTop: 9,
};

const ghostBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1.5px solid var(--paper-edge)",
  background: "var(--paper)",
  color: "var(--ink-soft)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};

const favBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1.5px solid var(--paper-edge)",
  background: "white",
  color: "var(--ink-soft)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-body)",
};

const favBtnActiveStyle: React.CSSProperties = {
  borderColor: "var(--plum)",
  color: "var(--plum-deep)",
  background: "var(--plum-bg)",
};

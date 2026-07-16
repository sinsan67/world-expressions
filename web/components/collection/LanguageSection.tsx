"use client";

/**
 * Ma collection (/collection, lot C) — one language section: flag/name/
 * count header (collapsible), the 🧳/📚 mode badge (or a "choose" affordance
 * when the language has no mode yet — contract default: UI language =
 * mastered, others asked at first favorite), and the favorite rows.
 *
 * Mode-picking is CONTAINED to this component: it calls back up to
 * Collection.tsx (onSetMode) which handles the anon-local vs
 * logged-in-server split — this component has no opinion on persistence.
 */

import { useState } from "react";
import { LANG_FLAG, LANG_NAME } from "@/lib/constants";
import type { LanguageMode } from "@/lib/carnet";
import type { CollectionLabels } from "@/lib/collectionLabels";
import CollectionRow from "./CollectionRow";
import type { Expression } from "@/lib/api";

export type CollectionItem = {
  expression: Expression;
  savedAt: string;
  reviewBox: number;
  reviewedAt: string | null;
};

type Props = {
  language: string;
  items: CollectionItem[];
  totalFavorited: number;
  mode: LanguageMode | null;
  onSetMode: (language: string, mode: LanguageMode) => void;
  setCountTotal: number | null;
  uiLang: string;
  t: CollectionLabels;
};

export default function LanguageSection({ language, items, totalFavorited, mode, onSetMode, setCountTotal, uiLang, t }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [picking, setPicking] = useState(false);

  const flag = LANG_FLAG[language] ?? "🌍";
  const name = LANG_NAME[language] ?? language.toUpperCase();

  return (
    <div style={{ margin: "0.65rem 0" }}>
      <div
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCollapsed((c) => !c); }}
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          background: "var(--paper-deep)",
          border: "1.5px solid var(--paper-edge)",
          borderRadius: "var(--r-md)",
          padding: "0.6rem 0.75rem",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">{flag}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{name}</span>
        <span style={{ fontSize: 12, color: "var(--ink-softer)", fontWeight: 600 }}>
          {totalFavorited}
          {setCountTotal !== null && <> · {t.setCounter(totalFavorited, setCountTotal)}</>}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPicking((p) => !p)}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: mode
                ? `1.5px dashed ${mode === "discovery" ? "var(--plum-soft)" : "var(--ochre)"}`
                : "1.5px dashed var(--ink-faint)",
              background: mode ? (mode === "discovery" ? "var(--plum-bg)" : "var(--ochre-bg)") : "transparent",
              color: mode ? (mode === "discovery" ? "var(--plum-deep)" : "var(--ochre-deep)") : "var(--ink-softer)",
            }}
          >
            {mode === "discovery" ? t.mode.discovery : mode === "mastered" ? t.mode.mastered : t.mode.choose}
          </button>
          <span
            aria-hidden="true"
            style={{
              color: "var(--ink-faint)",
              fontSize: 13,
              display: "inline-block",
              transform: collapsed ? "rotate(-90deg)" : undefined,
              transition: "transform 150ms ease",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {picking && (
        <div style={{ display: "flex", gap: 8, padding: "8px 4px 2px", fontSize: 12.5, color: "var(--ink-soft)", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-hand)", fontSize: 15 }}>{t.mode.prompt}</span>
          <button
            onClick={() => { onSetMode(language, "discovery"); setPicking(false); }}
            style={{ fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: "var(--r-pill)", border: "1.5px solid var(--plum-soft)", background: "var(--plum-bg)", color: "var(--plum-deep)", cursor: "pointer" }}
          >
            {t.mode.discovery}
          </button>
          <button
            onClick={() => { onSetMode(language, "mastered"); setPicking(false); }}
            style={{ fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: "var(--r-pill)", border: "1.5px solid var(--ochre)", background: "var(--ochre-bg)", color: "var(--ochre-deep)", cursor: "pointer" }}
          >
            {t.mode.mastered}
          </button>
        </div>
      )}

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 8 }}>
          {items.map(({ expression, reviewedAt, reviewBox }) => (
            <CollectionRow
              key={expression.id}
              expression={expression}
              uiLang={uiLang}
              needsReview={reviewedAt !== null && reviewBox === 0}
              toReviewLabel={t.toReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

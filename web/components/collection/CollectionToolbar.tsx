"use client";

/**
 * Ma collection (/collection, lot C) — search + theme/type filters + sort.
 * All client-side, no backend calls (contract §5: "collection search/filter/
 * sort stays client-side in v1"). Themes/types use native <select>s rather
 * than the mockup's expandable chip menus — same "simple dropdown" behavior
 * with far less state to manage, matches this lot's scope.
 */

import { TYPE_LABELS, ExpressionType } from "@/lib/typeLabels";
import type { CollectionLabels } from "@/lib/collectionLabels";

export type ThemeOption = { slug: string; name: string };
export type SortOption = "date" | "name";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  themes: ThemeOption[];
  themeFilter: string | null;
  onThemeChange: (slug: string | null) => void;
  typeFilter: string | null;
  onTypeChange: (type: string | null) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  uiLang: string;
  t: CollectionLabels;
};

const TYPES: ExpressionType[] = ["idiom", "proverb", "locution", "word"];

function selectStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    padding: "5px 10px",
    borderRadius: "var(--r-pill)",
    border: `1.5px solid ${active ? "var(--plum)" : "var(--paper-edge)"}`,
    background: active ? "var(--plum-bg)" : "var(--paper)",
    color: active ? "var(--plum-deep)" : "var(--ink-soft)",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
  };
}

export default function CollectionToolbar({
  query, onQueryChange, themes, themeFilter, onThemeChange,
  typeFilter, onTypeChange, sortBy, onSortChange, uiLang, t,
}: Props) {
  return (
    <div style={{ margin: "0.25rem 0 1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1.5px solid var(--paper-edge)",
          borderRadius: "var(--r-pill)",
          padding: "0.5rem 0.9rem",
        }}
      >
        <span aria-hidden="true">🔎</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.search.placeholder}
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            fontSize: 13.5,
            fontFamily: "var(--font-body)",
            background: "transparent",
            color: "var(--ink)",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
        <select
          value={themeFilter ?? ""}
          onChange={(e) => onThemeChange(e.target.value || null)}
          style={selectStyle(!!themeFilter)}
        >
          <option value="">{t.filters.theme} — {t.filters.allThemes}</option>
          {themes.map((th) => (
            <option key={th.slug} value={th.slug}>{th.name}</option>
          ))}
        </select>

        <select
          value={typeFilter ?? ""}
          onChange={(e) => onTypeChange(e.target.value || null)}
          style={selectStyle(!!typeFilter)}
        >
          <option value="">{t.filters.type} — {t.filters.allTypes}</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>{TYPE_LABELS[type][uiLang] ?? TYPE_LABELS[type].en}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={selectStyle(true)}
        >
          <option value="date">{t.sort.byDate}</option>
          <option value="name">{t.sort.byName}</option>
        </select>
      </div>
    </div>
  );
}

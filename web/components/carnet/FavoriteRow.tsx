import Link from "next/link";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type Props = {
  expressionId: string;
  expression: Expression | null;
  savedAt: string;
  onRemove: () => void;
  uiLang: string;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function FavoriteRow({ expressionId, expression, savedAt, onRemove, uiLang }: Props) {
  const flag = expression ? (FLAG[expression.region] ?? "🌍") : "🌍";
  const country = expression ? (COUNTRY_NAME[expression.region] ?? expression.region.toUpperCase()) : "";
  const meaning = expression
    ? (uiLang !== expression.language && expression.translation?.meaning
        ? expression.translation.meaning
        : expression.meaning)
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "var(--paper)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--paper-edge)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Flag */}
      <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2, flexShrink: 0 }} title={country}>
        {flag}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/expression/${expressionId}?lang=${uiLang}`}
          style={{ textDecoration: "none" }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--ink)",
              lineHeight: 1.3,
              marginBottom: "0.2rem",
            }}
          >
            {expression ? expression.expression : expressionId}
          </p>
        </Link>
        {meaning && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--ink-softer)",
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {meaning}
          </p>
        )}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-faint)", marginTop: "0.3rem" }}>
          {fmtDate(savedAt)}
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "var(--terra)",
          padding: "0.2rem",
          flexShrink: 0,
          lineHeight: 1,
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        title="Retirer des favoris"
      >
        ♥
      </button>
    </div>
  );
}

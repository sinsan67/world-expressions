import Link from "next/link";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type Props = {
  expressionId: string;
  text: string;
  updatedAt: string;
  expression: Expression | null;
  uiLang: string;
};

export default function NoteCard({ expressionId, text, updatedAt, expression, uiLang }: Props) {
  const flag = expression ? (FLAG[expression.country || expression.region] ?? "🌍") : "🌍";

  return (
    <div
      style={{
        background: "var(--ochre-bg)",
        border: "1px solid var(--ochre-soft)",
        borderRadius: "var(--r-md)",
        padding: "0.875rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <Link href={`/expression/${expressionId}?lang=${uiLang}`} style={{ textDecoration: "none", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: 16 }}>{flag}</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 14,
            color: "var(--ink-soft)",
          }}
        >
          {expression ? expression.expression : expressionId}
        </span>
      </Link>

      <p
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: 16,
          color: "var(--ink)",
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--ochre-deep)", textAlign: "right" }}>
        {new Date(updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

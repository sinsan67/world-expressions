import Link from "next/link";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

type Props = {
  expressionId: string;
  region: string;
  language: string;
  viewedAt: string;
  expression: Expression | null;
  uiLang: string;
};

function fmtRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 2) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "hier";
    if (d < 7) return `il y a ${d} jours`;
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function HistoryRow({ expressionId, region, viewedAt, expression, uiLang }: Props) {
  const flag = FLAG[region] ?? FLAG[expression?.region ?? ""] ?? "🌍";
  const country = COUNTRY_NAME[region] ?? COUNTRY_NAME[expression?.region ?? ""] ?? region.toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 1rem",
        borderBottom: "1px solid var(--paper-edge)",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }} title={country}>{flag}</span>

      <Link
        href={`/expression/${expressionId}?lang=${uiLang}`}
        style={{ flex: 1, textDecoration: "none", minWidth: 0 }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 15,
            color: "var(--ink-soft)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {expression ? expression.expression : expressionId}
        </p>
      </Link>

      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>
        {fmtRelative(viewedAt)}
      </span>
    </div>
  );
}

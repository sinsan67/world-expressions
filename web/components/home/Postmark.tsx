import { FLAG } from "@/lib/constants";

type Props = {
  date: string;
  month: string;
  year: string;
  region?: string | null;
  size?: number;
  tilt?: number;
  inline?: boolean;
};

export default function Postmark({ date, month, year, region, size = 72, tilt = 8, inline }: Props) {
  const flag = region ? (FLAG[region] ?? null) : null;

  return (
    <div style={{
      ...(inline ? {} : { position: "absolute", top: "1rem", right: "1rem" }),
      transform: `rotate(${tilt}deg)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
    }}>
      {flag && (
        <span style={{
          fontSize: size * 0.39,
          lineHeight: 1,
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
        }}>
          {flag}
        </span>
      )}

      <div style={{
        width: size * 0.67,
        height: 1.5,
        background: "var(--terra)",
        opacity: 0.5,
      }} />

      <span style={{
        fontSize: size * 0.19,
        fontWeight: 700,
        color: "var(--terra)",
        lineHeight: 1,
        fontFamily: "var(--font-display)",
      }}>
        {date}
      </span>

      <span style={{
        fontSize: size * 0.125,
        fontWeight: 600,
        color: "var(--terra-deep)",
        letterSpacing: "0.06em",
        fontFamily: "var(--font-body)",
      }}>
        {month} &rsquo;{year.slice(-2)}
      </span>
    </div>
  );
}

import { COUNTRY_GRADIENT } from "@/lib/constants";

type Props = {
  date: string;
  month: string;
  year: string;
  region?: string | null;
  size?: number;
  tilt?: number;
};

export default function Postmark({ date, month, year, region, size = 72, tilt = 8 }: Props) {
  const gradient = region ? (COUNTRY_GRADIENT[region] ?? null) : null;

  return (
    <div style={{
      position: "absolute",
      top: "1rem",
      right: "1rem",
      width: size,
      height: size,
      borderRadius: "50%",
      background: gradient ?? undefined,
      border: gradient ? "2px solid rgba(255,255,255,0.65)" : "2px solid var(--terra)",
      boxShadow: gradient
        ? `inset 0 0 0 3px rgba(255,255,255,0.25)`
        : `inset 0 0 0 3px var(--terra-soft)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transform: `rotate(${tilt}deg)`,
      opacity: 0.88,
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: size * 0.22,
        fontWeight: 700,
        color: gradient ? "white" : "var(--terra)",
        lineHeight: 1.1,
        fontFamily: "var(--font-display)",
        textShadow: gradient ? "0 1px 2px rgba(0,0,0,0.4)" : undefined,
      }}>
        {date}
      </span>
      <span style={{
        fontSize: size * 0.13,
        fontWeight: 600,
        color: gradient ? "rgba(255,255,255,0.9)" : "var(--terra-deep)",
        letterSpacing: "0.05em",
        fontFamily: "var(--font-body)",
        textShadow: gradient ? "0 1px 2px rgba(0,0,0,0.35)" : undefined,
      }}>
        {month} &rsquo;{year.slice(-2)}
      </span>
    </div>
  );
}

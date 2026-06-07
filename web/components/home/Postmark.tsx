import { COUNTRY_GRADIENT } from "@/lib/constants";
import { FLAG } from "@/lib/constants";

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
  const flag = region ? (FLAG[region] ?? null) : null;

  return (
    <div style={{
      position: "absolute",
      top: flag ? "0.15rem" : "1rem",
      right: "1rem",
      width: size,
      transform: `rotate(${tilt}deg)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Flag emoji — breaks out above the circle */}
      {flag && (
        <div style={{
          fontSize: size * 0.32,
          lineHeight: 1,
          marginBottom: -(size * 0.12),
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.22))",
          position: "relative",
          zIndex: 2,
        }}>
          {flag}
        </div>
      )}

      {/* Circular stamp */}
      <div style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid var(--terra)",
        boxShadow: "inset 0 0 0 3px var(--terra-soft)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.9,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Very subtle flag gradient background */}
        {gradient && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: gradient,
            opacity: 0.1,
          }} />
        )}

        {/* Date text */}
        <span style={{
          fontSize: size * 0.22,
          fontWeight: 700,
          color: "var(--terra)",
          lineHeight: 1.1,
          fontFamily: "var(--font-display)",
          position: "relative",
          zIndex: 1,
        }}>
          {date}
        </span>
        <span style={{
          fontSize: size * 0.13,
          fontWeight: 600,
          color: "var(--terra-deep)",
          letterSpacing: "0.05em",
          fontFamily: "var(--font-body)",
          position: "relative",
          zIndex: 1,
        }}>
          {month} &rsquo;{year.slice(-2)}
        </span>
      </div>
    </div>
  );
}

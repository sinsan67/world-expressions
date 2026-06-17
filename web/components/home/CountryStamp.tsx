const COUNTRY_TINT: Record<string, string> = {
  fr: "#ebe3f1", uk: "#d8d8e6", us: "#f7e3d8", tr: "#f7e3d8",
  es: "#faf2cf", it: "#dde5d6", au: "#d8e0ee", ar: "#d8e0ee",
  cl: "#d8e0ee", mx: "#e0e4d4", co: "#f0dcb0", pe: "#f7e3d8",
  cu: "#d8e0ee", ve: "#faf2cf",
};

const SIZES = {
  sm: { w: 84,  h: 100, emojiSize: 22, labelSize: 9 },
  md: { w: 108, h: 130, emojiSize: 28, labelSize: 11 },
  lg: { w: 130, h: 155, emojiSize: 34, labelSize: 12 },
};

type Props = {
  country: string;
  flag: string;
  name: string;
  count?: number;
  size?: "sm" | "md" | "lg";
  tilt?: number;
  onClick?: () => void;
};

export default function CountryStamp({ country, flag, name, count, size = "md", tilt = 0, onClick }: Props) {
  const { w, h, emojiSize, labelSize } = SIZES[size];
  const tint = COUNTRY_TINT[country] ?? "var(--paper-deep)";

  return (
    <button
      onClick={onClick}
      className="country-stamp"
      style={{
        width: w,
        height: h,
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        transition: "transform 80ms ease, box-shadow 80ms ease",
        ["--stamp-tint" as string]: tint,
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.transform = `rotate(${tilt}deg) scale(1.04)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = tilt ? `rotate(${tilt}deg)` : "none"; }}
    >
      <div className="country-stamp__inner">
        <span style={{ fontSize: emojiSize }}>{flag}</span>
        <div>
          <div style={{ fontSize: labelSize, fontWeight: 700, color: "var(--ink-soft)", textAlign: "center", fontFamily: "var(--font-body)" }}>
            {name.split(" ")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 7, color: "var(--ink-faint)", textAlign: "center", marginTop: 1, fontFamily: "var(--font-body)", letterSpacing: "0.03em" }}>
            {count != null ? count.toLocaleString() : "WORLD EXPR."}
          </div>
        </div>
      </div>
    </button>
  );
}

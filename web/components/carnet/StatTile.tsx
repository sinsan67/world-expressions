type Props = {
  value: string | number;
  label: string;
  icon?: string;
  size?: "md" | "lg";
  tone?: "terra" | "plum";
};

export default function StatTile({ value, label, icon, size = "md", tone }: Props) {
  const valueSize = size === "lg" ? 32 : 26;
  const labelSize = size === "lg" ? 12 : 11;
  const accentColor = tone === "terra" ? "var(--terra)" : tone === "plum" ? "var(--plum)" : "var(--ink)";

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        padding: size === "lg" ? "1rem 1.25rem" : "0.75rem 1rem",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: valueSize,
            fontWeight: 500,
            color: accentColor,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {icon && (
          <span style={{ fontSize: valueSize * 0.6, color: accentColor }}>{icon}</span>
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: labelSize,
          color: "var(--ink-softer)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}

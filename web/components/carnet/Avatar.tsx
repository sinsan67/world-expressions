type Props = {
  initial: string;
  size?: number;
  tone?: "terra" | "plum";
};

export default function Avatar({ initial, size = 64, tone = "terra" }: Props) {
  const bg = tone === "terra" ? "var(--terra-bg)" : "var(--plum-bg)";
  const color = tone === "terra" ? "var(--terra)" : "var(--plum)";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: size * 0.5,
          color,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

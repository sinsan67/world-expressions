type Props = {
  icon: string;
  name: string;
  tone?: "plain" | "plum";
  onClick: () => void;
};

export default function ConceptChip({ icon, name, tone = "plain", onClick }: Props) {
  const isPlum = tone === "plum";
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "5px 13px",
        borderRadius: "var(--r-pill)",
        border: `1.5px solid ${isPlum ? "var(--plum-soft)" : "var(--paper-edge)"}`,
        background: isPlum ? "var(--plum-bg)" : "var(--paper)",
        color: isPlum ? "var(--plum)" : "var(--ink-soft)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "border-color 150ms ease, background 150ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--ink)";
        el.style.background = "var(--paper-deep)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isPlum ? "var(--plum-soft)" : "var(--paper-edge)";
        el.style.background = isPlum ? "var(--plum-bg)" : "var(--paper)";
      }}
    >
      {icon} {name}
    </button>
  );
}

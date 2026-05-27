type Props = {
  label: string;
  cta: string;
  onDismiss?: () => void;
};

export default function AccountBanner({ label, cta, onDismiss }: Props) {
  return (
    <div
      style={{
        background: "var(--ochre-bg)",
        border: "1px solid var(--ochre-soft)",
        borderRadius: "var(--r-md)",
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        animation: "fadeSlideUp 0.3s ease-out both",
      }}
    >
      <span style={{ fontSize: 18 }}>📓</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)" }}>
          {label}{" "}
          <button
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--plum)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {cta}
          </button>
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "var(--ink-faint)",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

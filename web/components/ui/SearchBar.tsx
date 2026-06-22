type Props = {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder: string;
  searchLabel: string;
  loading: boolean;
  emoji?: string;
};

export default function SearchBar({ value, onChange, onSearch, placeholder, searchLabel, loading, emoji }: Props) {
  return (
    <div style={{ display: "flex", gap: "var(--wex-grid-gap)" }}>
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
        {emoji && (
          <span style={{ position: "absolute", left: 14, fontSize: "calc(var(--wex-search-input-size) + 1px)", pointerEvents: "none", userSelect: "none" }}>
            {emoji}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={placeholder}
          className="wex-input"
          style={{
            width: "100%",
            paddingLeft: emoji ? "2.5rem" : "1.25rem",
            paddingRight: "1rem",
            paddingTop: "0.625rem",
            paddingBottom: "0.625rem",
            borderRadius: "var(--r-pill)",
            border: "1.5px solid var(--paper-edge)",
            background: "var(--paper)",
            color: "var(--ink)",
            fontSize: "var(--wex-search-input-size)",
            boxShadow: "var(--shadow-card)",
            fontFamily: "var(--font-body)",
            transition: "border-color 150ms ease, box-shadow 150ms ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--ink)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(28,20,16,0.06)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--paper-edge)";
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
          }}
        />
      </div>
      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          padding: "0.625rem 1.1rem",
          borderRadius: "var(--r-pill)",
          border: "none",
          background: "var(--plum)",
          color: "var(--paper)",
          fontSize: "var(--wex-button-size)",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "var(--font-body)",
          whiteSpace: "nowrap",
          transition: "background 150ms ease, opacity 150ms ease",
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--plum-deep)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--plum)"; }}
      >
        {loading ? "…" : searchLabel}
      </button>
    </div>
  );
}

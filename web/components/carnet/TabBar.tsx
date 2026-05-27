type Tab = {
  id: string;
  icon: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export default function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.25rem",
        background: "var(--paper-deep)",
        borderRadius: "var(--r-pill)",
        border: "1px solid var(--paper-edge)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.3rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "var(--r-pill)",
              border: "none",
              background: isActive ? "var(--paper)" : "transparent",
              color: isActive ? "var(--plum)" : "var(--ink-softer)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              boxShadow: isActive ? "var(--shadow-card)" : "none",
              transition: "all 150ms ease",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  color: isActive ? "var(--plum-soft)" : "var(--ink-faint)",
                  fontWeight: 400,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

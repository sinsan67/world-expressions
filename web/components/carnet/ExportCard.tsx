import { exportJSON, exportCSV } from "@/lib/carnet";

type Props = {
  title: string;
  labelJSON: string;
  labelCSV: string;
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportCard({ title, labelJSON, labelCSV }: Props) {
  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        padding: "1rem",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", marginBottom: "0.75rem", fontWeight: 500 }}>
        {title}
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => download(exportJSON(), "carnet.json")}
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "var(--r-sm)",
            border: "1.5px solid var(--paper-edge)",
            background: "var(--paper-deep)",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--ink)"; el.style.color = "var(--ink)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--paper-edge)"; el.style.color = "var(--ink-soft)"; }}
        >
          ↓ {labelJSON}
        </button>
        <button
          onClick={() => download(exportCSV(), "carnet.csv")}
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "var(--r-sm)",
            border: "1.5px solid var(--paper-edge)",
            background: "var(--paper-deep)",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--ink)"; el.style.color = "var(--ink)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--paper-edge)"; el.style.color = "var(--ink-soft)"; }}
        >
          ↓ {labelCSV}
        </button>
      </div>
    </div>
  );
}

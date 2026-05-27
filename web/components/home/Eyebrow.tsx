type Props = {
  children: React.ReactNode;
  tone?: "terra" | "plum" | "softer" | "on-photo";
};

const COLORS = {
  terra:      "var(--terra)",
  plum:       "var(--plum)",
  softer:     "var(--ink-softer)",
  "on-photo": "rgba(255,255,255,0.75)",
};

export default function Eyebrow({ children, tone = "softer" }: Props) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: COLORS[tone],
      margin: 0,
      fontFamily: "var(--font-body)",
    }}>
      {children}
    </p>
  );
}

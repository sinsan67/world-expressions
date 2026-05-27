type Props = {
  date: string;
  month: string;
  year: string;
  size?: number;
  tilt?: number;
};

export default function Postmark({ date, month, year, size = 72, tilt = 8 }: Props) {
  return (
    <div style={{
      position: "absolute",
      top: "1rem",
      right: "1rem",
      width: size,
      height: size,
      borderRadius: "50%",
      border: "2px solid var(--terra)",
      boxShadow: `inset 0 0 0 3px var(--terra-soft)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transform: `rotate(${tilt}deg)`,
      opacity: 0.82,
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: size * 0.22,
        fontWeight: 700,
        color: "var(--terra)",
        lineHeight: 1.1,
        fontFamily: "var(--font-display)",
      }}>
        {date}
      </span>
      <span style={{
        fontSize: size * 0.13,
        fontWeight: 600,
        color: "var(--terra-deep)",
        letterSpacing: "0.05em",
        fontFamily: "var(--font-body)",
      }}>
        {month} &rsquo;{year.slice(-2)}
      </span>
    </div>
  );
}

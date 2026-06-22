type Props = {
  tilt?: number;
  large?: boolean;
  children: React.ReactNode;
};

export default function Postcard({ tilt = -0.4, large, children }: Props) {
  return (
    <div style={{
      background: "var(--paper)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--paper-edge)",
      boxShadow: "var(--shadow-postcard)",
      padding: large ? "var(--wex-card-padding-lg)" : "var(--wex-card-padding-md)",
      transform: `rotate(${tilt}deg)`,
      position: "relative",
      transition: "box-shadow 150ms ease",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

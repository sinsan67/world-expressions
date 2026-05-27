"use client";
import { useEffect, useState } from "react";

type Props = {
  flag: string;
  name: string;
  seen: number;
  total: number;
};

export default function CountryProgressBar({ flag, name, seen, total }: Props) {
  const [width, setWidth] = useState(0);
  const pct = total > 0 ? Math.round((seen / total) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span>{flag}</span>
          <span>{name}</span>
        </span>
        <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--ink-softer)" }}>
          {seen}/{total}
        </span>
      </div>
      <div style={{ height: 5, background: "var(--paper-deep)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: "linear-gradient(90deg, var(--terra-soft), var(--terra))",
            borderRadius: "var(--r-pill)",
            transition: "width 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

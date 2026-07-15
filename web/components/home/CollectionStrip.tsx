"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCarnet } from "@/lib/carnet";

// Hub collection teaser strip — total favorites count only (per-language
// breakdown needs /browse?ids= hydration, out of scope for lot A, see
// docs/pivot-lot0-contract.md §5). Links to /collection (lot C).

type Props = {
  title: string;
  countLabel: (n: number) => string;
  emptyLabel: string;
};

export default function CollectionStrip({ title, countLabel, emptyLabel }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCount(getCarnet().favorites.length);
    update();
    window.addEventListener("wex-carnet-updated", update);
    return () => window.removeEventListener("wex-carnet-updated", update);
  }, []);

  return (
    <Link
      href="/collection"
      data-testid="collection-strip"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "0.9rem 1rem 0",
        background: "var(--paper)",
        border: "1.5px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        padding: "0.75rem 0.9rem",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        transition: "border-color 150ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--paper-edge)"; }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>
          {title}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--ink-softer)" }}>
          {count === null ? "…" : count === 0 ? emptyLabel : countLabel(count)}
        </span>
      </div>
      <span aria-hidden="true" style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
    </Link>
  );
}

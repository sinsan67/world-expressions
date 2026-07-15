"use client";

/**
 * Heart link to the Collection (/collection) with a favorites-count badge.
 * Replaces the Carnet tab in the mobile bottom nav (M2 layout) — lives in
 * the top header instead, so it stays visible on every page.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getCarnet } from "@/lib/carnet";

const ARIA_LABEL: Record<string, string> = {
  fr: "Mon carnet",
  en: "My notebook",
  es: "Mi cuaderno",
  it: "Il mio taccuino",
  tr: "Defterim",
  de: "Mein Notizbuch",
  ja: "ノート",
};

type Props = {
  uiLang?: string;
  /** Icon color — pages with a photo hero pass a light color. */
  color?: string;
};

export default function CarnetHeartLink({ uiLang = "fr", color = "var(--ink-soft)" }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCarnet().favorites.length);
    update();
    window.addEventListener("wex-carnet-updated", update);
    return () => window.removeEventListener("wex-carnet-updated", update);
  }, []);

  return (
    <Link
      href="/collection"
      aria-label={ARIA_LABEL[uiLang] ?? ARIA_LABEL.en}
      style={{ position: "relative", display: "flex", alignItems: "center", color, textDecoration: "none" }}
    >
      <Heart aria-hidden="true" size={20} strokeWidth={1.6} />
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -8,
            background: "var(--plum)",
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 999,
            padding: "1px 5px",
            fontFamily: "var(--font-body)",
            lineHeight: 1.4,
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

"use client";

import { useState } from "react";
import type { UILang } from "@/lib/useUILang";

const LABELS: Record<UILang, { btn: string; done: string }> = {
  fr: { btn: "Partager",  done: "Lien copié !" },
  en: { btn: "Share",     done: "Link copied!" },
  es: { btn: "Compartir", done: "¡Copiado!" },
  it: { btn: "Condividi", done: "Copiato!" },
  tr: { btn: "Paylaş",    done: "Kopyalandı!" },
  de: { btn: "Teilen",    done: "Link kopiert!" },
  ja: { btn: "シェア",    done: "コピー済み！" },
};

export default function ShareButton({ uiLang }: { uiLang: UILang }) {
  const [copied, setCopied] = useState(false);
  const { btn, done } = LABELS[uiLang];

  async function handleShare() {
    const url = `${window.location.origin}?og_lang=${uiLang}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px 4px 8px",
        borderRadius: "var(--r-pill)",
        border: `1.5px solid ${copied ? "#86a87a" : "var(--paper-edge)"}`,
        background: copied ? "#eef5eb" : "var(--paper)",
        color: copied ? "#4a7c41" : "var(--ink-soft)",
        cursor: "pointer",
        transition: "all 150ms ease",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
      {copied ? done : btn}
    </button>
  );
}

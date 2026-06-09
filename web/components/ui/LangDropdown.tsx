"use client";

import { useState, useEffect, useRef } from "react";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de";

const LANGS: { code: UILang; flag: string; name: string }[] = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
];

type Props = { uiLang: UILang; onLangChange: (lang: UILang) => void };

export default function LangDropdown({ uiLang, onLangChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === uiLang) ?? LANGS[1];

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 9px 4px 7px",
          borderRadius: "var(--r-pill)",
          border: `1.5px solid ${open ? "var(--plum-soft)" : "var(--paper-edge)"}`,
          background: open ? "var(--plum-bg)" : "var(--paper)",
          color: open ? "var(--plum)" : "var(--ink-soft)",
          cursor: "pointer",
          transition: "all 120ms ease",
          fontFamily: "var(--font-body)",
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 11 }}>
          {current.code}
        </span>
        <span
          style={{
            fontSize: 8,
            opacity: 0.6,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 120ms",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "white",
            border: "1px solid var(--paper-edge)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 8px 24px rgba(28,20,16,0.14)",
            overflow: "hidden",
            minWidth: 152,
            zIndex: 100,
          }}
        >
          {LANGS.map((lang, i) => (
            <button
              key={lang.code}
              onClick={() => {
                onLangChange(lang.code);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                background: lang.code === uiLang ? "var(--plum-bg)" : "white",
                color: lang.code === uiLang ? "var(--plum)" : "var(--ink-soft)",
                fontWeight: lang.code === uiLang ? 600 : 400,
                border: "none",
                borderBottom: i < LANGS.length - 1 ? "1px solid var(--paper-edge)" : "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-body)",
                transition: "background 100ms",
              }}
            >
              <span style={{ fontSize: 16 }}>{lang.flag}</span>
              <span style={{ flex: 1 }}>{lang.name}</span>
              {lang.code === uiLang && (
                <span style={{ fontSize: 10, color: "var(--plum)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import type { UILang } from "@/lib/useUILang";

const LANGS: { code: UILang; flag: string; name: string }[] = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
];

// "Interface language" sheet title, localized.
const SHEET_TITLE: Record<UILang, string> = {
  fr: "Langue de l'interface",
  en: "Interface language",
  es: "Idioma de la interfaz",
  it: "Lingua dell'interfaccia",
  tr: "Arayüz dili",
  de: "Sprache der Oberfläche",
  ja: "表示言語",
};

type Props = { uiLang: UILang; onLangChange: (lang: UILang) => void };

export default function LangDropdown({ uiLang, onLangChange }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === uiLang) ?? LANGS[1];

  // Mirror the app's 1024px breakpoint: below it, use a bottom sheet (native mobile pattern).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Desktop: close on outside click. (Mobile sheet closes via its own backdrop.)
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    if (open && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open, isMobile]);

  const handlePick = (code: UILang) => {
    onLangChange(code);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        data-testid="lang-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
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
          boxShadow: "var(--shadow-card)",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 11 }}>
          {current.code}
        </span>
        <span
          aria-hidden="true"
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

      {/* ── Desktop dropdown ── */}
      {open && !isMobile && (
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
              data-testid={`lang-option-${lang.code}`}
              onClick={() => handlePick(lang.code)}
              aria-current={lang.code === uiLang ? "true" : undefined}
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
              <span aria-hidden="true" style={{ fontSize: 16 }}>{lang.flag}</span>
              <span style={{ flex: 1 }}>{lang.name}</span>
              {lang.code === uiLang && (
                <span aria-hidden="true" style={{ fontSize: 10, color: "var(--plum)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile bottom sheet ── */}
      {open && isMobile && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,20,16,0.35)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={SHEET_TITLE[uiLang] ?? SHEET_TITLE.en}
            style={{
              width: "100%",
              background: "var(--paper)",
              borderRadius: "var(--r-lg) var(--r-lg) 0 0",
              padding: "0.75rem 0 max(0.5rem, env(safe-area-inset-bottom))",
              boxShadow: "var(--shadow-deep)",
              animation: "wexSheetUp 0.25s ease",
            }}
          >
            <div
              style={{
                width: 36, height: 4, background: "var(--paper-fold)",
                borderRadius: 2, margin: "0 auto 0.7rem",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600,
                color: "var(--ink)", padding: "0 1.1rem 0.6rem",
              }}
            >
              {SHEET_TITLE[uiLang] ?? SHEET_TITLE.en}
            </div>
            {LANGS.map((lang) => (
              <button
                key={lang.code}
                data-testid={`lang-option-${lang.code}`}
                onClick={() => handlePick(lang.code)}
                aria-current={lang.code === uiLang ? "true" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "11px 1.1rem",
                  fontSize: 15,
                  background: lang.code === uiLang ? "var(--plum-bg)" : "transparent",
                  color: lang.code === uiLang ? "var(--plum)" : "var(--ink-soft)",
                  fontWeight: lang.code === uiLang ? 600 : 400,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.name}</span>
                {lang.code === uiLang && (
                  <span aria-hidden="true" style={{ fontSize: 12, color: "var(--plum)" }}>✓</span>
                )}
              </button>
            ))}
          </div>
          <style>{`@keyframes wexSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}

"use client";

import AuthButton from "./AuthButton";

type UILang = "fr" | "en" | "es" | "it" | "tr";
const LANGS: UILang[] = ["fr", "en", "es", "it", "tr"];

type Props = {
  uiLang: string;
  onLangChange: (lang: UILang) => void;
};

export default function LangBar({ uiLang, onLangChange }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "6px 12px",
        background: "var(--paper)",
        borderBottom: "1px solid var(--paper-edge)",
        borderLeft: "1px solid var(--paper-edge)",
        borderBottomLeftRadius: "var(--r-sm)",
      }}
    >
      <AuthButton />
      <span style={{ width: 1, height: 14, background: "var(--paper-edge)", margin: "0 0.2rem" }} />
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => onLangChange(lang)}
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "var(--r-pill)",
            border: `1.5px solid ${uiLang === lang ? "var(--ink)" : "var(--paper-edge)"}`,
            background: uiLang === lang ? "var(--ink)" : "transparent",
            color: uiLang === lang ? "var(--paper)" : "var(--ink-soft)",
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "all 120ms ease",
            fontFamily: "var(--font-body)",
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

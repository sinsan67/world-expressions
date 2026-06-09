"use client";

import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import ShareButton from "./ShareButton";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";

type Props = {
  uiLang: UILang;
  onLangChange: (lang: UILang) => void;
};

export default function LangBar({ uiLang, onLangChange }: Props) {
  return (
    <div
      className="wex-desktop-only"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 60,
        alignItems: "center",
        gap: "0.4rem",
        padding: "6px 12px",
        background: "var(--paper)",
        borderBottom: "1px solid var(--paper-edge)",
        borderLeft: "1px solid var(--paper-edge)",
        borderBottomLeftRadius: "var(--r-sm)",
      }}
    >
      <AuthButton />
      <span style={{ width: 1, height: 14, background: "var(--paper-edge)" }} />
      <ShareButton uiLang={uiLang} />
      <LangDropdown uiLang={uiLang} onLangChange={onLangChange} />
    </div>
  );
}

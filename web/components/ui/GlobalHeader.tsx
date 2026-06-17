"use client";

import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const { uiLang, setUILang } = useUILangContext();

  return (
    <div
      className="wex-desktop-only"
      style={{
        position: "fixed",
        top: "0.75rem",
        right: "1rem",
        zIndex: 50,
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
      <span style={{ width: 1, height: 14, background: "var(--paper-edge)", flexShrink: 0 }} />
      <AuthButton uiLang={uiLang} />
    </div>
  );
}

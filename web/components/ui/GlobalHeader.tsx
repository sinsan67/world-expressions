"use client";

import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const { uiLang, setUILang } = useUILangContext();

  return (
    <div
      style={{
        position: "fixed",
        top: "0.75rem",
        right: "1rem",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {/* Language switcher — visible on all viewports, including mobile */}
      <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
      {/* Auth stays desktop-only; on mobile it lives in the Carnet/profile tab */}
      <span
        className="wex-desktop-only"
        style={{ width: 1, height: 14, background: "var(--paper-edge)", flexShrink: 0 }}
      />
      <span className="wex-desktop-only" style={{ alignItems: "center" }}>
        <AuthButton uiLang={uiLang} />
      </span>
    </div>
  );
}

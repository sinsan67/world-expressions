"use client";

import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const { uiLang, setUILang } = useUILangContext();

  return (
    <div className="wex-global-header">
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

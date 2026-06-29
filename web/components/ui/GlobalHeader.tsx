"use client";

import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const { uiLang, setUILang } = useUILangContext();
  const isHome = usePathname() === "/";

  return (
    <div className="wex-global-header">
      {/* Language switcher. On the home page the mobile switcher lives inline in
          the hero header (flex-aligned with the wordmark), so hide this fixed one
          on mobile there — but keep it on desktop, which has no hero header. */}
      <span
        className={isHome ? "wex-desktop-only" : undefined}
        style={{ display: "flex", alignItems: "center" }}
      >
        <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
      </span>
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

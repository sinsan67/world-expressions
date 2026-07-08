"use client";

import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import CarnetHeartLink from "./CarnetHeartLink";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const { uiLang, setUILang } = useUILangContext();
  const isHome = usePathname() === "/";

  return (
    <div className="wex-global-header">
      {/* Carnet heart (mobile only — desktop has it in the sidebar). On the home
          page the hero header renders its own inline heart, like the switcher. */}
      {!isHome && (
        <span className="wex-mobile-only">
          <CarnetHeartLink uiLang={uiLang} />
        </span>
      )}
      {/* Language switcher. On the home page the mobile switcher lives inline in
          the hero header (flex-aligned with the wordmark), so hide this fixed one
          on mobile there — but keep it on desktop, which has no hero header. */}
      <span
        className={isHome ? "wex-desktop-only" : undefined}
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

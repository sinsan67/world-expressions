"use client";

import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import LangDropdown from "./LangDropdown";
import { useUILangContext } from "@/lib/UILangContext";

export default function GlobalHeader() {
  const pathname = usePathname();
  const { uiLang, setUILang } = useUILangContext();

  if (pathname === "/") {
    return (
      <div style={{
        position: "fixed",
        top: "0.75rem",
        right: "1rem",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
        <span style={{ width: 1, height: 14, background: "var(--paper-edge)", flexShrink: 0 }} />
        <AuthButton uiLang={uiLang} />
      </div>
    );
  }

  return (
    <header
      className="wex-desktop-only"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--paper)",
        borderBottom: "1px solid var(--paper-edge)",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0.5rem 1.25rem",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
        <span style={{ width: 1, height: 14, background: "var(--paper-edge)", flexShrink: 0 }} />
        <AuthButton uiLang={uiLang} />
      </div>
    </header>
  );
}

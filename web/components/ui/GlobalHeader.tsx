"use client";

import Link from "next/link";
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
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--paper)",
        borderBottom: "1px solid var(--paper-edge)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 1.25rem",
        gap: "0.75rem",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{ textDecoration: "none", flexShrink: 0 }}
        aria-label="World Expressions — home"
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 17,
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          World{" "}
          <em style={{ color: "var(--terra)", fontStyle: "italic" }}>Expressions</em>
        </span>
      </Link>

      {/* Right side: lang selector + auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <LangDropdown uiLang={uiLang} onLangChange={setUILang} />
        <span style={{ width: 1, height: 14, background: "var(--paper-edge)", flexShrink: 0 }} />
        <AuthButton uiLang={uiLang} />
      </div>
    </header>
  );
}

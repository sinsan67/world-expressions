"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const PLACEHOLDER: Record<string, string> = {
  fr: "Essaie : pied, argent, animal…",
  en: "Try: money, animal, fear…",
  es: "Prueba: dinero, animal, miedo…",
  tr: "Dene: para, hayvan, korku…",
  it: "Prova: soldi, animale, paura…",
};

type Props = { uiLang?: string; onClose: () => void };

export default function SearchOverlay({ uiLang = "en", onClose }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSearch = useCallback(() => {
    if (query.trim().length < 2) return;
    router.push(`/#q=${encodeURIComponent(query.trim())}`);
    onClose();
  }, [query, router, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(28,20,16,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "0.875rem 1rem",
          width: "100%",
          maxWidth: 540,
          margin: "0 1rem",
          border: "1px solid var(--paper-edge)",
          boxShadow: "var(--shadow-deep)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={18} strokeWidth={1.5} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={PLACEHOLDER[uiLang] ?? PLACEHOLDER.en}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 16,
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
            padding: 0,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 2 }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

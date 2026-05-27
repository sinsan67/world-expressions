"use client";

import { useState, useEffect } from "react";
import { getRandomExpression, getExpression } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const TAGLINES: Record<UILang, string> = {
  en: "Every language has its own madness.",
  fr: "Chaque langue a sa propre folie.",
  es: "Cada idioma tiene su propia locura.",
  it: "Ogni lingua ha la sua follia.",
  tr: "Her dilin kendine özgü bir çılgınlığı var.",
};

const CTA: Record<UILang, string> = {
  en: "Let's go →",
  fr: "Commencer →",
  es: "¡Vamos! →",
  it: "Iniziamo →",
  tr: "Başlayalım →",
};

const LANG_FLAGS: Record<UILang, string> = {
  fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", it: "🇮🇹", tr: "🇹🇷",
};

const REGION_FLAGS: Record<string, string> = {
  fr: "🇫🇷", uk: "🇬🇧", us: "🇺🇸", au: "🇦🇺", es: "🇪🇸", tr: "🇹🇷", it: "🇮🇹",
};

const ALL_LANGS: UILang[] = ["fr", "en", "es", "it", "tr"];

function detectBrowserLang(): UILang {
  if (typeof navigator === "undefined") return "en";
  const code = navigator.language.toLowerCase().split("-")[0];
  return ALL_LANGS.includes(code as UILang) ? (code as UILang) : "en";
}

type PreviewItem = {
  id: string;
  expression: string;
  flag: string;
  meaning: string;
  literal: string | null;
  idiomatic: string | null;
};

type Props = { onSelect: (lang: UILang) => void };

export default function WelcomeModal({ onSelect }: Props) {
  const [selected, setSelected] = useState<UILang>(detectBrowserLang());
  const [previewsByLang, setPreviewsByLang] = useState<Partial<Record<UILang, PreviewItem[]>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const randoms = await Promise.allSettled(
        Array.from({ length: 5 }, () => getRandomExpression("en"))
      );
      const ok = randoms
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map((r) => r.value);

      const seenIds = new Set<string>();
      const seenLangs = new Set<string>();
      const chosen: any[] = [];
      for (const e of ok) {
        if (chosen.length >= 3) break;
        if (!seenIds.has(e.id) && !seenLangs.has(e.language)) {
          seenIds.add(e.id); seenLangs.add(e.language); chosen.push(e);
        }
      }
      for (const e of ok) {
        if (chosen.length >= 3) break;
        if (!seenIds.has(e.id)) { seenIds.add(e.id); chosen.push(e); }
      }
      const ids = chosen.slice(0, 3).map((e: any) => e.id);
      if (ids.length === 0) { setLoading(false); return; }

      const byLang: Partial<Record<UILang, PreviewItem[]>> = {};
      await Promise.all(
        ALL_LANGS.map(async (lang) => {
          const fetched = await Promise.allSettled(ids.map((id) => getExpression(id, lang)));
          byLang[lang] = fetched
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
            .map((r) => {
              const e = r.value;
              const t = e.translation;
              return {
                id: e.id,
                expression: e.expression,
                flag: REGION_FLAGS[e.region] || REGION_FLAGS[e.language] || "🌍",
                meaning: t?.meaning || e.meaning || "",
                literal: t?.literal ?? null,
                idiomatic: t?.idiomatic ?? null,
              };
            });
        })
      );

      setPreviewsByLang(byLang);
      setLoading(false);
    };

    init();
  }, []);

  const previews = previewsByLang[selected] ?? [];
  const truncate = (s: string, n = 70) => s.length > n ? s.slice(0, n) + "…" : s;

  const handleSelect = (lang: UILang) => {
    localStorage.setItem("wex_lang", lang);
    onSelect(lang);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(28,20,16,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.25s ease-out both",
      }}
    >
      <div
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "2rem 2rem 1.75rem",
          maxWidth: 460, width: "100%",
          border: "1px solid var(--paper-edge)",
          boxShadow: "var(--shadow-deep)",
          animation: "fadeSlideUp 0.3s ease-out both",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 34, marginBottom: "0.4rem" }}>🌍</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: "0.4rem" }}>
            World <em style={{ color: "var(--terra)" }}>Expressions</em>
          </h2>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--plum)", minHeight: 22 }}>
            {TAGLINES[selected]}
          </p>
        </div>

        {/* Expression previews */}
        <div
          style={{
            background: "var(--paper-deep)",
            borderRadius: "var(--r-md)",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            minHeight: 100,
            border: "1px solid var(--paper-edge)",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}
        >
          {loading || previews.length === 0 ? (
            [0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 16, borderRadius: 3, background: "var(--paper-fold)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ height: 12, width: "60%", borderRadius: 6, background: "var(--paper-fold)" }} />
                  <div style={{ height: 10, width: "80%", borderRadius: 6, background: "var(--paper-edge)" }} />
                </div>
              </div>
            ))
          ) : previews.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 2 }}>{e.flag}</span>
              <div style={{ fontSize: 12, lineHeight: 1.55, fontFamily: "var(--font-body)" }}>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                  &ldquo;{e.expression}&rdquo;
                </div>
                {e.meaning && (
                  <div style={{ color: "var(--ink-soft)" }}>{truncate(e.meaning)}</div>
                )}
                {e.literal && (
                  <div style={{ color: "var(--ink-faint)", fontSize: 11 }}>
                    Lit: <em>{truncate(e.literal, 60)}</em>
                    {e.idiomatic && (
                      <span style={{ marginLeft: "0.5rem", color: "var(--plum)" }}>
                        · &ldquo;{truncate(e.idiomatic, 40)}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Language selector */}
        <p style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "var(--ink-faint)",
          marginBottom: "0.6rem", textAlign: "center", fontFamily: "var(--font-body)",
        }}>
          How should we explain things to you?
        </p>
        <div style={{ display: "flex", gap: "0.45rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.2rem" }}>
          {ALL_LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelected(lang)}
              style={{
                padding: "0.45rem 1rem", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 700,
                border: "2px solid",
                borderColor: selected === lang ? "var(--plum)" : "var(--paper-edge)",
                background: selected === lang ? "var(--plum)" : "var(--paper)",
                color: selected === lang ? "var(--paper)" : "var(--ink-soft)",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-body)",
              }}
            >
              {LANG_FLAGS[lang]} {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => handleSelect(selected)}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "var(--r-md)",
            fontSize: 16, fontWeight: 700,
            background: "var(--plum)", color: "var(--paper)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(107,77,143,0.3)",
            transition: "background 0.15s",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--plum-deep)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--plum)"; }}
        >
          {CTA[selected]}
        </button>
      </div>
    </div>
  );
}

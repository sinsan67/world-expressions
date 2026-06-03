"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { toggleFavorite, isFavorite } from "@/lib/carnet";
import { Heart } from "lucide-react";
import { browseByRegion, Expression } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "tr" | "it";

const SECTION_FILTERS = [
  { key: null,               label: "Toutes",            emoji: "✨" },
  { key: "als-quotidien",    label: "Mots du quotidien", emoji: "💬" },
  { key: "als-table",        label: "À table",           emoji: "🍽️" },
  { key: "als-interjection", label: "Interjections",     emoji: "❗" },
  { key: "als-calque",       label: "Français d'Alsace", emoji: "🗺️" },
];

const SECTION_STYLES: Record<string, { bg: string; accent: string; strip: string }> = {
  "als-quotidien":    { bg: "#fdf4e2", accent: "#a85c1a", strip: "#e8a84a" },
  "als-table":        { bg: "#fef0ed", accent: "#b03a2a", strip: "#d4705a" },
  "als-interjection": { bg: "#f0ecf8", accent: "#6a38a0", strip: "#9a70c8" },
  "als-calque":       { bg: "#e8f5f0", accent: "#1e6b4a", strip: "#4aaa84" },
  default:            { bg: "#f5f3ef", accent: "#5a4a3a", strip: "#b0a090" },
};

function sectionStyle(tags: string[]) {
  const key = tags.find((t) => t.startsWith("als-"));
  return SECTION_STYLES[key ?? "default"] ?? SECTION_STYLES.default;
}

// ─── AlsaceCard ─────────────────────────────────────────────────────────────

function AlsaceCard({ expr, uiLang }: { expr: Expression; uiLang: UILang }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fav, setFav] = useState(false);
  const style = sectionStyle(expr.tags);

  useEffect(() => { setFav(isFavorite(expr.id)); }, [expr.id]);

  function handleFav(ev: React.MouseEvent) {
    ev.stopPropagation();
    toggleFavorite(expr.id);
    setFav((v) => !v);
  }

  return (
    <div
      onClick={() => router.push(`/expression/${expr.id}?lang=${uiLang}`)}
      style={{
        background: style.bg,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 1px 6px rgba(28,20,16,0.07)",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 8px 24px rgba(28,20,16,0.13)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 1px 6px rgba(28,20,16,0.07)";
      }}
    >
      {/* Color strip */}
      <div style={{ height: 5, background: style.strip }} />

      <div style={{ padding: "1.1rem 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>

        {/* Expression word — focal point */}
        <p style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "1.55rem",
          fontWeight: 800,
          color: style.accent,
          lineHeight: 1.15,
          margin: 0,
        }}>
          {expr.expression}
        </p>

        {/* Meaning */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#4a3a2a",
          lineHeight: 1.55,
          margin: 0,
        }}>
          {expr.meaning}
        </p>

        {/* Origin toggle */}
        {expr.origin && (
          <div style={{ marginTop: "0.1rem" }}>
            <button
              onClick={(ev) => { ev.stopPropagation(); setOpen((v) => !v); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: style.accent, opacity: 0.65,
                fontFamily: "var(--font-body)", fontWeight: 600, padding: 0,
                letterSpacing: "0.03em",
                transition: "opacity 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.65"; }}
            >
              {open ? "▾" : "▸"} {uiLang === "fr" ? "Anecdote" : "Story"}
            </button>
            {open && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#6a5a4a",
                lineHeight: 1.6,
                margin: "0.4rem 0 0",
                borderLeft: `2px solid ${style.strip}`,
                paddingLeft: "0.6rem",
              }}>
                {expr.origin}
              </p>
            )}
          </div>
        )}

        {/* Bottom row — fav */}
        <div style={{ marginTop: "auto", paddingTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleFav}
            title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px", lineHeight: 1,
              color: fav ? style.accent : "rgba(90,70,50,0.25)",
              transition: "color 150ms ease, transform 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <Heart size={15} strokeWidth={1.5} fill={fav ? style.accent : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function RegionPageContent({ code }: { code: string }) {
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) setUILang(stored);
  }, []);

  useEffect(() => {
    browseByRegion([code], 100, 0)
      .then((r) => setExpressions(r.results))
      .catch(() => setExpressions([]))
      .finally(() => setLoading(false));
  }, [code]);

  const changeLang = (lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  };

  const filtered = activeSection
    ? expressions.filter((e) => e.tags.some((t) => t === activeSection))
    : expressions;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>

        {/* Mobile header */}
        <div
          className="wex-mobile-header"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--paper-edge)",
            background: "var(--paper)",
          }}
        >
          <Link
            href="/country/fr"
            style={{ fontSize: 13, color: "var(--ink-softer)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-body)" }}
          >
            ← France
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            🥨 Alsace
          </span>
          <div style={{ width: 48 }} />
        </div>

        {/* Hero */}
        <div style={{
          minHeight: 200,
          background: "linear-gradient(135deg, #b94b30 0%, #8b4a7a 50%, #6b4d8f 100%)",
          position: "relative",
        }}>
          <div style={{ padding: "1.25rem 2rem 3rem" }}>
            <div className="wex-atlas-card">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
                <Link href="/country/fr" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
                  ← 🇫🇷 France
                </Link>
                <span style={{ color: "rgba(255,255,255,0.4)" }}> · Alsace</span>
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: "0.4rem" }}>🥨</div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                textShadow: "0 2px 16px rgba(28,20,16,0.5)",
              }}>
                Alsace
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: "0.35rem", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
                Elsässisch · Entre Rhin et Vosges
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

          {/* Intro — discreet */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--ink-faint)",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}>
            Mots alsaciens et calques germaniques qui glissent quotidiennement dans le français parlé à Strasbourg, Colmar ou Mulhouse.
          </p>

          {/* Section filters */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem", marginBottom: "1.75rem" }}>
            {SECTION_FILTERS.map(({ key, label, emoji }) => {
              const isActive = activeSection === key;
              const count = key !== null ? expressions.filter((e) => e.tags.some((t) => t === key)).length : expressions.length;
              return (
                <button
                  key={key ?? "all"}
                  onClick={() => setActiveSection(isActive && key !== null ? null : key)}
                  style={{
                    fontSize: 13, padding: "6px 14px", borderRadius: "var(--r-pill)",
                    background: isActive ? "var(--terra)" : "var(--paper)",
                    border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                    color: isActive ? "#fff" : "var(--terra)",
                    cursor: "pointer", fontWeight: 500,
                    boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                    transition: "all 0.15s",
                    fontFamily: "var(--font-body)",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  <span>{emoji}</span>
                  {label}
                  <span style={{ fontSize: 11, opacity: isActive ? 0.75 : 0.5, marginLeft: 2 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
              <div
                className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--plum-bg)", borderTopColor: "var(--plum)" }}
              />
            </div>
          )}

          {/* AlsaceCard grid */}
          {!loading && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.85rem",
            }}>
              {filtered.map((expr, i) => (
                <div
                  key={expr.id}
                  style={{ animation: "fadeSlideUp 0.35s ease-out both", animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <AlsaceCard
                    expr={{ ...expr, tags: expr.tags.filter((t) => !t.startsWith("als-")) }}
                    uiLang={uiLang}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

export default function RegionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
          <div style={{ color: "var(--plum-soft)", fontSize: "2rem" }}>…</div>
        </div>
      }
    >
      <RegionPageContent code={code} />
    </Suspense>
  );
}

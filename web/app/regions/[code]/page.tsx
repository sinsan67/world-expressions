"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import ExpressionCard from "@/components/ExpressionCard";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import { browseByRegion, getAllTagNames, Expression } from "@/lib/api";

type UILang = "fr" | "en" | "es" | "tr" | "it";

const SECTION_FILTERS = [
  { key: null,              label: "Toutes" },
  { key: "als-quotidien",   label: "Mots du quotidien" },
  { key: "als-table",       label: "À table" },
  { key: "als-interjection",label: "Interjections" },
  { key: "als-calque",      label: "Français d'Alsace" },
];

function RegionPageContent({ code }: { code: string }) {
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) setUILang(stored);
  }, []);

  const changeLang = (lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  };

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames);
  }, [uiLang]);

  useEffect(() => {
    browseByRegion([code], 100, 0)
      .then((r) => setExpressions(r.results))
      .catch(() => setExpressions([]))
      .finally(() => setLoading(false));
  }, [code]);

  const filtered = activeSection
    ? expressions.filter((e) => e.tags.some((t) => t === activeSection))
    : expressions;

  const handleTagClick = (slug: string) => {
    // section tags used for filtering; ignore als-* from card click
    if (!slug.startsWith("als-")) return;
    setActiveSection(activeSection === slug ? null : slug);
  };

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
            href="/"
            style={{ fontSize: 13, color: "var(--ink-softer)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-body)" }}
          >
            ← Accueil
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            🍇 Alsace
          </span>
          <div style={{ width: 48 }} />
        </div>

        {/* Hero */}
        <div
          style={{
            minHeight: 220,
            background: "linear-gradient(135deg, #b94b30 0%, #8b4a7a 50%, #6b4d8f 100%)",
            position: "relative",
          }}
        >
          <div style={{ padding: "1.25rem 2rem 3rem" }}>
            {/* Desktop breadcrumb */}
            <div className="wex-atlas-card">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
                <Link href="/" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
                  ← Accueil
                </Link>
                {" · "}
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Régions · Alsace</span>
              </p>
            </div>

            {/* Region identity */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <div style={{ fontSize: 52, lineHeight: 1, marginBottom: "0.4rem" }}>🍇</div>
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
              <p style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                marginTop: "0.4rem",
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
              }}>
                Elsässisch · Entre Rhin et Vosges
              </p>
              {!loading && (
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: "0.3rem", fontFamily: "var(--font-body)" }}>
                  {expressions.length} expression{expressions.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1rem 3rem" }}>

          {/* Intro */}
          <div style={{
            background: "var(--paper)",
            border: "1px solid var(--paper-edge)",
            borderRadius: "var(--r-lg)",
            padding: "1.75rem 2.25rem",
            marginBottom: "2rem",
          }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>
              L&apos;alsacien — <em>Elsässisch</em> — est un dialecte germanique d&apos;origine alémanique et franconienne, parlé depuis des siècles dans la plaine du Rhin et les contreforts des Vosges. Si l&apos;on compare à d&apos;autres régions, l&apos;Alsace est l&apos;une de celles qui a le plus de régionalismes en France. La raison tient à son histoire : territoire longtemps disputé entre la France et l&apos;Allemagne, elle a conservé un substrat linguistique germanique qui a coexisté avec le français pendant plusieurs décennies.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", marginTop: "0.9rem", marginBottom: 0 }}>
              Aujourd&apos;hui, rares sont les Alsaciens à maîtriser encore le dialecte à l&apos;oral — mais ses mots n&apos;ont jamais vraiment disparu. Ils glissent quotidiennement dans le français parlé à Strasbourg, Colmar ou Mulhouse : on fait un <strong style={{ color: "var(--plum)" }}>schmutz</strong>, on prend un <strong style={{ color: "var(--plum)" }}>schluk</strong>, on lance un <strong style={{ color: "var(--plum)" }}>hopla !</strong> sans y penser. À cela s&apos;ajoutent des calques syntaxiques de l&apos;allemand — «&nbsp;il a anniversaire&nbsp;», «&nbsp;venir avec&nbsp;», «&nbsp;j&apos;attends sur le bus&nbsp;» — qui semblent fautifs au Français de l&apos;intérieur, mais sont en réalité des traductions mot-à-mot parfaitement logiques.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", marginTop: "0.9rem", marginBottom: 0 }}>
              En Alsace, on est assez forts pour utiliser sans s&apos;en rendre compte des expressions qui feraient bégayer tout Français au-delà des Vosges. Ce n&apos;est pas une faiblesse : c&apos;est parler deux langues en même temps.
            </p>
          </div>

          {/* Section filters */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
              letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: "0.6rem",
              fontFamily: "var(--font-body)",
            }}>
              Filtrer par section
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" }}>
              {SECTION_FILTERS.map(({ key, label }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key ?? "all"}
                    onClick={() => setActiveSection(isActive && key !== null ? null : key)}
                    style={{
                      fontSize: 13, padding: "6px 16px", borderRadius: "var(--r-pill)",
                      background: isActive ? "var(--terra)" : "var(--paper)",
                      border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                      color: isActive ? "#fff" : "var(--terra)",
                      cursor: "pointer", fontWeight: 500,
                      boxShadow: isActive ? "var(--shadow-stamp)" : "none",
                      transition: "all 0.15s",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {label}
                    {key !== null && !isActive && (
                      <span style={{ marginLeft: 6, color: "var(--ink-faint)", fontSize: 12 }}>
                        {expressions.filter((e) => e.tags.some((t) => t === key)).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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

          {/* Expression grid */}
          {!loading && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}>
              {filtered.map((expr, i) => (
                <div
                  key={expr.id}
                  style={{
                    animation: "fadeSlideUp 0.35s ease-out both",
                    animationDelay: `${Math.min(i, 8) * 45}ms`,
                  }}
                >
                  <ExpressionCard
                    expression={{
                      ...expr,
                      tags: expr.tags.filter((t) => !t.startsWith("als-")),
                    }}
                    onTagClick={handleTagClick}
                    uiLang={uiLang}
                    tagNames={tagNames}
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

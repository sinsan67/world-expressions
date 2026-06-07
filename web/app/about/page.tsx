"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const BLOCKS = [
  {
    emoji: "🌍",
    title: "What is World Expressions?",
    body: "World Expressions is a free, open exploration of idiomatic expressions from around the world. Type a word, a feeling, or an idea — and discover how different languages and cultures say the same thing in wildly different ways.",
  },
  {
    emoji: "💬",
    title: "Why expressions?",
    body: "Literal translation is never enough. Expressions are where language gets interesting — they carry history, humour, and the texture of daily life. A Turkish proverb about wolves, a French saying about feet, a Spanish phrase about luck: each one is a small window into a culture.",
  },
  {
    emoji: "📚",
    title: "The data",
    body: "The database currently holds over 1 500 expressions across French, English, Spanish, Italian, and Turkish. Each entry includes its meaning, origin, a usage example, and cross-language equivalents. Data is continuously reviewed and expanded.",
  },
  {
    emoji: "🔓",
    title: "Open source",
    body: "World Expressions is open source and built in public. The code lives on GitHub. Contributions — new expressions, corrections, translations, ideas — are welcome.",
    link: { href: "https://github.com/sinsan67/world-expressions", label: "View on GitHub" },
  },
  {
    emoji: "✉️",
    title: "Get in touch",
    body: "Questions, suggestions, or a favourite expression to share? Reach out by email or find us on Instagram.",
    links: [
      { href: "mailto:worldsexpressions@proton.me", label: "worldsexpressions@proton.me" },
      { href: "https://www.instagram.com/world.expressions", label: "@world.expressions" },
    ],
  },
];

export default function AboutPage() {
  const [uiLang, setUiLang] = useState<UILang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    if (stored) setUiLang(stored);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <Sidebar uiLang={uiLang} />

      <main
        className="wex-main"
        style={{ flex: 1, padding: "2rem 2rem 4rem", maxWidth: 660, margin: "0 auto" }}
      >
        <LangBar uiLang={uiLang} onLangChange={setUiLang} />

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          color: "var(--ink)",
          marginTop: "2rem",
          marginBottom: "0.5rem",
          lineHeight: 1.2,
        }}>
          About
        </h1>
        <p style={{
          fontFamily: "var(--font-hand)",
          fontSize: "1.05rem",
          color: "var(--ink-soft)",
          marginBottom: "3rem",
          lineHeight: 1.5,
        }}>
          A project about language, culture, and the small things that make each one unique.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {BLOCKS.map((block) => (
            <section key={block.title}>
              <div style={{
                fontSize: "1.75rem",
                marginBottom: "0.5rem",
                lineHeight: 1,
              }}>
                {block.emoji}
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                color: "var(--ink)",
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}>
                {block.title}
              </h2>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--ink-soft)",
                lineHeight: 1.7,
                margin: 0,
              }}>
                {block.body}
              </p>
              {"link" in block && block.link && (
                <a
                  href={block.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--plum)",
                    textDecoration: "none",
                    fontWeight: 500,
                    borderBottom: "1px solid var(--plum)",
                    paddingBottom: 1,
                  }}
                >
                  {block.link.label} →
                </a>
              )}
              {"links" in block && block.links && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {block.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target={l.href.startsWith("mailto") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        color: "var(--plum)",
                        textDecoration: "none",
                        fontWeight: 500,
                        borderBottom: "1px solid var(--plum)",
                        paddingBottom: 1,
                        alignSelf: "flex-start",
                      }}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <div style={{
          marginTop: "4rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--paper-edge)",
          fontFamily: "var(--font-body)",
          fontSize: "0.8rem",
          color: "var(--ink-faint)",
        }}>
          Made with curiosity. Built in public.
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

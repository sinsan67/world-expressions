"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const s = {
  page: {
    flex: 1,
    padding: "2rem 2rem 6rem",
    maxWidth: 700,
    margin: "0 auto",
  } as React.CSSProperties,

  langBar: {
    marginBottom: "2.5rem",
  } as React.CSSProperties,

  eyebrow: {
    fontFamily: "var(--font-body)",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--terra)",
    marginBottom: "0.6rem",
  } as React.CSSProperties,

  title: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 5vw, 2.8rem)",
    fontStyle: "italic",
    color: "var(--ink)",
    lineHeight: 1.15,
    marginBottom: "0.5rem",
  } as React.CSSProperties,

  subtitle: {
    fontFamily: "var(--font-hand)",
    fontSize: "1rem",
    color: "var(--ink-softer)",
    fontStyle: "italic",
    marginBottom: "3rem",
    lineHeight: 1.6,
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--terra)",
    marginBottom: "1rem",
    marginTop: "3rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid var(--paper-edge)",
  } as React.CSSProperties,

  body: {
    fontFamily: "var(--font-display)",
    fontSize: "0.92rem",
    color: "var(--ink-soft)",
    lineHeight: 1.85,
    marginBottom: "1.1rem",
  } as React.CSSProperties,

  pull: {
    borderLeft: "2px solid var(--terra)",
    paddingLeft: "1.1rem",
    fontFamily: "var(--font-hand)",
    fontSize: "1rem",
    fontStyle: "italic",
    color: "var(--ink)",
    lineHeight: 1.6,
    margin: "1.75rem 0",
  } as React.CSSProperties,

  typeCard: {
    background: "var(--paper)",
    border: "1px solid var(--paper-edge)",
    borderRadius: 10,
    padding: "1rem 1.1rem",
    marginBottom: "0.75rem",
  } as React.CSSProperties,

  typeLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--plum)",
    marginBottom: "0.3rem",
  } as React.CSSProperties,

  typeTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "0.95rem",
    color: "var(--ink)",
    marginBottom: "0.35rem",
    fontWeight: 600,
  } as React.CSSProperties,

  typeBody: {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    color: "var(--ink-soft)",
    lineHeight: 1.65,
    marginBottom: "0.4rem",
  } as React.CSSProperties,

  example: {
    fontFamily: "var(--font-hand)",
    fontSize: "0.88rem",
    fontStyle: "italic",
    color: "var(--ink-softer)",
  } as React.CSSProperties,

  passStep: {
    display: "flex",
    gap: "0.85rem",
    marginBottom: "1rem",
    alignItems: "flex-start",
  } as React.CSSProperties,

  passNum: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "var(--plum)",
    color: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: "0.7rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  } as React.CSSProperties,

  passBody: {
    fontFamily: "var(--font-body)",
    fontSize: "0.83rem",
    color: "var(--ink-soft)",
    lineHeight: 1.65,
  } as React.CSSProperties,

  passStrong: {
    fontWeight: 700,
    color: "var(--ink)",
  } as React.CSSProperties,

  codeInline: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    background: "var(--paper-edge)",
    color: "var(--ink)",
    padding: "1px 5px",
    borderRadius: 4,
  } as React.CSSProperties,

  diffRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    marginBottom: "1rem",
  } as React.CSSProperties,

  diffCard: (accent: string) => ({
    background: "var(--paper)",
    border: `1.5px solid ${accent}`,
    borderRadius: 10,
    padding: "0.9rem 1rem",
  }) as React.CSSProperties,

  diffCardTitle: (accent: string) => ({
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: accent,
    marginBottom: "0.35rem",
  }) as React.CSSProperties,

  diffCardBody: {
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    color: "var(--ink-soft)",
    lineHeight: 1.55,
  } as React.CSSProperties,

  link: {
    fontFamily: "var(--font-body)",
    fontSize: "0.88rem",
    color: "var(--plum)",
    textDecoration: "none",
    borderBottom: "1px solid var(--plum)",
    paddingBottom: 1,
    fontWeight: 500,
    display: "inline-block",
    marginRight: "1rem",
    marginTop: "0.5rem",
  } as React.CSSProperties,

  footer: {
    marginTop: "4rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid var(--paper-edge)",
    fontFamily: "var(--font-hand)",
    fontSize: "0.88rem",
    fontStyle: "italic",
    color: "var(--ink-faint)",
  } as React.CSSProperties,
};

export default function AboutPage() {
  const [uiLang, setUiLang] = useState<UILang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    if (stored) setUiLang(stored as UILang);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={s.page}>
        <div style={s.langBar}>
          <LangBar uiLang={uiLang} onLangChange={setUiLang} />
        </div>

        <div style={s.eyebrow}>About this project</div>
        <h1 style={s.title}>A love letter<br />to idioms.</h1>
        <p style={s.subtitle}>
          Every language has expressions that refuse to translate. They carry too much — history, humour, the texture of daily life. This is where World Expressions starts.
        </p>

        {/* ── WHAT IT IS ── */}
        <p style={s.body}>
          World Expressions is a free, open-source database of idiomatic expressions from around the world. You type a word, a feeling, or an idea — and discover how different languages name the same thing. The results are not just translations: they are windows into how different cultures think, argue, love, and joke.
        </p>
        <p style={s.body}>
          The database currently holds over 1 500 expressions across French, English, Spanish, Italian, and Turkish. Each entry includes a meaning, an origin story, a usage example, and cross-language equivalents wherever they exist. The project is open source, continuously expanding, and entirely free.
        </p>

        {/* ── EXPRESSION TYPES ── */}
        <div style={s.sectionTitle}>What kind of expressions?</div>

        <p style={s.body}>
          Not every fixed phrase is the same thing. World Expressions distinguishes four main types — each with its own character and its own relationship to literal meaning.
        </p>

        <div style={s.typeCard}>
          <div style={s.typeLabel}>Proverbe · Proverb</div>
          <div style={s.typeTitle}>A complete sentence with a moral or wisdom.</div>
          <p style={s.typeBody}>
            Proverbs are short, self-contained sayings — usually metaphorical — that encode collective wisdom. They function as arguments: you cite a proverb to justify or warn. They are often old, often anonymous, and often very literal in imagery while very abstract in meaning.
          </p>
          <span style={s.example}>"Qui sème le vent récolte la tempête." — He who sows the wind shall reap the whirlwind.</span>
        </div>

        <div style={s.typeCard}>
          <div style={s.typeLabel}>Expression idiomatique · Idiom</div>
          <div style={s.typeTitle}>A fixed phrase whose meaning can't be decoded word by word.</div>
          <p style={s.typeBody}>
            Idioms are the beating heart of informal language. The words taken literally make no sense — or a completely different sense. They are learned as units, not assembled from parts. New speakers of a language struggle most with idioms, because no amount of vocabulary knowledge helps decode them.
          </p>
          <span style={s.example}>"Avoir le cafard." — To have the cockroach. Meaning: to feel sad, to be depressed.</span>
        </div>

        <div style={s.typeCard}>
          <div style={s.typeLabel}>Locution</div>
          <div style={s.typeTitle}>A fixed multi-word unit that functions as a single grammatical element.</div>
          <p style={s.typeBody}>
            Locutions are more grammatical animals — they behave like a single adverb, preposition, or adjective. Unlike idioms, their meaning is often guessable, but they must be used as a block: you can't rearrange the words or substitute synonyms. They give language its idiomatic rhythm.
          </p>
          <span style={s.example}>"En catimini." — Furtively, on the quiet, without drawing attention.</span>
        </div>

        <div style={s.typeCard}>
          <div style={s.typeLabel}>Argot · Slang</div>
          <div style={s.typeTitle}>Informal register, often from specific social groups.</div>
          <p style={s.typeBody}>
            Slang is language's living edge. It mutates, dates quickly, and marks belonging. A word of argot signals "I'm part of this group, I talk like you". Some slang goes mainstream and loses its edge; other terms stay underground forever. In French, a whole branch of argot — verlan — works by reversing syllables: "l'envers" becomes "verlan", "femme" becomes "meuf".
          </p>
          <span style={s.example}>"Kiffer." — To really like something. From Arabic "kif" (pleasure), via French urban slang.</span>
        </div>

        {/* ── SEARCH ── */}
        <div style={s.sectionTitle}>How search works</div>

        <p style={s.body}>
          When you type a word into the search bar, the system doesn't just look for that exact string in a database. It runs four successive passes — each broader than the previous one — and assembles the results in order of relevance.
        </p>

        <div style={s.pull}>
          Take an Italian user who types "amore". Here is exactly what happens, step by step.
        </div>

        <div style={s.passStep}>
          <div style={s.passNum}>1</div>
          <div style={s.passBody}>
            <span style={s.passStrong}>Exact match.</span> The system looks for "amore" appearing literally in the text of any expression across all languages. Italian expressions containing the word "amore" come up first. This pass is fast and precise — it catches the obvious results.
          </div>
        </div>

        <div style={s.passStep}>
          <div style={s.passNum}>2</div>
          <div style={s.passBody}>
            <span style={s.passStrong}>Semantic match.</span> The system searches the meaning, origin, and usage example of every expression — still looking for "amore". An Italian proverb whose meaning mentions love without using the word in its title will appear here. Tags are also searched at this step.
          </div>
        </div>

        <div style={s.passStep}>
          <div style={s.passNum}>3</div>
          <div style={s.passBody}>
            <span style={s.passStrong}>Cross-language translation pass.</span> The system looks for "amore" inside the translated versions of all expressions — including French, Spanish, and Turkish ones. A French expression like "avoir le cœur sur la main" (to be generous) might have an Italian translation that mentions "amore", and it would surface here. This is how the app bridges languages.
          </div>
        </div>

        <div style={s.passStep}>
          <div style={s.passNum}>4</div>
          <div style={s.passBody}>
            <span style={s.passStrong}>Concept bridge.</span> The system tries to match "amore" to known concept tags — thematic labels like <span style={s.codeInline}>love</span>, <span style={s.codeInline}>romance</span>, or <span style={s.codeInline}>heartbreak</span>. If a match is found, every expression carrying that concept tag — in any language — appears in the results under a distinct "Same concept" section. This is the widest net: an expression about heartbreak in Turkish can surface from an Italian query about love.
          </div>
        </div>

        <p style={s.body}>
          Results from each pass are visually separated in the results page, so you always know why an expression appeared. The four sections are labeled: <em>Exact match</em>, <em>By meaning</em>, <em>Same concept</em>, <em>Via translations</em>.
        </p>

        {/* ── CONCEPTS VS DOMAINS ── */}
        <div style={s.sectionTitle}>Concepts and domains: two ways to wander</div>

        <p style={s.body}>
          Beyond search, the app offers two other ways to explore the database — and they work quite differently. Understanding the difference makes navigation much more intuitive.
        </p>

        <div style={s.diffRow}>
          <div style={s.diffCard("var(--plum)")}>
            <div style={s.diffCardTitle("var(--plum)")}>Concept</div>
            <p style={s.diffCardBody}>
              A specific thematic tag shared by expressions that express the <em>same idea</em> — regardless of language. Examples: <em>money</em>, <em>friendship</em>, <em>death</em>, <em>laziness</em>. There are 540+ concepts in the database.
            </p>
          </div>
          <div style={s.diffCard("var(--terra)")}>
            <div style={s.diffCardTitle("var(--terra)")}>Domain</div>
            <p style={s.diffCardBody}>
              A broad editorial category grouping many concepts together. Examples: <em>Work &amp; ambition</em>, <em>Money</em>, <em>Human relations</em>, <em>Humor &amp; irony</em>. There are 16 domains total.
            </p>
          </div>
        </div>

        <p style={s.body}>
          <strong>When you click an emoji in the search overlay</strong> — the grid that appears when you open the search — each emoji represents a domain. Clicking it brings you to a results page filtered by that domain: all expressions belonging to any concept within it, across all languages.
        </p>

        <p style={s.body}>
          <strong>When you click a concept pill</strong> — the small labels that appear on expression cards or inside domain result pages — you go to a narrower view. Only expressions tagged with that specific concept appear. Searching <span style={s.codeInline}>friendship</span> as a concept might return 40 expressions across 5 languages, all specifically about friendship. Searching the <em>Human relations</em> domain would return hundreds, spanning friendship but also loyalty, betrayal, family, love, loneliness.
        </p>

        <div style={s.pull}>
          Domain is the neighbourhood. Concept is the street.
        </div>

        <p style={s.body}>
          Both paths feed into the same unified search results page, with the same layout, the same filters, the same ability to narrow by language or country. The URL always reflects what you're browsing — <span style={s.codeInline}>/search?domain=humor</span> or <span style={s.codeInline}>/search?concept=sarcasm</span> — so every view is shareable.
        </p>

        {/* ── SAME IDEA SECTION ── */}
        <div style={s.sectionTitle}>The "Same idea" section</div>

        <p style={s.body}>
          On every expression page, below the main content, you'll find a section titled <em>Same idea in other languages</em>. This is the cross-lingual heart of the app.
        </p>
        <p style={s.body}>
          It works through concept links: every expression is connected to a concept (a thematic slug like <span style={s.codeInline}>death</span> or <span style={s.codeInline}>money</span>), and expressions sharing a concept are surfaced here. A French expression about luck will show its Turkish, Spanish, and Italian cousins — expressions that carry the same cultural weight, even if the images and metaphors are completely different. Each equivalent is shown with a confidence badge: <em>Mirror</em> (exact same meaning), <em>Equivalent</em> (very close), or <em>In the same vein</em> (related idea).
        </p>

        {/* ── DATA ── */}
        <div style={s.sectionTitle}>The data</div>

        <p style={s.body}>
          The database was built from public linguistic sources and curated manually. Meanings, origins, and usage examples were written or verified entry by entry — with AI assistance for the bulk of the work, and human review for quality. Cross-language equivalents were generated by a language model (Mistral) and are scored for confidence.
        </p>
        <p style={s.body}>
          The database is not exhaustive — no database of expressions ever is. Languages grow, slang shifts, and what counts as a "real" expression is always debatable. The current scope is 1 500+ entries; the goal is depth over breadth: fewer expressions with richer content, rather than a raw list of thousands.
        </p>

        {/* ── OPEN SOURCE ── */}
        <div style={s.sectionTitle}>Open source</div>

        <p style={s.body}>
          The entire codebase — FastAPI backend, Next.js frontend, database scripts, enrichment pipelines — is open source on GitHub. Contributions are welcome: new expressions, corrections to existing ones, translations, design improvements, or ideas.
        </p>

        <a href="https://github.com/sinsan67/world-expressions" target="_blank" rel="noopener noreferrer" style={s.link}>
          github.com/sinsan67/world-expressions →
        </a>

        {/* ── CONTACT ── */}
        <div style={s.sectionTitle}>Get in touch</div>

        <p style={s.body}>
          Questions, a correction to report, a favourite expression to suggest — all welcome. You can reach out by email or find the project on Instagram.
        </p>

        <div>
          <a href="mailto:worldsexpressions@proton.me" style={s.link}>
            worldsexpressions@proton.me →
          </a>
          <a href="https://www.instagram.com/world.expressions" target="_blank" rel="noopener noreferrer" style={s.link}>
            @world.expressions →
          </a>
        </div>

        <p style={s.footer}>
          Made with curiosity. Built in public.
        </p>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

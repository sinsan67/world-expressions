"use client";
import { useEffect, useMemo, useState } from "react";
import Postcard from "./Postcard";
import { LANG_FLAG } from "@/lib/constants";
import coldStartProverbs from "@/lib/coldStartProverbs.json";

// Fills the wait during a Render cold start (free tier, ~30-60s after sleep)
// with a real proverb — no API call, since the API is exactly what's down.
// 365 proverbs frozen at build time (scripts/export_cold_start_proverbs.py),
// one per day of the year, drawn from any of the app's languages (not just
// the visitor's uiLang) — the literal word-for-word translation is the same
// "aha" hook the rest of the app is built around.

const UI_LANGS = ["fr", "en", "es", "it", "tr", "de", "ja"] as const;
type L = (typeof UI_LANGS)[number];

const UI: Record<L, { label: string; literalPrefix: string; hint: string }> = {
  fr: {
    label: "Proverbe du jour",
    literalPrefix: "Mot à mot",
    hint: "Notre serveur (plan gratuit) sort de sa sieste — environ 30 secondes",
  },
  en: {
    label: "Proverb of the day",
    literalPrefix: "Literally",
    hint: "Our server (free tier) is waking up — about 30 seconds",
  },
  es: {
    label: "Proverbio del día",
    literalPrefix: "Literalmente",
    hint: "Nuestro servidor (plan gratuito) se despierta — unos 30 segundos",
  },
  it: {
    label: "Proverbio del giorno",
    literalPrefix: "Letteralmente",
    hint: "Il nostro server (piano gratuito) si sveglia — circa 30 secondi",
  },
  tr: {
    label: "Günün atasözü",
    literalPrefix: "Kelimesi kelimesine",
    hint: "Sunucumuz (ücretsiz plan) uyanıyor — yaklaşık 30 saniye",
  },
  de: {
    label: "Sprichwort des Tages",
    literalPrefix: "Wörtlich",
    hint: "Unser Server (kostenloser Plan) erwacht — ca. 30 Sekunden",
  },
  ja: {
    label: "今日のことわざ",
    literalPrefix: "直訳",
    hint: "サーバー（無料プラン）が起動中 — 約30秒",
  },
};

type ProverbTranslation = { meaning: string | null; literal: string | null };
type ProverbEntry = {
  id: string;
  expression: string;
  sourceLang: string;
  country: string;
  translations: Record<string, ProverbTranslation>;
  day: number;
};

const PROVERBS = coldStartProverbs as ProverbEntry[];

function dayOfYearUTC(): number {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - start) / 86400000);
}

export default function ColdStartCard({ uiLang = "en" }: { uiLang?: string }) {
  const [progress, setProgress] = useState(0);
  const lang = (UI_LANGS.includes(uiLang as L) ? uiLang : "en") as L;
  const ui = UI[lang];

  const entry = useMemo(() => PROVERBS[dayOfYearUTC() % PROVERBS.length], []);
  const translation = entry.translations[lang] ?? entry.translations.en;
  const sourceFlag = LANG_FLAG[entry.sourceLang] ?? "🌍";
  const showLiteral = Boolean(translation?.literal) && entry.sourceLang !== lang;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / 45, 96));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Postcard tilt={-0.4} large>
      {/* Sleeping server stamp */}
      <div style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        width: 72,
        height: 72,
        borderRadius: "50%",
        border: "2px solid var(--paper-edge)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        opacity: 0.7,
      }}>
        ☕
      </div>

      {/* Meta */}
      <div style={{ marginBottom: "0.4rem", marginRight: 88 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ink-softer)",
          fontFamily: "var(--font-body)",
        }}>
          {sourceFlag} {ui.label}
        </span>
      </div>

      {/* Expression */}
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: "clamp(20px, 3.5vw, 30px)",
        fontWeight: 500,
        color: "var(--ink)",
        lineHeight: 1.2,
        marginBottom: showLiteral ? "0.25rem" : "0.5rem",
        marginRight: 88,
      }}>
        {entry.expression}
      </h2>

      {showLiteral && (
        <p style={{
          fontFamily: "var(--font-hand)",
          fontSize: 15,
          color: "var(--ink-soft)",
          marginBottom: "0.5rem",
          marginRight: 88,
        }}>
          {ui.literalPrefix} : « {translation!.literal} »
        </p>
      )}

      <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "0.75rem 0" }} />

      <p style={{
        fontSize: 14,
        color: "var(--ink-soft)",
        lineHeight: 1.65,
        marginBottom: "1rem",
        fontFamily: "var(--font-body)",
      }}>
        {translation?.meaning}
      </p>

      {/* Cold start hint */}
      <p style={{
        fontSize: 12,
        color: "var(--ink-faint)",
        fontFamily: "var(--font-body)",
        marginBottom: "0.75rem",
        fontStyle: "italic",
      }}>
        {ui.hint}
      </p>

      {/* Progress bar */}
      <div style={{
        height: 3,
        background: "var(--paper-edge)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--terra)",
          borderRadius: 2,
          transition: "width 1s linear",
        }} />
      </div>
    </Postcard>
  );
}

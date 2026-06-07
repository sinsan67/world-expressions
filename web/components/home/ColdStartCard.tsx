"use client";
import { useState, useEffect } from "react";
import Postcard from "./Postcard";

const LANGS = ["fr", "en", "es", "it", "tr"] as const;
type L = (typeof LANGS)[number];

const MSG: Record<L, { expr: string; flag: string; meaning: string; hint: string }> = {
  fr: {
    expr: "Qui dort ne pèche pas",
    flag: "🇫🇷",
    meaning: "Celui qui ne fait rien ne risque pas de faire d'erreurs.",
    hint: "Notre serveur (plan gratuit) sort de sa sieste — environ 30 secondes",
  },
  en: {
    expr: "Good things come to those who wait",
    flag: "🇬🇧",
    meaning: "Patience is eventually rewarded.",
    hint: "Our server (free tier) is waking up — about 30 seconds",
  },
  es: {
    expr: "El que espera, desespera",
    flag: "🇪🇸",
    meaning: "Esperar demasiado puede desesperar a cualquiera.",
    hint: "Nuestro servidor (plan gratuito) se despierta — unos 30 segundos",
  },
  it: {
    expr: "Chi dorme non piglia pesci",
    flag: "🇮🇹",
    meaning: "Chi non è attivo non ottiene risultati.",
    hint: "Il nostro server (piano gratuito) si sveglia — circa 30 secondi",
  },
  tr: {
    expr: "Sabır acıdır, meyvesi tatlıdır",
    flag: "🇹🇷",
    meaning: "Sabretmek zordur ama sonuçları güzel olur.",
    hint: "Sunucumuz (ücretsiz plan) uyanıyor — yaklaşık 30 saniye",
  },
};

export default function ColdStartCard({ uiLang = "en" }: { uiLang?: string }) {
  const [progress, setProgress] = useState(0);
  const lang = (LANGS.includes(uiLang as L) ? uiLang : "en") as L;
  const m = MSG[lang];

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
          {m.flag} patience
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
        marginBottom: "0.5rem",
        marginRight: 88,
      }}>
        {m.expr}
      </h2>

      <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "0.75rem 0" }} />

      <p style={{
        fontSize: 14,
        color: "var(--ink-soft)",
        lineHeight: 1.65,
        marginBottom: "1rem",
        fontFamily: "var(--font-body)",
      }}>
        {m.meaning}
      </p>

      {/* Cold start hint */}
      <p style={{
        fontSize: 12,
        color: "var(--ink-faint)",
        fontFamily: "var(--font-body)",
        marginBottom: "0.75rem",
        fontStyle: "italic",
      }}>
        {m.hint}
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

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const LANG_OPTIONS: { code: UILang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

type Props = {
  onClose: (uiLang: UILang | null) => void;
  apiUrl: string;
};

export default function OnboardingModal({ onClose, apiUrl }: Props) {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [uiLang, setUiLang] = useState<UILang>("en");
  const [saving, setSaving] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  async function handleFinish() {
    if (!session?.user?.id) { onClose(uiLang); return; }
    setSaving(true);
    try {
      await fetch(`${apiUrl}/users/${session.user.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui_lang: uiLang }),
      });
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
      onClose(uiLang);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 200ms ease both",
      }}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--paper-edge)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-postcard)",
          padding: "2rem",
          maxWidth: 420,
          width: "calc(100% - 2rem)",
          animation: "fadeSlideUp 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
        }}
      >
        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terra)", marginBottom: "0.5rem" }}>
              Welcome
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.75rem" }}>
              Hello, {firstName}!
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              World Expressions is a collection of idioms from around the globe. Let me quickly set up your experience — takes 20 seconds.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button
                onClick={() => onClose(null)}
                style={{ padding: "0.5rem 1rem", borderRadius: "var(--r-pill)", border: "1.5px solid var(--paper-edge)", background: "transparent", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer" }}
              >
                Skip
              </button>
              <button
                onClick={() => setStep(1)}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--r-pill)", border: "none", background: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--paper)", cursor: "pointer" }}
              >
                Let's go →
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Interface language */}
        {step === 1 && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terra)", marginBottom: "0.5rem" }}>
              Step 1 / 2
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.5rem" }}>
              Which language do you prefer?
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", marginBottom: "1rem" }}>
              Expressions will be explained in this language.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {LANG_OPTIONS.map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => setUiLang(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "var(--r-md)",
                    border: `1.5px solid ${uiLang === code ? "var(--plum)" : "var(--paper-edge)"}`,
                    background: uiLang === code ? "var(--plum-bg)" : "transparent",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: uiLang === code ? "var(--plum)" : "var(--ink)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 120ms ease",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{flag}</span>
                  {label}
                  {uiLang === code && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button
                onClick={() => setStep(0)}
                style={{ padding: "0.5rem 1rem", borderRadius: "var(--r-pill)", border: "1.5px solid var(--paper-edge)", background: "transparent", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer" }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--r-pill)", border: "none", background: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--paper)", cursor: "pointer" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — All set */}
        {step === 2 && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terra)", marginBottom: "0.5rem" }}>
              All set
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.75rem" }}>
              Your notebook is ready
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Your favorites and history will now sync across devices. You can adjust your preferences anytime from your profile.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button
                onClick={() => setStep(1)}
                style={{ padding: "0.5rem 1rem", borderRadius: "var(--r-pill)", border: "1.5px solid var(--paper-edge)", background: "transparent", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer" }}
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--r-pill)", border: "none", background: "var(--terra)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "white", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Start exploring →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

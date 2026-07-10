"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";
type UserGoal = "curious" | "learning" | "nerd" | "teacher";

const LANG_OPTIONS: { code: UILang; label: string; flag: string }[] = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español",  flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe",   flag: "🇹🇷" },
  { code: "de", label: "Deutsch",  flag: "🇩🇪" },
  { code: "ja", label: "日本語",   flag: "🇯🇵" },
];

const NATIVE_LANG_OPTIONS = [
  ...LANG_OPTIONS,
  { code: "other", label: "Other", flag: "🌐" },
];

const GOAL_OPTIONS: { value: UserGoal; emoji: string; label: string; sub: string }[] = [
  { value: "curious",  emoji: "🌍", label: "Curious explorer",    sub: "I love discovering how language works" },
  { value: "learning", emoji: "📚", label: "Learning a language", sub: "I'm studying a foreign language" },
  { value: "nerd",     emoji: "🔤", label: "Language nerd",       sub: "Linguistics and etymology are my thing" },
  { value: "teacher",  emoji: "👩‍🏫", label: "Teacher / Educator",  sub: "I use expressions in my teaching" },
];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.5rem" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 6,
            width: i < current ? 22 : 8,
            borderRadius: 3,
            background: i < current ? "var(--plum)" : "var(--paper-edge)",
            transition: "all 300ms ease",
          }}
        />
      ))}
    </div>
  );
}

type Props = {
  onClose: (uiLang: UILang | null) => void;
  apiUrl: string;
  /* Language already picked pre-auth (WelcomeModal / selector): skip the
     interface-language step instead of asking twice */
  initialUiLang?: UILang | null;
};

export default function OnboardingModal({ onClose, apiUrl, initialUiLang = null }: Props) {
  const { data: session } = useSession();
  const askLang = !initialUiLang;
  const totalSteps = askLang ? 4 : 3;
  const [step, setStep] = useState(0);
  const [uiLang, setUiLang] = useState<UILang>(initialUiLang ?? "en");
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [exploreLangs, setExploreLangs] = useState<UILang[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [saving, setSaving] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  function toggleExploreLang(code: UILang) {
    setExploreLangs((prev) =>
      prev.includes(code)
        ? prev.filter((l) => l !== code)
        : prev.length < 3 ? [...prev, code] : prev
    );
  }

  async function handleFinish() {
    if (!session?.user?.id) { onClose(uiLang); return; }
    setSaving(true);
    try {
      await fetch(`${apiUrl}/users/${session.user.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ui_lang: uiLang,
          learning_langs: exploreLangs,
          native_lang: nativeLang,
          user_goal: userGoal,
        }),
      });
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
      onClose(uiLang);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(2px)",
    animation: "fadeIn 200ms ease both",
    padding: "1rem",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--paper)",
    border: "1px solid var(--paper-edge)",
    borderRadius: "var(--r-lg)",
    boxShadow: "var(--shadow-postcard)",
    padding: "2rem",
    maxWidth: 440,
    width: "100%",
    animation: "fadeSlideUp 300ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
  };

  const eyebrowStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--terra)",
    marginBottom: "0.5rem",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: 26,
    fontWeight: 500,
    color: "var(--ink)",
    margin: "0 0 0.5rem",
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-soft)",
    lineHeight: 1.5,
    marginBottom: "1.25rem",
  };

  const backBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid var(--paper-edge)",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-soft)",
    cursor: "pointer",
  };

  const skipBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid #e8d8c4",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "#b08060",
    cursor: "pointer",
  };

  const nextBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1.25rem",
    borderRadius: "var(--r-pill)",
    border: "none",
    background: "var(--ink)",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--paper)",
    cursor: "pointer",
  };

  const finishBtnStyle: React.CSSProperties = {
    ...nextBtnStyle,
    background: "var(--terra)",
    opacity: saving ? 0.7 : 1,
  };

  function LangGrid({ selected, onSelect, options = LANG_OPTIONS, multi = false }: {
    selected: string | string[] | null;
    onSelect: (code: string) => void;
    options?: { code: string; label: string; flag: string }[];
    multi?: boolean;
  }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1.25rem" }}>
        {options.map(({ code, label, flag }) => {
          const active = multi
            ? Array.isArray(selected) && selected.includes(code)
            : selected === code;
          return (
            <button
              key={code}
              onClick={() => onSelect(code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.55rem 0.875rem",
                borderRadius: "var(--r-md)",
                border: `1.5px solid ${active ? "var(--plum)" : "var(--paper-edge)"}`,
                background: active ? "var(--plum-bg)" : "transparent",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: active ? "var(--plum)" : "var(--ink)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 120ms ease",
              }}
            >
              <span style={{ fontSize: 16 }}>{flag}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {active && <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>

        {/* ── Step 0 — Welcome ── */}
        {step === 0 && (
          <div>
            <p style={eyebrowStyle}>Welcome</p>
            <h2 style={titleStyle}>Hello, {firstName}!</h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              World Expressions is a collection of idioms from around the globe.
              <br />Set up your experience in 40 seconds.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => onClose(null)} style={skipBtnStyle}>Skip for now</button>
              <button onClick={() => setStep(askLang ? 1 : 2)} style={nextBtnStyle}>Let&apos;s go →</button>
            </div>
          </div>
        )}

        {/* ── Step 1 — Interface language (mandatory, skipped when inherited) ── */}
        {step === 1 && askLang && (
          <div>
            <ProgressDots current={1} total={totalSteps} />
            <p style={eyebrowStyle}>Step 1 / {totalSteps} · Required</p>
            <h2 style={titleStyle}>Which language for explanations?</h2>
            <p style={subtitleStyle}>Expressions will be explained in this language throughout the app.</p>
            <LangGrid selected={uiLang} onSelect={(c) => setUiLang(c as UILang)} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => setStep(0)} style={backBtnStyle}>← Back</button>
              <button onClick={() => setStep(2)} style={nextBtnStyle}>Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Native language (optional) ── */}
        {step === 2 && (
          <div>
            <ProgressDots current={askLang ? 2 : 1} total={totalSteps} />
            <p style={eyebrowStyle}>Step {askLang ? 2 : 1} / {totalSteps} · Optional</p>
            <h2 style={titleStyle}>What&apos;s your native language?</h2>
            <p style={subtitleStyle}>Helps surface equivalent expressions in your language first.</p>
            <LangGrid
              selected={nativeLang}
              onSelect={(c) => setNativeLang(nativeLang === c ? null : c)}
              options={NATIVE_LANG_OPTIONS}
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => setStep(askLang ? 1 : 0)} style={backBtnStyle}>← Back</button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setNativeLang(null); setStep(3); }} style={skipBtnStyle}>Skip</button>
                <button onClick={() => setStep(3)} style={nextBtnStyle}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 — Languages to explore (optional, max 3) ── */}
        {step === 3 && (
          <div>
            <ProgressDots current={askLang ? 3 : 2} total={totalSteps} />
            <p style={eyebrowStyle}>Step {askLang ? 3 : 2} / {totalSteps} · Optional</p>
            <h2 style={titleStyle}>Which languages fascinate you?</h2>
            <p style={subtitleStyle}>
              Pick up to 3 — we&apos;ll highlight those equivalents across the app.
              {exploreLangs.length === 3 && (
                <span style={{ color: "var(--plum)", fontWeight: 600 }}> (3 selected)</span>
              )}
            </p>
            <LangGrid
              selected={exploreLangs}
              onSelect={(c) => toggleExploreLang(c as UILang)}
              multi
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setExploreLangs([]); setStep(4); }} style={skipBtnStyle}>Skip</button>
                <button onClick={() => setStep(4)} style={nextBtnStyle}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4 — Goal (optional) ── */}
        {step === 4 && (
          <div>
            <ProgressDots current={askLang ? 4 : 3} total={totalSteps} />
            <p style={eyebrowStyle}>Step {askLang ? 4 : 3} / {totalSteps} · Optional</p>
            <h2 style={titleStyle}>What brings you here?</h2>
            <p style={subtitleStyle}>Helps us personalize the experience over time.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
              {GOAL_OPTIONS.map(({ value, emoji, label, sub }) => {
                const active = userGoal === value;
                return (
                  <button
                    key={value}
                    onClick={() => setUserGoal(active ? null : value)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.65rem 0.875rem",
                      borderRadius: "var(--r-md)",
                      border: `1.5px solid ${active ? "var(--plum)" : "var(--paper-edge)"}`,
                      background: active ? "var(--plum-bg)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 120ms ease",
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
                    <span>
                      <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "var(--plum)" : "var(--ink)" }}>{label}</span>
                      <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>{sub}</span>
                    </span>
                    {active && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--plum)", flexShrink: 0, alignSelf: "center" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setUserGoal(null); setStep(5); }} style={skipBtnStyle}>Skip</button>
                <button onClick={() => setStep(5)} style={nextBtnStyle}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5 — All set ── */}
        {step === 5 && (
          <div>
            <p style={{ fontSize: 36, margin: "0 0 0.75rem" }}>🎉</p>
            <p style={eyebrowStyle}>All set</p>
            <h2 style={titleStyle}>Your notebook is ready</h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              You can adjust these preferences anytime from your profile.
            </p>
            {/* Quick summary */}
            <div style={{ background: "var(--paper-edge)", borderRadius: "var(--r-md)", padding: "0.875rem 1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {[
                { label: "Interface", value: LANG_OPTIONS.find(l => l.code === uiLang)?.flag + " " + LANG_OPTIONS.find(l => l.code === uiLang)?.label },
                nativeLang ? { label: "Native language", value: NATIVE_LANG_OPTIONS.find(l => l.code === nativeLang)?.flag + " " + NATIVE_LANG_OPTIONS.find(l => l.code === nativeLang)?.label } : null,
                exploreLangs.length > 0 ? { label: "Exploring", value: exploreLangs.map(c => LANG_OPTIONS.find(l => l.code === c)?.flag).join("  ") } : null,
                userGoal ? { label: "Profile", value: GOAL_OPTIONS.find(g => g.value === userGoal)?.label } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-body)", fontSize: 12 }}>
                  <span style={{ color: "var(--ink-soft)" }}>{item!.label}</span>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>{item!.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <button onClick={() => setStep(4)} style={backBtnStyle}>← Back</button>
              <button onClick={handleFinish} disabled={saving} style={finishBtnStyle}>
                {saving ? "Saving…" : "Start exploring →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

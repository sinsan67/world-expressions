"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import Eyebrow from "@/components/home/Eyebrow";

type UILang = "fr" | "en" | "es" | "it" | "tr";
type ExploreMode = "multilingual" | "single";
type ContentType = "all" | "proverbs" | "everyday" | "slang";

const LANG_OPTIONS: { code: UILang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proverbs", label: "🏛️ Proverbs & wisdom" },
  { value: "everyday", label: "💬 Everyday expressions" },
  { value: "slang", label: "🔥 Slang & informal" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uiLang, setUiLang] = useState<UILang>("en");
  const [exploreMode, setExploreMode] = useState<ExploreMode>("multilingual");
  const [learningLangs, setLearningLangs] = useState<UILang[]>([]);
  const [contentType, setContentType] = useState<ContentType>("all");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favCount, setFavCount] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    fetch(`${API_URL}/users/${userId}/preferences`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ui_lang) setUiLang(d.ui_lang as UILang);
        if (d.explore_mode) setExploreMode(d.explore_mode as ExploreMode);
        if (Array.isArray(d.learning_langs)) setLearningLangs(d.learning_langs as UILang[]);
        if (d.content_type) setContentType(d.content_type as ContentType);
      })
      .catch(() => {});

    fetch(`${API_URL}/users/${userId}/favorites`)
      .then((r) => r.json())
      .then((d) => setFavCount(d.favorites?.length ?? 0))
      .catch(() => {});
  }, [session?.user?.id]);

  const handleLangChange = useCallback((lang: UILang) => {
    setUiLang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  function toggleLearningLang(lang: UILang) {
    setLearningLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  async function savePreferences() {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/users/${session.user.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ui_lang: uiLang,
          explore_mode: exploreMode,
          learning_langs: learningLangs,
          content_type: contentType,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  const user = session!.user!;

  const blockStyle: React.CSSProperties = {
    background: "var(--paper)",
    border: "1px solid var(--paper-edge)",
    borderRadius: "var(--r-lg)",
    overflow: "hidden",
    marginBottom: "0.75rem",
    boxShadow: "var(--shadow-postcard)",
  };

  const blockHeaderStyle: React.CSSProperties = {
    padding: "1rem 1.25rem 0.75rem",
    borderBottom: "1px solid var(--paper-edge)",
  };

  const blockBodyStyle: React.CSSProperties = {
    padding: "0.875rem 1.25rem 1rem",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={handleLangChange} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>
        <div
          className="wex-mobile-header"
          style={{ justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--paper-edge)" }}
        >
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-softer)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ← Back
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            My profile
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>

          {/* Breadcrumb */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>Home</Link>
              {" › "}<span style={{ color: "var(--ink)" }}>My profile</span>
            </p>
          </div>

          {/* User card */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--paper-edge)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-postcard)",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={64}
                height={64}
                style={{ borderRadius: "50%", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--plum-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "var(--plum)", flexShrink: 0 }}>
                {(user.name?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.25rem" }}>
                {user.name}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                {user.email}
              </p>
              {favCount !== null && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-faint)", margin: "0.25rem 0 0" }}>
                  {favCount} favorites saved
                </p>
              )}
            </div>
          </div>

          {/* Preferences section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <Eyebrow tone="plum">Preferences</Eyebrow>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--ink)", margin: "0.3rem 0 1rem" }}>
              Your experience
            </h3>

            {/* Q0 — Interface language */}
            <div style={blockStyle}>
              <div style={blockHeaderStyle}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Interface language</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.4 }}>The language for explanations and navigation.</p>
              </div>
              <div style={{ ...blockBodyStyle, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {LANG_OPTIONS.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => handleLangChange(code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.4375rem 0.875rem",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${uiLang === code ? "var(--plum)" : "var(--paper-edge)"}`,
                      background: uiLang === code ? "var(--plum-bg)" : "transparent",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: uiLang === code ? 600 : 500,
                      color: uiLang === code ? "var(--plum)" : "var(--ink-soft)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{flag}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q1 — How you explore */}
            <div style={blockStyle}>
              <div style={blockHeaderStyle}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>How you explore</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.4 }}>Changes how the app highlights expressions.</p>
              </div>
              <div style={{ ...blockBodyStyle, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(
                  [
                    {
                      value: "multilingual" as ExploreMode,
                      label: "Explore multiple languages and compare them",
                      sub: 'Cross-language equivalents, country filters, and the "Same idea" section are front and center.',
                    },
                    {
                      value: "single" as ExploreMode,
                      label: "Focus on a single language",
                      sub: "The app simplifies — less multilingual noise, one language at the forefront.",
                    },
                  ] satisfies { value: ExploreMode; label: string; sub: string }[]
                ).map(({ value, label, sub }) => (
                  <button
                    key={value}
                    onClick={() => setExploreMode(value)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.75rem 0.875rem",
                      borderRadius: "var(--r-md)",
                      border: `1.5px solid ${exploreMode === value ? "var(--plum)" : "var(--paper-edge)"}`,
                      background: exploreMode === value ? "var(--plum-bg)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${exploreMode === value ? "var(--plum)" : "var(--paper-edge)"}`,
                        background: exploreMode === value ? "var(--plum)" : "transparent",
                        boxShadow: exploreMode === value ? "inset 0 0 0 3px var(--plum-bg)" : "none",
                        display: "inline-block",
                      }}
                    />
                    <span>
                      <span style={{
                        display: "block",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: exploreMode === value ? 600 : 500,
                        color: exploreMode === value ? "var(--plum)" : "var(--ink)",
                        lineHeight: 1.3,
                      }}>
                        {label}
                      </span>
                      <span style={{
                        display: "block",
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "var(--ink-soft)",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}>
                        {sub}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 — Learning languages (multi-select) */}
            <div style={blockStyle}>
              <div style={blockHeaderStyle}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Are you learning a language?</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.4 }}>Select one or more — the app will highlight their equivalents. Nothing selected = no specific highlight.</p>
              </div>
              <div style={{ ...blockBodyStyle, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {LANG_OPTIONS.map(({ code, label, flag }) => {
                  const active = learningLangs.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleLearningLang(code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.4375rem 0.875rem",
                        borderRadius: "var(--r-pill)",
                        border: `1.5px solid ${active ? "var(--plum)" : "var(--paper-edge)"}`,
                        background: active ? "var(--plum-bg)" : "transparent",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        color: active ? "var(--plum)" : "var(--ink-soft)",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{flag}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3 — Content type */}
            <div style={blockStyle}>
              <div style={blockHeaderStyle}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Which expressions interest you?</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.4 }}>This filter applies to all your search results — no need to reset it each time.</p>
              </div>
              <div style={{ ...blockBodyStyle, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {CONTENT_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setContentType(value)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${contentType === value ? "var(--plum)" : "var(--paper-edge)"}`,
                      background: contentType === value ? "var(--plum-bg)" : "transparent",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: contentType === value ? 600 : 500,
                      color: contentType === value ? "var(--plum)" : "var(--ink-soft)",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                onClick={savePreferences}
                disabled={saving || saved}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  background: saved ? "var(--sage-bg, #e8f5e9)" : "var(--ink)",
                  color: saved ? "var(--sage, #388e3c)" : "var(--paper)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving || saved ? "default" : "pointer",
                  transition: "all 200ms ease",
                }}
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save preferences"}
              </button>
            </div>
          </div>

          {/* Account section */}
          <div
            style={{
              borderTop: "1px solid var(--paper-edge)",
              paddingTop: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <Eyebrow tone="terra">Account</Eyebrow>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--ink)", margin: "0.3rem 0 1rem" }}>
              Sign in & data
            </h3>
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--paper-edge)",
                borderRadius: "var(--r-lg)",
                padding: "1.25rem 1.5rem",
                boxShadow: "var(--shadow-postcard)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                  Signed in via Google
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)" }}>
                  {user.email} — your favorites sync automatically.
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  padding: "0.5rem 1.125rem",
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--paper-edge)",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Sign out
              </button>
            </div>
          </div>

        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

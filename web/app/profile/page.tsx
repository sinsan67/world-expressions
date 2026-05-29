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

const LANG_OPTIONS: { code: UILang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uiLang, setUiLang] = useState<UILang>("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favCount, setFavCount] = useState<number | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Load preferences + favorites count
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    fetch(`${API_URL}/users/${userId}/preferences`)
      .then((r) => r.json())
      .then((d) => { if (d.ui_lang) setUiLang(d.ui_lang as UILang); })
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

  async function savePreferences() {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/users/${session.user.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui_lang: uiLang }),
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

          {/* Preferences */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--paper-edge)",
              borderRadius: "var(--r-lg)",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <Eyebrow tone="plum">Preferences</Eyebrow>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--ink)", margin: "0.3rem 0 1rem" }}>
              Interface language
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
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
            <button
              onClick={savePreferences}
              disabled={saving || saved}
              style={{
                padding: "0.6rem 1.5rem",
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

          {/* Danger zone */}
          <div style={{ textAlign: "right" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--r-pill)",
                border: "1.5px solid var(--paper-edge)",
                background: "transparent",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ink-soft)",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>

        </div>
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

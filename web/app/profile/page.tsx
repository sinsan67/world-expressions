"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { updateUserName } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import CarnetTab from "@/components/profile/CarnetTab";
import PreferencesTab from "@/components/profile/PreferencesTab";
import AuthModal from "@/components/profile/AuthModal";
import { useUILangContext } from "@/lib/UILangContext";
import type { UILang } from "@/lib/useUILang";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
type TopTab = "carnet" | "preferences" | "account" | "about";

const TOP_TABS: { id: TopTab; label: Record<UILang, string> }[] = [
  { id: "carnet",      label: { fr: "Mon carnet",   en: "My notebook",   es: "Mi cuaderno",    it: "Il mio taccuino", tr: "Defterim",  de: "Mein Heft",       ja: "ノート" } },
  { id: "preferences", label: { fr: "Préférences",  en: "Preferences",   es: "Preferencias",   it: "Preferenze",      tr: "Tercihler", de: "Einstellungen",   ja: "設定" } },
  { id: "account",     label: { fr: "Compte",        en: "Account",       es: "Cuenta",         it: "Account",         tr: "Hesap",     de: "Konto",           ja: "アカウント" } },
  { id: "about",       label: { fr: "À propos",     en: "About",         es: "Acerca de",      it: "Informazioni",    tr: "Hakkında",  de: "Über",            ja: "アプリについて" } },
];

// New in Lot N1 — Instagram/About/Contact moved here from the now-removed
// Sidebar footer (atelier S208 décision 3: "/instagram + /about → Profil").
const ABOUT_TAB_LABELS: Record<UILang, { aboutLink: string; instagram: string; contact: string }> = {
  fr: { aboutLink: "À propos de World Expressions", instagram: "Instagram", contact: "Contact" },
  en: { aboutLink: "About World Expressions", instagram: "Instagram", contact: "Contact" },
  es: { aboutLink: "Acerca de World Expressions", instagram: "Instagram", contact: "Contacto" },
  it: { aboutLink: "Informazioni su World Expressions", instagram: "Instagram", contact: "Contatto" },
  tr: { aboutLink: "World Expressions Hakkında", instagram: "Instagram", contact: "İletişim" },
  de: { aboutLink: "Über World Expressions", instagram: "Instagram", contact: "Kontakt" },
  ja: { aboutLink: "World Expressionsについて", instagram: "Instagram", contact: "お問い合わせ" },
};

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const { uiLang, setUILang: handleLangChange } = useUILangContext();
  const [activeTab, setActiveTab] = useState<TopTab>("carnet");
  const [authModal, setAuthModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "preferences") setActiveTab("preferences");
    else if (hash === "account") setActiveTab("account");
    else if (hash === "about") setActiveTab("about");
  }, []);

  useEffect(() => {
    setNameInput(session?.user?.name ?? "");
  }, [session?.user?.name]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`${API_URL}/users/${session.user.id}/preferences`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.email_verified === "boolean") setEmailVerified(d.email_verified); })
      .catch(() => {});
  }, [session?.user?.id]);

  async function handleSaveName() {
    if (!session?.user?.id) return;
    setNameSaving(true);
    setNameError(null);
    try {
      await updateUserName(session.user.id, nameInput);
      await updateSession({ name: nameInput.trim() || null });
      setNameSaved(true);
      if (nameTimer.current) clearTimeout(nameTimer.current);
      nameTimer.current = setTimeout(() => setNameSaved(false), 2500);
    } catch {
      setNameError("Could not save. Please try again.");
    } finally {
      setNameSaving(false);
    }
  }

  if (status === "loading") return null;

  const tabPillBase: React.CSSProperties = {
    padding: "0.5rem 1.125rem",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid var(--paper-edge)",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink-soft)",
    cursor: "pointer",
    transition: "all 120ms ease",
    whiteSpace: "nowrap",
  };

  const tabPillActive: React.CSSProperties = {
    ...tabPillBase,
    border: "1.5px solid var(--plum)",
    background: "var(--plum-bg)",
    color: "var(--plum)",
    fontWeight: 700,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>

        {/* Mobile header */}
        <div
          className="wex-mobile-header"
          style={{ justifyContent: "center", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--paper-edge)" }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            {TOP_TABS.find((t) => t.id === activeTab)?.label[uiLang]}
          </span>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>

          {/* Breadcrumb */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>Home</Link>
              {" › "}<span style={{ color: "var(--ink)" }}>{TOP_TABS.find((t) => t.id === activeTab)?.label[uiLang]}</span>
            </p>
          </div>

          {/* Top tab bar */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {TOP_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, "", `/profile#${tab.id}`);
                }}
                style={activeTab === tab.id ? tabPillActive : tabPillBase}
              >
                {tab.label[uiLang]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div key={activeTab} style={{ animation: "fadeIn 200ms ease both" }}>

            {activeTab === "carnet" && (
              <CarnetTab
                session={session}
                uiLang={uiLang}
                onAuthRequired={() => setAuthModal(true)}
              />
            )}

            {activeTab === "preferences" && (
              <PreferencesTab
                session={session}
                uiLang={uiLang}
                onLangChange={handleLangChange}
              />
            )}

            {activeTab === "account" && (
              session ? (
                <div style={{ maxWidth: 560 }}>
                  {/* Unverified email banner */}
                  {emailVerified === false && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "var(--r-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontFamily: "var(--font-body)", fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
                      Your email address is not verified yet. Check your inbox (and spam folder) for the verification link.
                    </div>
                  )}

                  {/* User card */}
                  <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-postcard)", padding: "1.5rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    {session.user?.image ? (
                      <Image src={session.user.image} alt={session.user.name ?? ""} width={64} height={64} style={{ borderRadius: "50%", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--plum-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "var(--plum)", flexShrink: 0 }}>
                        {(session.user?.name?.[0] ?? session.user?.email?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.25rem" }}>
                        {session.user?.name ?? <span style={{ color: "var(--ink-faint)", fontStyle: "normal", fontSize: 16 }}>No name yet</span>}
                      </h2>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                        {session.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Edit name */}
                  <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-lg)", padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-postcard)", marginBottom: "1.25rem" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: "0.75rem" }}>Display name</p>
                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => { setNameInput(e.target.value); setNameSaved(false); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                        placeholder="Your name"
                        maxLength={60}
                        style={{
                          flex: 1,
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--r-sm)",
                          border: "1.5px solid var(--paper-edge)",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "var(--ink)",
                          background: "var(--paper)",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={nameSaving}
                        style={{
                          padding: "0.5rem 1.125rem",
                          borderRadius: "var(--r-pill)",
                          border: "none",
                          background: nameSaved ? "var(--terra)" : "var(--plum)",
                          color: "#fff",
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: nameSaving ? "wait" : "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 200ms",
                        }}
                      >
                        {nameSaved ? "Saved ✓" : nameSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                    {nameError && <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--terra)", marginTop: "0.4rem" }}>{nameError}</p>}
                  </div>

                  {/* Sign out */}
                  <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-lg)", padding: "1.25rem 1.5rem", boxShadow: "var(--shadow-postcard)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                        {session.user?.image ? "Signed in via Google" : "Signed in via email"}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-soft)" }}>
                        {session.user?.email} — your favorites sync automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      style={{ padding: "0.5rem 1.125rem", borderRadius: "var(--r-pill)", border: "1.5px solid var(--paper-edge)", background: "transparent", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 400, textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>👤</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    Create a free account to save your favorites, track your progress across 7 countries, and sync across all your devices.
                  </p>
                  <button
                    onClick={() => setAuthModal(true)}
                    style={{ padding: "0.625rem 1.5rem", borderRadius: "var(--r-pill)", border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Create an account →
                  </button>
                </div>
              )
            )}

            {activeTab === "about" && (
              <div style={{ maxWidth: 480 }}>
                <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-postcard)", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Link href="/about" style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>
                    {ABOUT_TAB_LABELS[uiLang].aboutLink} →
                  </Link>
                  <a href="https://www.instagram.com/world.expressions" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>
                    {ABOUT_TAB_LABELS[uiLang].instagram} →
                  </a>
                  <a href="mailto:worldsexpressions@proton.me" style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>
                    {ABOUT_TAB_LABELS[uiLang].contact} →
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <BottomNav uiLang={uiLang} />
      {authModal && <AuthModal onClose={() => setAuthModal(false)} />}
    </div>
  );
}

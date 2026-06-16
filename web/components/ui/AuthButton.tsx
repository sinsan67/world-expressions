"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import AuthModal from "@/components/profile/AuthModal";

type Props = { uiLang?: string };

const L: Record<string, Record<string, string>> = {
  signIn:     { fr: "Se connecter",       en: "Sign in",              es: "Iniciar sesión",       it: "Accedi",              tr: "Giriş yap",          de: "Anmelden",            ja: "ログイン" },
  create:     { fr: "Créer un compte",    en: "Create account",       es: "Crear cuenta",         it: "Crea account",        tr: "Hesap oluştur",      de: "Konto erstellen",     ja: "アカウント作成" },
  withGoogle: { fr: "Continuer avec Google", en: "Continue with Google", es: "Continuar con Google", it: "Continua con Google", tr: "Google ile devam et", de: "Mit Google fortfahren", ja: "Googleで続ける" },
  withEmail:  { fr: "S'inscrire par e-mail", en: "Sign up with email",  es: "Registrarse por correo", it: "Iscriviti con email", tr: "E-posta ile kaydol", de: "Mit E-Mail registrieren", ja: "メールで登録" },
};
const t = (key: string, lang: string) => L[key]?.[lang] ?? L[key]?.["en"] ?? key;

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583z" fill="#EA4335"/>
  </svg>
);

export default function AuthButton({ uiLang = "en" }: Props) {
  const { data: session, status } = useSession();
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  if (status === "loading") return null;

  if (!session) {
    return (
      <>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: "var(--r-pill)",
              border: "1.5px solid var(--paper-edge)",
              background: "var(--paper)",
              color: "var(--ink-soft)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "all 120ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {t("signIn", uiLang)}
          </button>

          {/* Create account dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 9px",
                borderRadius: "var(--r-pill)",
                border: "none",
                background: "var(--terra)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "all 120ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {t("create", uiLang)}
              <span style={{ fontSize: 8, opacity: 0.8, marginTop: 1 }}>▼</span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--paper)",
                  border: "1.5px solid var(--paper-edge)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  minWidth: 210,
                  zIndex: 300,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signIn("google", { callbackUrl: "/" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    width: "100%",
                    padding: "0.65rem 0.875rem",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--paper-edge)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-tint)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <GoogleIcon /> {t("withGoogle", uiLang)}
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowModal(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    width: "100%",
                    padding: "0.65rem 0.875rem",
                    background: "transparent",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-tint)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  ✉ {t("withEmail", uiLang)}
                </button>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <AuthModal defaultView="register" onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  return (
    <a
      href="/profile#account"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "2px 6px 2px 3px",
        borderRadius: "var(--r-pill)",
        border: "1.5px solid var(--paper-edge)",
        background: "transparent",
        cursor: "pointer",
        transition: "all 120ms ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-tint)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {session.user?.image && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name ?? ""}
          width={18}
          height={18}
          onError={() => setImgError(true)}
          style={{ borderRadius: "50%", display: "block" }}
        />
      ) : (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--plum-bg)",
            color: "var(--plum)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-body)",
          }}
        >
          {(session.user?.name?.[0] ?? session.user?.email?.[0] ?? "?").toUpperCase()}
        </span>
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-soft)",
          fontFamily: "var(--font-body)",
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {session.user?.name?.split(" ")[0] ?? session.user?.email?.split("@")[0] ?? "Me"}
      </span>
    </a>
  );
}

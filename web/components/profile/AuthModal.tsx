"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { API_URL } from "@/lib/constants";
import type { UILang } from "@/lib/useUILang";

type View = "login" | "register" | "forgot";

interface Props {
  onClose: () => void;
  defaultView?: View;
  uiLang?: UILang;
}

const AUTH_ARIA: Record<UILang, string> = {
  en: "Authentication",
  fr: "Authentification",
  es: "Autenticación",
  it: "Autenticazione",
  tr: "Kimlik doğrulama",
  de: "Authentifizierung",
  ja: "認証",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  borderRadius: "var(--r-md)",
  border: "1.5px solid var(--paper-edge)",
  background: "var(--paper)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 1.25rem",
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "var(--plum)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.6rem",
  width: "100%",
  padding: "0.72rem 1.25rem",
  borderRadius: "var(--r-pill)",
  border: "1.5px solid var(--paper-edge)",
  background: "var(--paper)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
  cursor: "pointer",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583z" fill="#EA4335"/>
  </svg>
);

export default function AuthModal({ onClose, defaultView = "login", uiLang = "en" }: Props) {
  const [view, setView] = useState<View>(defaultView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function reset(nextView: View) {
    setError("");
    setSuccess("");
    setView(nextView);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      onClose();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Registration failed.");
      } else {
        setSuccess("Account created! Check your email to verify your address. (If you don't see it, check your spam folder.)");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSuccess("If that email exists, a reset link has been sent.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,20,16,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        data-testid="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={AUTH_ARIA[uiLang] ?? AUTH_ARIA.en}
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "2rem 1.75rem",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 8px 40px rgba(28,20,16,0.18)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: "0.5rem" }}>
          {view === "forgot" ? "🔑" : "📖"}
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--ink)",
            margin: "0 0 0.4rem",
          }}
        >
          {view === "login" && "Welcome back"}
          {view === "register" && "Create your account"}
          {view === "forgot" && "Reset your password"}
        </h2>

        {view === "login" && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            Save your favorites and pick up where you left off.
          </p>
        )}

        {/* Error / success banners */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "var(--r-md)", padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: 13, color: "#b91c1c", fontFamily: "var(--font-body)" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "var(--r-md)", padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: 13, color: "#15803d", fontFamily: "var(--font-body)" }}>
            {success}
          </div>
        )}

        {/* ── LOGIN VIEW ── */}
        {view === "login" && !success && (
          <>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.75rem" }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <button
              onClick={() => reset("forgot")}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-soft)", cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: "1rem" }}
            >
              Forgot password?
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--paper-edge)" }} />
              <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>or</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--paper-edge)" }} />
            </div>

            <button onClick={() => signIn("google", { callbackUrl: "/profile" })} style={ghostBtnStyle}>
              <GoogleIcon /> Continue with Google
            </button>

            <p style={{ marginTop: "1rem", fontSize: 13, color: "var(--ink-soft)", fontFamily: "var(--font-body)" }}>
              No account?{" "}
              <button onClick={() => reset("register")} style={{ background: "none", border: "none", color: "var(--plum)", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", padding: 0 }}>
                Create one
              </button>
            </p>
          </>
        )}

        {/* ── REGISTER VIEW ── */}
        {view === "register" && !success && (
          <>
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.75rem" }}>
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--paper-edge)" }} />
              <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>or</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--paper-edge)" }} />
            </div>

            <button onClick={() => signIn("google", { callbackUrl: "/profile" })} style={ghostBtnStyle}>
              <GoogleIcon /> Continue with Google
            </button>

            <p style={{ marginTop: "1rem", fontSize: 13, color: "var(--ink-soft)", fontFamily: "var(--font-body)" }}>
              Already have an account?{" "}
              <button onClick={() => reset("login")} style={{ background: "none", border: "none", color: "var(--plum)", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", padding: 0 }}>
                Sign in
              </button>
            </p>
          </>
        )}

        {/* ── FORGOT VIEW ── */}
        {view === "forgot" && !success && (
          <>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-soft)", margin: "0 0 1rem", lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send a reset link.
            </p>
            <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1rem" }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <button
              onClick={() => reset("login")}
              style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              ← Back to sign in
            </button>
          </>
        )}

        {/* After success: only the success banner + close action */}
        {success && (
          <button
            onClick={onClose}
            style={{ marginTop: "0.5rem", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)", cursor: "pointer" }}
          >
            Close
          </button>
        )}

        {!success && (
          <button
            onClick={onClose}
            style={{ marginTop: "0.75rem", background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)", cursor: "pointer", display: "block", width: "100%" }}
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}

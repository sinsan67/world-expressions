"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No reset token found in the URL.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/"), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "This link is invalid or has expired.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          fontFamily: "var(--font-body)",
        }}
      >
        {done ? (
          <>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>✅</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: "0.5rem" }}>
              Password updated!
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6 }}>
              You can now sign in with your new password. Redirecting…
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>🔑</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--ink)", margin: "0 0 0.4rem" }}>
              Choose a new password
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              Must be at least 8 characters.
            </p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "var(--r-md)", padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: 13, color: "#b91c1c" }}>
                {error}
              </div>
            )}

            {!token && (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: "1rem" }}>
                  No reset token found. Please use the link from your email.
                </p>
                <Link
                  href="/"
                  style={{ color: "var(--plum)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
                >
                  Back to home
                </Link>
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.72rem 1.25rem",
                    borderRadius: "var(--r-pill)",
                    border: "none",
                    background: "var(--plum)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

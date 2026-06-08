"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          // Redirect home after 3s so the user can re-sign-in with verified account
          setTimeout(() => router.push("/"), 3000);
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setMessage(data.detail ?? "This link is invalid or has expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [params, router]);

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
        {status === "loading" && (
          <>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>⏳</div>
            <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>✅</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: "0.5rem" }}>
              Email verified!
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6 }}>
              Your account is now active. Redirecting you to the home page…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 40, marginBottom: "1rem" }}>❌</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: "0.5rem" }}>
              Verification failed
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {message}
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "0.65rem 1.5rem",
                borderRadius: "var(--r-pill)",
                background: "var(--plum)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

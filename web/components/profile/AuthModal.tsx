"use client";

import { signIn } from "next-auth/react";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
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
        <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>📖</div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink)",
            margin: "0 0 0.5rem",
          }}
        >
          Save your discoveries
        </h2>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
            margin: "0 0 1.5rem",
          }}
        >
          Create a free account to save your favorites, track your progress
          across 7 countries, and pick up where you left off on any device.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            width: "100%",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--r-pill)",
            border: "1.5px solid var(--paper-edge)",
            background: "var(--paper)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            cursor: "pointer",
            marginBottom: "0.75rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--ink-faint)",
            cursor: "pointer",
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

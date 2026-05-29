"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 9px",
          borderRadius: "var(--r-pill)",
          border: "1.5px solid var(--paper-edge)",
          background: "transparent",
          color: "var(--ink-soft)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "all 120ms ease",
          whiteSpace: "nowrap",
        }}
      >
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "2px 6px 2px 3px",
          borderRadius: "var(--r-pill)",
          border: "1.5px solid var(--paper-edge)",
          background: open ? "var(--paper-tint)" : "transparent",
          cursor: "pointer",
          transition: "all 120ms ease",
        }}
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? ""}
            width={18}
            height={18}
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
            {(session.user?.name?.[0] ?? "?").toUpperCase()}
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
          {session.user?.name?.split(" ")[0] ?? "Me"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "var(--paper)",
            border: "1px solid var(--paper-edge)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-postcard)",
            padding: "0.5rem",
            minWidth: 160,
            zIndex: 100,
          }}
        >
          <a
            href="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--r-sm)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              color: "var(--ink)",
              textDecoration: "none",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            My profile
          </a>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--r-sm)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              color: "var(--ink-soft)",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [imgError, setImgError] = useState(false);

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

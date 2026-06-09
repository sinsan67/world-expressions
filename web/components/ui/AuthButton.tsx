"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/profile/AuthModal";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<"login" | "register">("login");

  if (status === "loading") return null;

  function openLogin() { setModalView("login"); setShowModal(true); }
  function openRegister() { setModalView("register"); setShowModal(true); }

  if (!session) {
    return (
      <>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            onClick={openLogin}
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
          <button
            onClick={openRegister}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: "var(--r-pill)",
              border: "none",
              background: "var(--plum)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "all 120ms ease",
              whiteSpace: "nowrap",
            }}
          >
            Sign up
          </button>
        </div>
        {showModal && (
          <AuthModal defaultView={modalView} onClose={() => setShowModal(false)} />
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

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";
import { getCarnet, markSynced } from "@/lib/carnet";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const UI_LANGS = ["fr", "en", "es", "it", "tr", "de", "ja"] as const;
type UILang = (typeof UI_LANGS)[number];

export default function AuthGate() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [knownLang, setKnownLang] = useState<UILang | null>(null);
  const [syncToast, setSyncToast] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const key = `wex_onboarded_${session.user.id}`;
    if (!localStorage.getItem(key)) {
      // Language already picked pre-auth (WelcomeModal / selector) → don't ask again
      const stored = localStorage.getItem("wex_lang");
      setKnownLang(UI_LANGS.includes(stored as UILang) ? (stored as UILang) : null);
      setShowOnboarding(true);
    }
  }, [status, session?.user?.id]);

  // Sync localStorage favorites → server (once per account per device)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const userId = session.user.id;
    const carnet = getCarnet();
    if (carnet.user.syncedAccountId === userId) return;

    const localFavorites = carnet.favorites;
    if (localFavorites.length === 0) {
      markSynced(userId);
      return;
    }

    fetch(`${API_URL}/users/${userId}/favorites`)
      .then((r) => r.json())
      .then(async (data) => {
        const serverIds = new Set(
          (data.favorites ?? []).map((f: { expression_id: string }) => f.expression_id)
        );
        const toSync = localFavorites.filter((f) => !serverIds.has(f.expressionId));
        for (const fav of toSync) {
          await fetch(`${API_URL}/users/${userId}/favorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expression_id: fav.expressionId }),
          }).catch(() => {});
        }
        markSynced(userId);
        if (toSync.length > 0) {
          setSyncToast(toSync.length);
          setTimeout(() => setSyncToast(0), 4000);
        }
      })
      .catch(() => {});
  }, [status, session?.user?.id]);

  function handleOnboardingClose(uiLang: string | null) {
    if (session?.user?.id) {
      localStorage.setItem(`wex_onboarded_${session.user.id}`, "1");
      if (uiLang) {
        localStorage.setItem("wex_lang", uiLang);
      }
    }
    setShowOnboarding(false);
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          onClose={handleOnboardingClose}
          apiUrl={API_URL}
          initialUiLang={knownLang}
        />
      )}
      {syncToast > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "5rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--r-pill)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            animation: "fadeIn 200ms ease both",
          }}
        >
          {syncToast === 1
            ? "1 favorite saved to your account"
            : `${syncToast} favorites saved to your account`}
        </div>
      )}
    </>
  );
}

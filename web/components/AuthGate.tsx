"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";
import { getCarnet, markSynced, addFavoriteLocal } from "@/lib/carnet";
import { API_URL } from "@/lib/constants";

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

  // Sync favorites bidirectionally (once per account per device): push
  // local-only favorites to the server, and pull server-only favorites
  // (e.g. added from another device) into this device's localStorage —
  // otherwise a fresh device never learns about favorites saved elsewhere.
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const userId = session.user.id;
    const carnet = getCarnet();
    if (carnet.user.syncedAccountId === userId) return;

    const localFavorites = carnet.favorites;
    const localIds = new Set(localFavorites.map((f) => f.expressionId));

    type ServerFavorite = {
      expression_id: string;
      saved_at: string;
      review_box: number;
      reviewed_at: string | null;
      game_session_id: string | null;
    };

    fetch(`${API_URL}/users/${userId}/favorites`)
      .then((r) => r.json())
      .then(async (data) => {
        const serverFavorites: ServerFavorite[] = data.favorites ?? [];
        const serverIds = new Set(serverFavorites.map((f) => f.expression_id));

        const toSync = localFavorites.filter((f) => !serverIds.has(f.expressionId));
        for (const fav of toSync) {
          await fetch(`${API_URL}/users/${userId}/favorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expression_id: fav.expressionId }),
          }).catch(() => {});
        }

        const toPull = serverFavorites.filter((f) => !localIds.has(f.expression_id));
        for (const fav of toPull) {
          addFavoriteLocal({
            expressionId: fav.expression_id,
            savedAt: fav.saved_at,
            reviewBox: fav.review_box,
            reviewedAt: fav.reviewed_at,
            sessionId: fav.game_session_id,
          });
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

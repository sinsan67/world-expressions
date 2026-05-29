"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AuthGate() {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const key = `wex_onboarded_${session.user.id}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
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

  if (!showOnboarding) return null;

  return (
    <OnboardingModal
      onClose={handleOnboardingClose}
      apiUrl={API_URL}
    />
  );
}

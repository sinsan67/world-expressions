"use client";

import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback } from "react";
import type { UILang } from "./useUILang";
import { UI_LANGS } from "./useUILang";

const STORAGE_KEY = "wex_lang";

// useLayoutEffect warns "does nothing on the server" during SSR — fall back
// to useEffect there (SSR never needs the correction anyway, only the client
// hydration pass does).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type UILangContextValue = {
  uiLang: UILang;
  setUILang: (lang: UILang) => void;
};

const UILangContext = createContext<UILangContextValue>({
  uiLang: "en",
  setUILang: () => {},
});

export function UILangProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setUILangState] = useState<UILang>("en");

  // Layout effect (not a plain effect): runs synchronously right after the
  // hydration render, before the browser paints — the stored language is
  // applied before the user ever sees the "en" default, instead of after a
  // visible flash. Matters on every fresh mount (full reload, new tab —
  // e.g. the "fiche complète" links that now open target="_blank").
  useIsomorphicLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UILang | null;
    if (stored && UI_LANGS.includes(stored)) {
      setUILangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setUILang = useCallback((lang: UILang) => {
    setUILangState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  return (
    <UILangContext.Provider value={{ uiLang, setUILang }}>
      {children}
    </UILangContext.Provider>
  );
}

export function useUILangContext(): UILangContextValue {
  return useContext(UILangContext);
}

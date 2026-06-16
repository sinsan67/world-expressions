"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UILang } from "./useUILang";
import { UI_LANGS } from "./useUILang";

const STORAGE_KEY = "wex_lang";

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

  useEffect(() => {
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

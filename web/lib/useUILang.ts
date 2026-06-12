"use client";
import { useState, useEffect, useCallback } from "react";

export type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";

export const UI_LANGS: UILang[] = ["fr", "en", "es", "it", "tr", "de", "ja"];

const STORAGE_KEY = "wex_lang";

export function useUILang(defaultLang: UILang = "en"): [UILang, (lang: UILang) => void] {
  const [uiLang, setUILangState] = useState<UILang>(defaultLang);

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

  return [uiLang, setUILang];
}

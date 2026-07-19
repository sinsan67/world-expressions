import { Home, Heart, Search, User, type LucideIcon } from "lucide-react";
import type { UILang } from "@/lib/useUILang";

export type NavId = "home" | "collection" | "random" | "search" | "profile";

export type NavItem = {
  id: NavId;
  icon: LucideIcon | null; // null only for "random" — both BottomNav and Sidebar custom-render it
  href: string;
};

// Persistent nav = pivot only (atelier S208, décision 2): Jouer · Collection ·
// 🎲 · Chercher · Profil. Exploration (Atlas, Concepts, Pays, Proverbes)
// moved to the hub's "Explorer le monde" section (Hub.tsx).
export const NAV_ITEMS: NavItem[] = [
  { id: "home", icon: Home, href: "/" },
  { id: "collection", icon: Heart, href: "/collection" },
  { id: "random", icon: null, href: "/voyage?quick=1" },
  { id: "search", icon: Search, href: "/search" },
  { id: "profile", icon: User, href: "/profile" },
];

export const NAV_LABELS: Record<NavId, Record<UILang, string>> = {
  home: { fr: "Jouer", en: "Play", es: "Jugar", it: "Gioca", tr: "Oyna", de: "Spielen", ja: "遊ぶ" },
  collection: { fr: "Collection", en: "Collection", es: "Colección", it: "Collezione", tr: "Koleksiyon", de: "Sammlung", ja: "コレクション" },
  random: { fr: "Au hasard !", en: "Random mode", es: "Modo aleatorio", it: "Modalità casuale", tr: "Rastgele mod", de: "Zufallsmodus", ja: "ランダムモード" },
  search: { fr: "Chercher", en: "Search", es: "Buscar", it: "Cerca", tr: "Ara", de: "Suchen", ja: "検索" },
  profile: { fr: "Profil", en: "Profile", es: "Perfil", it: "Profilo", tr: "Profil", de: "Profil", ja: "プロフィール" },
};

export const NAV_ARIA_LABEL: Record<UILang, string> = {
  fr: "Navigation principale",
  en: "Main navigation",
  es: "Navegación principal",
  it: "Navigazione principale",
  tr: "Ana gezinme",
  de: "Hauptnavigation",
  ja: "メインナビゲーション",
};

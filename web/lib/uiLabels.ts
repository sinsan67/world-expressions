// Shared localized micro-labels used across several components.
// Editorial charter rule: no visible string may be hardcoded in a single
// language — and missing-language fallback is always English, never French.

type Lang = string;

export const FAV_LABEL: Record<Lang, { add: string; remove: string }> = {
  fr: { add: "Ajouter aux favoris",        remove: "Retirer des favoris" },
  en: { add: "Add to favorites",           remove: "Remove from favorites" },
  es: { add: "Añadir a favoritos",         remove: "Quitar de favoritos" },
  it: { add: "Aggiungi ai preferiti",      remove: "Rimuovi dai preferiti" },
  tr: { add: "Favorilere ekle",            remove: "Favorilerden çıkar" },
  de: { add: "Zu Favoriten hinzufügen",    remove: "Aus Favoriten entfernen" },
  ja: { add: "お気に入りに追加",           remove: "お気に入りから削除" },
};

export const LISTEN_LABEL: Record<Lang, { listen: string; stop: string }> = {
  fr: { listen: "Écouter",  stop: "Arrêter" },
  en: { listen: "Listen",   stop: "Stop" },
  es: { listen: "Escuchar", stop: "Detener" },
  it: { listen: "Ascolta",  stop: "Ferma" },
  tr: { listen: "Dinle",    stop: "Durdur" },
  de: { listen: "Anhören",  stop: "Stopp" },
  ja: { listen: "聴く",     stop: "停止" },
};

export const VIEW_SOURCE_LABEL: Record<Lang, string> = {
  fr: "Voir la source",
  en: "View source",
  es: "Ver la fuente",
  it: "Vedi la fonte",
  tr: "Kaynağı gör",
  de: "Quelle ansehen",
  ja: "出典を見る",
};

// "Same idea" confidence badges — wording aligned with the About page:
// Mirror (exact same meaning) · Equivalent (very close) · In the same vein (related idea).
export const CONFIDENCE_LABEL: Record<Lang, { mirror: string; equivalent: string; vein: string }> = {
  fr: { mirror: "Miroir",   equivalent: "Équivalent",   vein: "Dans la même veine" },
  en: { mirror: "Mirror",   equivalent: "Equivalent",   vein: "In the same vein" },
  es: { mirror: "Espejo",   equivalent: "Equivalente",  vein: "En la misma línea" },
  it: { mirror: "Specchio", equivalent: "Equivalente",  vein: "Sulla stessa linea" },
  tr: { mirror: "Birebir",  equivalent: "Eşdeğer",      vein: "Aynı çizgide" },
  de: { mirror: "Spiegelbild", equivalent: "Entsprechung", vein: "Gleiche Richtung" },
  ja: { mirror: "完全一致", equivalent: "ほぼ同じ",     vein: "同じ発想" },
};

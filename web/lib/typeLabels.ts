export type ExpressionType = "idiom" | "word" | "proverb" | "locution";

type LocaleMap = Record<string, string>;

export const TYPE_LABELS: Record<ExpressionType, LocaleMap> = {
  idiom: {
    fr: "Expression",  en: "Expression", es: "Expresión",  it: "Espressione", tr: "İfade",   de: "Redewendung",
  },
  word: {
    fr: "Mot",         en: "Word",       es: "Palabra",    it: "Parola",      tr: "Kelime",  de: "Wort",
  },
  proverb: {
    fr: "Proverbe",    en: "Proverb",    es: "Proverbio",  it: "Proverbio",   tr: "Atasözü", de: "Sprichwort",
  },
  locution: {
    fr: "Locution",    en: "Set phrase", es: "Locución",   it: "Locuzione",   tr: "Deyim",   de: "feste Wendung",
  },
};

/**
 * Returns the localized label for a given type slug and UI locale.
 * Returns null for "idiom" (the default — no badge shown on cards).
 * Falls back to English if the locale is not yet defined.
 */
export function getTypeLabel(type: string, locale: string): string | null {
  if (type === "idiom") return null;
  const labels = TYPE_LABELS[type as ExpressionType];
  if (!labels) return null;
  return labels[locale] ?? labels["en"] ?? type;
}

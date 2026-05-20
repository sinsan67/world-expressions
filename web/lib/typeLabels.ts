/**
 * Reference table: expression type slug → display label per UI locale.
 *
 * Only 2 structural types:
 *   expression  → a fixed multi-word phrase (the default — no badge shown on cards)
 *   word        → a single slang / verlan / argot word ("meuf", "bagnole")
 *
 * Linguistic sub-types (proverb, adage, saying, etc.) are handled as tags,
 * not as type values, so they are navigable and cross-language like all other tags.
 *
 * Add new language keys here as new UI languages are added to the app.
 */

export type ExpressionType = "expression" | "word";

type LocaleMap = Record<string, string>;

export const TYPE_LABELS: Record<ExpressionType, LocaleMap> = {
  expression: {
    // Not displayed on cards — kept here for completeness and potential future use.
    fr: "Expression",
    en: "Expression",
    es: "Expresión",
    it: "Espressione", // future
    tr: "İfade",       // future
  },
  word: {
    fr: "Mot",
    en: "Word",
    es: "Palabra",
    it: "Parola", // future
    tr: "Kelime", // future
  },
};

/**
 * Returns the localized label for a given type slug and UI locale.
 * Returns null for "expression" (no badge to show).
 * Falls back to English if the locale is not yet defined.
 */
export function getTypeLabel(type: string, locale: string): string | null {
  if (type === "expression") return null;
  const labels = TYPE_LABELS[type as ExpressionType];
  if (!labels) return null;
  return labels[locale] ?? labels["en"] ?? type;
}

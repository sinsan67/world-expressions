export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const FLAG: Record<string, string> = {
  fr: "🇫🇷", us: "🇺🇸", uk: "🇬🇧", gb: "🇬🇧", au: "🇦🇺",
  es: "🇪🇸", tr: "🇹🇷", it: "🇮🇹", de: "🇩🇪", jp: "🇯🇵",
  ar: "🇦🇷", mx: "🇲🇽", co: "🇨🇴", cl: "🇨🇱",
  pe: "🇵🇪", cu: "🇨🇺", ve: "🇻🇪",
  en: "🌐",
};

export const COUNTRY_NAME: Record<string, string> = {
  fr: "France", uk: "UK", us: "USA", au: "Australia",
  es: "España", tr: "Türkiye", it: "Italia", de: "Deutschland", jp: "日本",
  ar: "Argentina", mx: "México", co: "Colombia", cl: "Chile",
  pe: "Perú", cu: "Cuba", ve: "Venezuela",
  en: "English",
};

// Expression *language* codes (fr, en, es, it, tr, de, ja — as used by
// expression.language / the collection's per-language sections) — distinct
// from the *country* codes above (FLAG/COUNTRY_NAME are keyed by country,
// e.g. "uk"/"us"/"jp", not "en"/"ja"). "en" has no single flag of its own —
// FLAG.uk (🇬🇧) is used as the collection's stand-in, consistently.
export const LANG_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", it: "Italiano", tr: "Türkçe", de: "Deutsch", ja: "日本語",
};

export const LANG_FLAG: Record<string, string> = {
  fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", it: "🇮🇹", tr: "🇹🇷", de: "🇩🇪", ja: "🇯🇵",
};

// Countries with a photo in /public/images — others fall back to the flag gradient.
export const HERO_IMAGE_COUNTRIES = new Set(["fr", "uk", "us", "au", "es", "tr", "it", "de", "jp", "ar", "pe", "co", "cu"]);

export const COUNTRY_GRADIENT: Record<string, string> = {
  fr: "linear-gradient(90deg, #0055a4 33%, #fff 33% 67%, #ef4135 67%)",
  uk: "linear-gradient(135deg, #012169 40%, #c8102e 40% 60%, #012169 60%)",
  us: "linear-gradient(90deg, #3c3b6e 38%, #b22234 38% 75%, #fff 75%)",
  au: "linear-gradient(90deg, #00008b 50%, #fff 50% 62%, #cc0000 62%)",
  es: "linear-gradient(90deg, #c60b1e 25%, #f1bf00 25% 75%, #c60b1e 75%)",
  tr: "linear-gradient(90deg, #e30a17 80%, #fff 80%)",
  it: "linear-gradient(90deg, #009246 33%, #fff 33% 67%, #ce2b37 67%)",
  de: "linear-gradient(90deg, #000 33%, #dd0000 33% 67%, #ffce00 67%)",
  jp: "linear-gradient(90deg, #fff 35%, #BC002D 35% 65%, #fff 65%)",
  ar: "linear-gradient(90deg, #74acdf 33%, #fff 33% 67%, #74acdf 67%)",
  mx: "linear-gradient(90deg, #006847 33%, #fff 33% 67%, #ce1126 67%)",
  co: "linear-gradient(90deg, #fcd116 50%, #003087 50% 75%, #ce1126 75%)",
  cl: "linear-gradient(90deg, #0039a6 25%, #fff 25% 75%, #d52b1e 75%)",
  pe: "linear-gradient(90deg, #d91023 33%, #fff 33% 67%, #d91023 67%)",
  cu: "linear-gradient(90deg, #002a8f 33%, #fff 33% 67%, #cc0001 67%)",
  ve: "linear-gradient(90deg, #cf142b 33%, #003087 33% 67%, #fcd116 67%)",
};

export interface RegionSection {
  key: string | null;
  label: string;
  emoji: string;
}

export interface RegionSectionStyle {
  bg: string;
  accent: string;
  strip: string;
}

export interface RegionDef {
  code: string;
  name: string;
  emoji: string;
  subtitle: string;
  intro: string;
  heroGradient: string;
  tagPrefix: string;
  sections: RegionSection[];
  sectionStyles: Record<string, RegionSectionStyle>;
  defaultStyle: RegionSectionStyle;
}

const DEFAULT_STYLE: RegionSectionStyle = {
  bg: "#f5f3ef",
  accent: "#5a4a3a",
  strip: "#b0a090",
};

export const REGION_DEFS: Record<string, RegionDef> = {
  alsace: {
    code: "alsace",
    name: "Alsace",
    emoji: "🥨",
    subtitle: "Elsässisch · Entre Rhin et Vosges",
    intro:
      "Mots alsaciens et calques germaniques qui glissent quotidiennement dans le français parlé à Strasbourg, Colmar ou Mulhouse.",
    heroGradient:
      "linear-gradient(135deg, #b94b30 0%, #8b4a7a 50%, #6b4d8f 100%)",
    tagPrefix: "als-",
    sections: [
      { key: null,               label: "Toutes",            emoji: "✨" },
      { key: "als-quotidien",    label: "Mots du quotidien", emoji: "💬" },
      { key: "als-table",        label: "À table",           emoji: "🍽️" },
      { key: "als-interjection", label: "Interjections",     emoji: "❗" },
      { key: "als-calque",       label: "Français d'Alsace", emoji: "🗺️" },
    ],
    sectionStyles: {
      "als-quotidien":    { bg: "#fdf4e2", accent: "#a85c1a", strip: "#e8a84a" },
      "als-table":        { bg: "#fef0ed", accent: "#b03a2a", strip: "#d4705a" },
      "als-interjection": { bg: "#f0ecf8", accent: "#6a38a0", strip: "#9a70c8" },
      "als-calque":       { bg: "#e8f5f0", accent: "#1e6b4a", strip: "#4aaa84" },
    },
    defaultStyle: DEFAULT_STYLE,
  },

  bretagne: {
    code: "bretagne",
    name: "Bretagne",
    emoji: "🦞",
    subtitle: "Brezhoneg · Entre mer et lande",
    intro:
      "Mots bretons, termes marins et expressions du terroir qui colorent le français parlé de Brest à Saint-Malo.",
    heroGradient:
      "linear-gradient(135deg, #1e3a5f 0%, #1a5c50 50%, #2e5a2a 100%)",
    tagPrefix: "brt-",
    sections: [
      { key: null,       label: "Toutes",         emoji: "✨" },
      { key: "brt-breizh", label: "Mots bretons", emoji: "🪨" },
      { key: "brt-mer",  label: "Mer & marine",   emoji: "⚓" },
      { key: "brt-table", label: "À table",       emoji: "🥞" },
      { key: "brt-vie",  label: "Vie quotidienne", emoji: "🌿" },
    ],
    sectionStyles: {
      "brt-breizh": { bg: "#e6eef5", accent: "#1a3a5c", strip: "#3a7ab0" },
      "brt-mer":    { bg: "#e3f2f0", accent: "#1a5c50", strip: "#3aaa96" },
      "brt-table":  { bg: "#fdf5e0", accent: "#7a5c10", strip: "#d4a83a" },
      "brt-vie":    { bg: "#eaf2e5", accent: "#2a5a2a", strip: "#5a9a5a" },
    },
    defaultStyle: DEFAULT_STYLE,
  },
};

export function getSectionStyle(
  tags: string[],
  region: RegionDef
): RegionSectionStyle {
  const key = tags.find((t) => t.startsWith(region.tagPrefix));
  return region.sectionStyles[key ?? ""] ?? region.defaultStyle;
}

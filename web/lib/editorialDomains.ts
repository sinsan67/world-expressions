export type UILang = "fr" | "en" | "es" | "it" | "tr";

export type EditorialDomain = {
  slug: string;
  emoji: string;
  bg: string;
  border: string;
  labels: Record<UILang, string>;
  desc: Record<UILang, string>;
};

export const EDITORIAL_DOMAINS: EditorialDomain[] = [
  {
    slug: "work",
    emoji: "😤",
    bg: "linear-gradient(135deg, #dce8f5 0%, #c8dcee 100%)",
    border: "#b0cde4",
    labels: {
      fr: "L'effort & les épreuves",
      en: "Effort & hardship",
      es: "El esfuerzo",
      it: "Lo sforzo & le prove",
      tr: "Çaba & zorluk",
    },
    desc: {
      fr: "Souffrir, persévérer, tomber, se relever",
      en: "Suffer, persist, fall, rise",
      es: "Sufrir, perseverar, caer",
      it: "Soffrire, resistere, cadere",
      tr: "Acı çekmek, dayanmak, kalkmak",
    },
  },
  {
    slug: "relations",
    emoji: "❤️",
    bg: "linear-gradient(135deg, #fdecea 0%, #f7d6d3 100%)",
    border: "#f0b8b3",
    labels: {
      fr: "L'amour & les liens",
      en: "Love & bonds",
      es: "El amor & los lazos",
      it: "L'amore & i legami",
      tr: "Aşk & bağlar",
    },
    desc: {
      fr: "Aimer, trahir, se perdre, s'attacher",
      en: "Love, betray, lose yourself",
      es: "Amar, traicionar, perderse",
      it: "Amare, tradire, perdersi",
      tr: "Sevmek, ihanet, kaybolmak",
    },
  },
  {
    slug: "money",
    emoji: "💰",
    bg: "linear-gradient(135deg, #fdf5dc 0%, #f7e9b8 100%)",
    border: "#e8d57a",
    labels: {
      fr: "L'argent & la réussite",
      en: "Money & success",
      es: "El dinero & el éxito",
      it: "I soldi & il successo",
      tr: "Para & başarı",
    },
    desc: {
      fr: "Gagner, perdre, mériter, gaspiller",
      en: "Earn, lose, deserve, waste",
      es: "Ganar, perder, merecer",
      it: "Guadagnare, perdere, meritare",
      tr: "Kazanmak, kaybetmek, hak etmek",
    },
  },
  {
    slug: "morality",
    emoji: "🤥",
    bg: "linear-gradient(135deg, #ede8f5 0%, #dfd5f0 100%)",
    border: "#c9b8e8",
    labels: {
      fr: "Les travers humains",
      en: "Human flaws",
      es: "Los defectos humanos",
      it: "I difetti umani",
      tr: "İnsan kusurları",
    },
    desc: {
      fr: "Mentir, se vanter, esquiver, se trahir",
      en: "Lie, boast, dodge, betray yourself",
      es: "Mentir, presumir, esquivar",
      it: "Mentire, vantarsi, eludere",
      tr: "Yalan söylemek, böbürlenmek",
    },
  },
];

export const EDITORIAL_DOMAIN_MAP: Record<string, EditorialDomain> = Object.fromEntries(
  EDITORIAL_DOMAINS.map((d) => [d.slug, d])
);

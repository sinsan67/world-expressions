// Labels for the "Voyage" game (/voyage) — pivot-lot0-contract §4.
// Same pattern as uiLabels.ts: Record<Lang, …> consts, fallback is always
// English (editorial charter — never French). Lot B ships FR + EN complete;
// lot E arbitrates es/it/tr/de/ja wording with Sinan later — until then,
// every lookup below falls back to English for those languages.

type Lang = string;

export type VoyageSetupLabels = {
  title: string;
  subtitle: string;
  countryLabel: string;
  kindLabel: string;
  domainLabel: string;
  allCountries: string;
  allKinds: string;
  cta: string;
  cards: string;
  empty: string;
  serverError: string;
};

export type VoyagePlayLabels = {
  filtersEdit: string;
  quitAria: string;
  guessQuestion: string;
  revealBtn: string;
  meaningLabel: string;
  originLabel: string;
  exampleLabel: string;
  fullCard: string;
  keepBtn: string;
  keptBtn: string;
  nextBtn: string;
  reportAria: string;
  cardCounter: (current: number, total: number) => string;
};

export type VoyageRareLabels = {
  badge: string;
};

export type VoyageRecapLabels = {
  title: string;
  kept: (count: number) => string;
  collectionUpdate: string;
  replay: string;
  changeFilters: string;
  viewCollection: string;
};

export const VOYAGE_SETUP: Record<Lang, VoyageSetupLabels> = {
  fr: {
    title: "Voyage",
    subtitle: "Compose ton voyage — ou pars à l'aventure.",
    countryLabel: "Pays",
    kindLabel: "Type",
    domainLabel: "Thème",
    allCountries: "Tous les pays",
    allKinds: "Tous",
    cta: "C'est parti !",
    cards: "cartes",
    empty: "Aucune expression pour ces filtres — essaie une autre combinaison.",
    serverError: "Le serveur ne répond pas — réessaie dans un instant.",
  },
  en: {
    title: "Voyage",
    subtitle: "Compose your journey — or just set off.",
    countryLabel: "Country",
    kindLabel: "Type",
    domainLabel: "Theme",
    allCountries: "All countries",
    allKinds: "All",
    cta: "Let's go!",
    cards: "cards",
    empty: "No expression for these filters — try another combination.",
    serverError: "The server isn't responding — try again in a moment.",
  },
};

export const VOYAGE_PLAY: Record<Lang, VoyagePlayLabels> = {
  fr: {
    filtersEdit: "Changer les filtres",
    quitAria: "Quitter la partie",
    guessQuestion: "À ton avis, que veut dire cette expression ?",
    revealBtn: "Révéler le sens",
    meaningLabel: "Signification",
    originLabel: "D'où ça vient ?",
    exampleLabel: "Exemple + traduction",
    fullCard: "Voir la fiche complète →",
    keepBtn: "❤️ Garder",
    keptBtn: "❤️ Gardée !",
    nextBtn: "Suivante ⏭",
    reportAria: "Signaler cette expression",
    cardCounter: (c, t) => `carte ${c}/${t}`,
  },
  en: {
    filtersEdit: "Change filters",
    quitAria: "Quit game",
    guessQuestion: "What do you think this expression means?",
    revealBtn: "Reveal the meaning",
    meaningLabel: "Meaning",
    originLabel: "Where does it come from?",
    exampleLabel: "Example + translation",
    fullCard: "See the full card →",
    keepBtn: "❤️ Keep",
    keptBtn: "❤️ Kept!",
    nextBtn: "Next ⏭",
    reportAria: "Report this expression",
    cardCounter: (c, t) => `card ${c}/${t}`,
  },
};

export const VOYAGE_RARE: Record<Lang, VoyageRareLabels> = {
  fr: { badge: "rare ✨" },
  en: { badge: "rare ✨" },
};

export const VOYAGE_RECAP: Record<Lang, VoyageRecapLabels> = {
  fr: {
    title: "Belle pioche !",
    kept: (n) => `10 cartes vues — tu as gardé ${n} expression${n > 1 ? "s" : ""}`,
    collectionUpdate: "Ta collection s'agrandit !",
    replay: "Rejouer ▸",
    changeFilters: "Changer les filtres",
    viewCollection: "Voir ma collection ❤️",
  },
  en: {
    title: "Nice pull!",
    kept: (n) => `10 cards seen — you kept ${n} expression${n > 1 ? "s" : ""}`,
    collectionUpdate: "Your collection is growing!",
    replay: "Replay ▸",
    changeFilters: "Change filters",
    viewCollection: "View my collection ❤️",
  },
};

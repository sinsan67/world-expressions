// Labels for the games hub ("/", lot A of the games-hub pivot — see
// docs/pivot-lot0-contract.md §4). Same pattern as uiLabels.ts: every lookup
// site does `HUB_LABELS[uiLang] ?? HUB_LABELS.en` — fallback is always
// English, never French (editorial charter).
//
// FR + EN are fully arbitrated (S195 workshop). The other 5 languages are
// placeholder copies of EN until lot E arbitrates final wording with Sinan
// (contract §5) — keys must stay identical across all languages.

type Lang = string;

export type HubLabels = {
  title: string;
  voyage: { title: string; tagline: string; cta: string };
  revision: { title: string; tagline: string; cta: string };
  comingSoon: { title: string; body: string };
  daily: { title: string; hint: string };
  collection: { teaser: string; count: (n: number) => string; empty: string };
  search: { invite: string; title: string };
};

export const HUB_LABELS: Record<Lang, HubLabels> = {
  fr: {
    title: "À quoi on joue ?",
    voyage: {
      title: "Voyage",
      tagline: "10 cartes à deviner ou à faire défiler. Garde celles qui te plaisent ❤️",
      cta: "Jouer ▸",
    },
    revision: {
      title: "Révision",
      tagline: "Ne pioche que dans ta collection. Retourne la carte — tu la savais, ou pas encore ?",
      cta: "Réviser ▸",
    },
    comingSoon: {
      title: "Bientôt — un 3e jeu",
      body: "Explore les expressions sur une carte du monde… ou dans des constellations d'emojis ✨",
    },
    daily: {
      title: "Expressions du jour",
      hint: "toucher pour découvrir",
    },
    collection: {
      teaser: "Ma collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "Pas encore de favoris — garde ta première carte en jouant",
    },
    search: {
      invite: "Un mot, une émotion, une idée…",
      title: "Rechercher",
    },
  },
  en: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
  es: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
  it: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
  tr: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
  de: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
  ja: {
    title: "What shall we play?",
    voyage: {
      title: "Voyage",
      tagline: "10 cards to guess or flip through. Keep the ones you like ❤️",
      cta: "Play ▸",
    },
    revision: {
      title: "Review",
      tagline: "Draws only from your collection. Flip the card — did you know it, or not yet?",
      cta: "Review ▸",
    },
    comingSoon: {
      title: "Coming soon — a 3rd game",
      body: "Explore expressions on a world map… or in emoji constellations ✨",
    },
    daily: {
      title: "Today's expressions",
      hint: "tap to discover",
    },
    collection: {
      teaser: "My collection",
      count: (n) => `${n} expression${n > 1 ? "s" : ""}`,
      empty: "No favorites yet — keep your first card while playing",
    },
    search: {
      invite: "A word, a feeling, an idea…",
      title: "Search",
    },
  },
};

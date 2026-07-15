// Labels for "Ma collection" (/collection, lot C of the games-hub pivot —
// docs/pivot-lot0-contract.md §4). Same pattern as reportLabels.ts:
// Record<Lang, CollectionLabels>, fallback is always English, never French
// (editorial charter). FR + EN are arbitrated here; es/it/tr/de/ja are
// placeholder copies of EN until lot E arbitrates final wording with Sinan —
// keys must stay identical across all languages.

type Lang = string;

export type CollectionLabels = {
  title: string;
  totalCount: (n: number) => string;
  search: { placeholder: string };
  filters: { theme: string; type: string; allThemes: string; allTypes: string };
  sort: { byDate: string; byName: string };
  mode: {
    discovery: string;
    mastered: string;
    prompt: string;
    choose: string;
  };
  setCounter: (fav: number, total: number) => string;
  toReview: string;
  empty: { title: string; body: string; cta: string };
  noResults: string;
};

export const COLLECTION_LABELS: Record<Lang, CollectionLabels> = {
  fr: {
    title: "Ma collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Chercher : expression, sens, littéral…" },
    filters: { theme: "Thème", type: "Type", allThemes: "Tous les thèmes", allTypes: "Tous les types" },
    sort: { byDate: "Récentes d'abord", byName: "Alphabétique" },
    mode: {
      discovery: "🧳 découverte",
      mastered: "📚 maîtrisée",
      prompt: "Comment veux-tu explorer cette langue ?",
      choose: "Choisir un mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "à revoir",
    empty: {
      title: "Ta collection est vide",
      body: "Pars en Voyage et garde tes premières expressions ❤️",
      cta: "Commencer un Voyage ▸",
    },
    noResults: "Aucun résultat pour ces filtres",
  },
  en: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
  es: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
  it: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
  tr: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
  de: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
  ja: {
    title: "My collection",
    totalCount: (n) => `${n} expression${n > 1 ? "s" : ""}`,
    search: { placeholder: "Search: expression, meaning, literal…" },
    filters: { theme: "Theme", type: "Type", allThemes: "All themes", allTypes: "All types" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "How do you want to explore this language?",
      choose: "Choose a mode",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "to review",
    empty: {
      title: "Your collection is empty",
      body: "Head out on a Voyage and keep your first expressions ❤️",
      cta: "Start a Voyage ▸",
    },
    noResults: "No results for these filters",
  },
};

// Labels for Jeu 3 — Constellation (docs/game3-constellation-lot0-contract.md
// §4, §7 addendum S239/S240). Same pattern as hubLabels.ts/voyageLabels.ts:
// every lookup site does `CONSTELLATION_LABELS[uiLang] ?? CONSTELLATION_LABELS.en`
// — fallback is always English, never French (editorial charter).
//
// FR + EN only this session (contract §4: "es/it/tr/de/ja complétés + wording
// arbitré avec Sinan au lot i18n"). Keyed as Record<string, X> rather than a
// literal language union so partial coverage still type-checks — same trick
// hubLabels.ts/voyageLabels.ts used while being built up lot by lot. The
// browse* keys (added S240, addendum §7.2/§7.3) stay within this same
// FR+EN-only scope deliberately — no reason to widen coverage for one view
// while the rest of the file is still a documented i18n debt.
//
// Display name is a placeholder ("Constellation") — contract §0.1: "Nom
// d'affichage FR final au lot i18n", not decided yet.
//
// `reveal` removed S240 (addendum §7.1) — the "Révéler" button is gone,
// examples now fade in automatically once GET /constellation/tag/{tag}
// resolves.

export type ConstellationLabels = {
  title: string;
  hint: string;
  keepBtn: string;
  keptBtn: string;
  close: string;
  placeholder: string;
  // "Parcourir/Filtrer" view (addendum §7.2/§7.3)
  browseEntryAria: string;
  browseTitle: string;
  browseDesc: string;
  browseBack: string;
  browseResultsHeading: string;
  browseLoading: string;
  browseLoadMore: string;
  browseNoResults: string;
  browseCount: (n: number) => string;
  browseAllDisplayed: (n: number) => string;
};

export const CONSTELLATION_LABELS: Record<string, ConstellationLabels> = {
  fr: {
    title: "Constellation",
    hint: "Glisse pour te déplacer, pince ou molette pour zoomer, touche un nœud pour découvrir des proverbes.",
    keepBtn: "❤️ Garder",
    keptBtn: "❤️ Gardé",
    close: "Fermer",
    placeholder: "Pas encore de proverbe préparé pour ce thème.",
    browseEntryAria: "Parcourir par pays",
    browseTitle: "Parcourir les proverbes",
    browseDesc: "Filtre les proverbes de la constellation par pays.",
    browseBack: "Constellation",
    browseResultsHeading: "Proverbes",
    browseLoading: "Chargement…",
    browseLoadMore: "Voir plus",
    browseNoResults: "Aucun proverbe trouvé.",
    browseCount: (n) => `${n} proverbe${n > 1 ? "s" : ""}`,
    browseAllDisplayed: (n) => `${n} proverbe${n > 1 ? "s" : ""} au total`,
  },
  en: {
    title: "Constellation",
    hint: "Drag to pan, pinch or scroll to zoom, tap a node to discover proverbs.",
    keepBtn: "❤️ Keep",
    keptBtn: "❤️ Kept",
    close: "Close",
    placeholder: "No proverb ready for this theme yet.",
    browseEntryAria: "Browse by country",
    browseTitle: "Browse the proverbs",
    browseDesc: "Filter the constellation's proverbs by country.",
    browseBack: "Constellation",
    browseResultsHeading: "Proverbs",
    browseLoading: "Loading…",
    browseLoadMore: "Load more",
    browseNoResults: "No proverbs found.",
    browseCount: (n) => `${n} proverb${n > 1 ? "s" : ""}`,
    browseAllDisplayed: (n) => `${n} proverb${n > 1 ? "s" : ""} in total`,
  },
};

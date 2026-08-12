// Labels for Jeu 3 — Constellation (docs/game3-constellation-lot0-contract.md
// §4). Same pattern as hubLabels.ts/voyageLabels.ts: every lookup site does
// `CONSTELLATION_LABELS[uiLang] ?? CONSTELLATION_LABELS.en` — fallback is
// always English, never French (editorial charter).
//
// FR + EN only this session (contract §4: "es/it/tr/de/ja complétés + wording
// arbitré avec Sinan au lot i18n"). Keyed as Record<string, X> rather than a
// literal language union so partial coverage still type-checks — same trick
// hubLabels.ts/voyageLabels.ts used while being built up lot by lot.
//
// Display name is a placeholder ("Constellation") — contract §0.1: "Nom
// d'affichage FR final au lot i18n", not decided yet.

export type ConstellationLabels = {
  title: string;
  hint: string;
  reveal: string;
  keepBtn: string;
  keptBtn: string;
  close: string;
  placeholder: string;
};

export const CONSTELLATION_LABELS: Record<string, ConstellationLabels> = {
  fr: {
    title: "Constellation",
    hint: "Glisse pour te déplacer, pince ou molette pour zoomer, touche un nœud pour découvrir des proverbes.",
    reveal: "Révéler",
    keepBtn: "❤️ Garder",
    keptBtn: "❤️ Gardé",
    close: "Fermer",
    placeholder: "Pas encore de proverbe préparé pour ce thème.",
  },
  en: {
    title: "Constellation",
    hint: "Drag to pan, pinch or scroll to zoom, tap a node to discover proverbs.",
    reveal: "Reveal",
    keepBtn: "❤️ Keep",
    keptBtn: "❤️ Kept",
    close: "Close",
    placeholder: "No proverb ready for this theme yet.",
  },
};

// Labels for the "Révision" game (/revision, lot D of the games-hub pivot —
// docs/pivot-lot0-contract.md §4). Same pattern as voyageLabels.ts/
// hubLabels.ts: Record<Lang, …> consts, fallback is always English
// (editorial charter — never French). Lot D ships FR + EN only; lot E-style
// completion for es/it/tr/de/ja is a follow-up (documented/expected — every
// lookup site falls back to English until then).

type Lang = string;

export type RevisionLabels = {
  quitAria: string;
  flip: string;
  flipBtn: string;
  knew: string;
  notYet: string;
  queue: { toReview: string; fresh: string; known: string };
  empty: {
    rebound: { title: string; body: string; cta: string };
  };
  locked: {
    title: string;
    pairing: (missing: number) => string;
    cta: string;
  };
  recap: {
    title: string;
    tally: (knewCount: number, total: number) => string;
    replay: string;
    viewCollection: string;
    backHub: string;
  };
  reportAria: string;
  fullCard: string;
  meaningLabel: string;
  originLabel: string;
  exampleLabel: string;
  listenAria: string;
};

export const REVISION_LABELS: Record<Lang, RevisionLabels> = {
  fr: {
    quitAria: "Quitter la révision",
    flip: "Retourne la carte — tu la savais, ou pas encore ?",
    flipBtn: "Retourner la carte",
    knew: "Je savais ✅",
    notYet: "Pas encore 🔁",
    queue: { toReview: "à revoir", fresh: "nouvelles", known: "sues" },
    empty: {
      rebound: {
        title: "Rien à réviser pour l'instant",
        body: "Pars d'abord garder quelques expressions en Voyage ❤️",
        cta: "Partir en Voyage ▸",
      },
    },
    locked: {
      title: "Presque !",
      pairing: (n) => `Garde encore ${n} expression${n > 1 ? "s" : ""}`,
      cta: "Continuer en Voyage ▸",
    },
    recap: {
      title: "Révision terminée !",
      tally: (knewCount, total) => `${knewCount}/${total} déjà sues`,
      replay: "Rejouer ▸",
      viewCollection: "Voir ma collection ❤️",
      backHub: "Retour à l'accueil",
    },
    reportAria: "Signaler cette expression",
    fullCard: "📖 Fiche complète",
    meaningLabel: "Signification",
    originLabel: "D'où ça vient ?",
    exampleLabel: "Exemple + traduction",
    listenAria: "Écouter la prononciation",
  },
  en: {
    quitAria: "Quit revision",
    flip: "Flip the card — did you know it, or not yet?",
    flipBtn: "Flip the card",
    knew: "I knew it ✅",
    notYet: "Not yet 🔁",
    queue: { toReview: "to review", fresh: "new", known: "known" },
    empty: {
      rebound: {
        title: "Nothing to review yet",
        body: "Go keep a few expressions in Voyage first ❤️",
        cta: "Head to Voyage ▸",
      },
    },
    locked: {
      title: "Almost there!",
      pairing: (n) => `Keep ${n} more expression${n > 1 ? "s" : ""}`,
      cta: "Continue in Voyage ▸",
    },
    recap: {
      title: "Review done!",
      tally: (knewCount, total) => `${knewCount}/${total} already known`,
      replay: "Replay ▸",
      viewCollection: "View my collection ❤️",
      backHub: "Back to home",
    },
    reportAria: "Report this expression",
    fullCard: "📖 Full card",
    meaningLabel: "Meaning",
    originLabel: "Where does it come from?",
    exampleLabel: "Example + translation",
    listenAria: "Listen to the pronunciation",
  },
};

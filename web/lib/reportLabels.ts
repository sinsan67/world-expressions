// Labels for the "Report 🚩" feature (flag a wrong/fabricated expression) —
// wired on top of the already-live POST /reports endpoint (models.py
// ExpressionReport / main.py ~L424-486). Same pattern as hubLabels.ts /
// voyageLabels.ts: Record<Lang, ReportLabels>, fallback is always English,
// never French (editorial charter). FR + EN are arbitrated here; es/it/tr/de/ja
// are placeholder copies of EN until a later lot arbitrates final wording
// with Sinan — keys must stay identical across all languages.

type Lang = string;

export type ReportLabels = {
  flag: string;
  title: string;
  reasons: {
    fabricated: string;
    wrongTranslation: string;
    duplicate: string;
    other: string;
  };
  commentPlaceholder: string;
  submit: string;
  thanks: string;
};

export const REPORT_LABELS: Record<Lang, ReportLabels> = {
  fr: {
    flag: "Signaler cette expression",
    title: "Signaler un problème",
    reasons: {
      fabricated: "Expression inventée",
      wrongTranslation: "Mauvaise traduction",
      duplicate: "Doublon",
      other: "Autre",
    },
    commentPlaceholder: "Précisez si besoin (facultatif)",
    submit: "Envoyer",
    thanks: "Merci, c'est noté !",
  },
  en: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
  es: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
  it: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
  tr: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
  de: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
  ja: {
    flag: "Report this expression",
    title: "Report a problem",
    reasons: {
      fabricated: "Made-up expression",
      wrongTranslation: "Wrong translation",
      duplicate: "Duplicate",
      other: "Other",
    },
    commentPlaceholder: "Add details if you like (optional)",
    submit: "Send",
    thanks: "Thanks, noted!",
  },
};

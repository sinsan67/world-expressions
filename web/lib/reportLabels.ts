// Labels for the "Report 🚩" feature (flag a wrong/fabricated expression) —
// wired on top of the already-live POST /reports endpoint (models.py
// ExpressionReport / main.py ~L424-486). Same pattern as hubLabels.ts /
// voyageLabels.ts: Record<Lang, ReportLabels>, fallback is always English,
// never French (editorial charter). FR + EN are arbitrated here; es/it/tr/de/ja
// were arbitrated with Sinan in lot E (S203) — keys must stay identical
// across all languages. Native-speaker proofreading welcome, especially
// for ja.

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
    flag: "Reportar esta expresión",
    title: "Señalar un problema",
    reasons: {
      fabricated: "Expresión inventada",
      wrongTranslation: "Traducción incorrecta",
      duplicate: "Duplicado",
      other: "Otro",
    },
    commentPlaceholder: "Añade detalles si quieres (opcional)",
    submit: "Enviar",
    thanks: "¡Gracias, tomamos nota!",
  },
  it: {
    flag: "Segnala questa espressione",
    title: "Segnala un problema",
    reasons: {
      fabricated: "Espressione inventata",
      wrongTranslation: "Traduzione sbagliata",
      duplicate: "Doppione",
      other: "Altro",
    },
    commentPlaceholder: "Aggiungi dettagli se vuoi (facoltativo)",
    submit: "Invia",
    thanks: "Grazie, ne prendiamo nota!",
  },
  tr: {
    flag: "Bu deyimi bildir",
    title: "Bir sorun bildir",
    reasons: {
      fabricated: "Uydurma deyim",
      wrongTranslation: "Yanlış çeviri",
      duplicate: "Tekrarlanan kayıt",
      other: "Diğer",
    },
    commentPlaceholder: "İstersen ayrıntı ekle (isteğe bağlı)",
    submit: "Gönder",
    thanks: "Teşekkürler, not aldık!",
  },
  de: {
    flag: "Diesen Ausdruck melden",
    title: "Ein Problem melden",
    reasons: {
      fabricated: "Erfundener Ausdruck",
      wrongTranslation: "Falsche Übersetzung",
      duplicate: "Dublette",
      other: "Sonstiges",
    },
    commentPlaceholder: "Füg gern Details hinzu (optional)",
    submit: "Senden",
    thanks: "Danke, ist notiert!",
  },
  ja: {
    flag: "この表現を報告",
    title: "問題を報告する",
    reasons: {
      fabricated: "実在しない表現",
      wrongTranslation: "訳が間違っている",
      duplicate: "重複している",
      other: "その他",
    },
    commentPlaceholder: "よければ詳しく教えてください（任意）",
    submit: "送信",
    thanks: "ありがとうございます。確認しますね！",
  },
};

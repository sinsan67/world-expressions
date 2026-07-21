// Labels for "Ma collection" (/collection, lot C of the games-hub pivot —
// docs/pivot-lot0-contract.md §4). Same pattern as reportLabels.ts:
// Record<Lang, CollectionLabels>, fallback is always English, never French
// (editorial charter). FR + EN are arbitrated here; es/it/tr/de/ja were
// arbitrated with Sinan in lot E (S203) — keys must stay identical across
// all languages. Native-speaker proofreading welcome, especially for ja.

type Lang = string;

export type CollectionLabels = {
  title: string;
  totalCount: (n: number) => string;
  search: { placeholder: string };
  filters: { theme: string; type: string; country: string; allThemes: string; allTypes: string; allCountries: string };
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
    filters: { theme: "Thème", type: "Type", country: "Pays", allThemes: "Tous les thèmes", allTypes: "Tous les types", allCountries: "Tous les pays" },
    sort: { byDate: "Récentes d'abord", byName: "Alphabétique" },
    mode: {
      discovery: "🧳 découverte",
      mastered: "📚 maîtrisée",
      prompt: "Où en es-tu avec cette langue ?",
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
    filters: { theme: "Theme", type: "Type", country: "Country", allThemes: "All themes", allTypes: "All types", allCountries: "All countries" },
    sort: { byDate: "Recent first", byName: "Alphabetical" },
    mode: {
      discovery: "🧳 discovery",
      mastered: "📚 mastered",
      prompt: "Where are you with this language?",
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
    title: "Mi colección",
    totalCount: (n) => `${n} ${n === 1 ? "expresión" : "expresiones"}`,
    search: { placeholder: "Buscar: expresión, significado, literal…" },
    filters: { theme: "Tema", type: "Tipo", country: "País", allThemes: "Todos los temas", allTypes: "Todos los tipos", allCountries: "Todos los países" },
    sort: { byDate: "Más recientes primero", byName: "Alfabético" },
    mode: {
      discovery: "🧳 descubrimiento",
      mastered: "📚 dominado",
      prompt: "¿Dónde estás con este idioma?",
      choose: "Elegir un modo",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "por repasar",
    empty: {
      title: "Tu colección está vacía",
      body: "Sal de Viaje y guarda tus primeras expresiones ❤️",
      cta: "Empezar un Viaje ▸",
    },
    noResults: "Sin resultados para estos filtros",
  },
  it: {
    title: "La mia collezione",
    totalCount: (n) => `${n} ${n === 1 ? "espressione" : "espressioni"}`,
    search: { placeholder: "Cerca: espressione, significato, letterale…" },
    filters: { theme: "Tema", type: "Tipo", country: "Paese", allThemes: "Tutti i temi", allTypes: "Tutti i tipi", allCountries: "Tutti i paesi" },
    sort: { byDate: "Più recenti prima", byName: "Alfabetico" },
    mode: {
      discovery: "🧳 scoperta",
      mastered: "📚 padronanza",
      prompt: "A che punto sei con questa lingua?",
      choose: "Scegli una modalità",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "da ripassare",
    empty: {
      title: "La tua collezione è vuota",
      body: "Parti in Viaggio e conserva le tue prime espressioni ❤️",
      cta: "Inizia un Viaggio ▸",
    },
    noResults: "Nessun risultato per questi filtri",
  },
  tr: {
    title: "Koleksiyonum",
    totalCount: (n) => `${n} deyim`,
    search: { placeholder: "Ara: deyim, anlam, birebir çeviri…" },
    filters: { theme: "Tema", type: "Tür", country: "Ülke", allThemes: "Tüm temalar", allTypes: "Tüm türler", allCountries: "Tüm ülkeler" },
    sort: { byDate: "Önce en yeniler", byName: "Alfabetik" },
    mode: {
      discovery: "🧳 keşif",
      mastered: "📚 ustalık",
      prompt: "Bu dilde ne durumdasın?",
      choose: "Bir mod seç",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "tekrar edilecek",
    empty: {
      title: "Koleksiyonun boş",
      body: "Yolculuğa çık, ilk deyimlerini sakla ❤️",
      cta: "Yolculuğa başla ▸",
    },
    noResults: "Bu filtreler için sonuç yok",
  },
  de: {
    title: "Meine Sammlung",
    totalCount: (n) => `${n} ${n === 1 ? "Ausdruck" : "Ausdrücke"}`,
    search: { placeholder: "Suchen: Ausdruck, Bedeutung, wörtlich…" },
    filters: { theme: "Thema", type: "Typ", country: "Land", allThemes: "Alle Themen", allTypes: "Alle Typen", allCountries: "Alle Länder" },
    sort: { byDate: "Neueste zuerst", byName: "Alphabetisch" },
    mode: {
      discovery: "🧳 entdecken",
      mastered: "📚 gemeistert",
      prompt: "Wo stehst du bei dieser Sprache?",
      choose: "Modus wählen",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "zu wiederholen",
    empty: {
      title: "Deine Sammlung ist leer",
      body: "Geh auf Reise und behalte deine ersten Ausdrücke ❤️",
      cta: "Eine Reise starten ▸",
    },
    noResults: "Keine Ergebnisse für diese Filter",
  },
  ja: {
    title: "マイコレクション",
    totalCount: (n) => `${n}個の表現`,
    search: { placeholder: "検索：表現、意味、直訳…" },
    filters: { theme: "テーマ", type: "タイプ", country: "国", allThemes: "すべてのテーマ", allTypes: "すべてのタイプ", allCountries: "すべての国" },
    sort: { byDate: "新しい順", byName: "アルファベット順" },
    mode: {
      discovery: "🧳 発見",
      mastered: "📚 マスター済み",
      prompt: "この言語、今どのくらい？",
      choose: "モードを選ぶ",
    },
    setCounter: (fav, total) => `${fav} / ${total}`,
    toReview: "復習待ち",
    empty: {
      title: "コレクションはまだ空です",
      body: "旅に出て、最初の表現を集めましょう ❤️",
      cta: "旅を始める ▸",
    },
    noResults: "この条件に一致する結果はありません",
  },
};

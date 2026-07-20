// Labels for the "Voyage" game (/voyage) — pivot-lot0-contract §4.
// Same pattern as uiLabels.ts: Record<Lang, …> consts, fallback is always
// English (editorial charter — never French). Lot B shipped FR + EN; lot E
// (S203) arbitrated es/it/tr/de/ja wording with Sinan — keys must stay
// identical across all languages. Native-speaker proofreading welcome,
// especially for ja.

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
  // Presets (Lot S, S210) — one-tap starts above the collapsible composer.
  presetSurprise: string;
  presetSurpriseDesc: string;
  presetDaily: string;
  presetDailyDesc: (country: string) => string;
  presetProverbs: string;
  presetProverbsDesc: string;
  presetLastTime: string;
  composeToggle: string;
  orDivider: string;
  randomCountryAria: string;
  randomKindAria: string;
  randomDomainAria: string;
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
  explore: string;
  changeFilters: string;
  viewCollection: string;
  emptyKept: string;
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
    presetSurprise: "Surprends-moi",
    presetSurpriseDesc: "Tout le globe, tout mélangé",
    presetDaily: "Destination du jour",
    presetDailyDesc: (country) => `Aujourd'hui : ${country} — demain, un autre pays`,
    presetProverbs: "Proverbes du monde",
    presetProverbsDesc: "La sagesse de tous les pays",
    presetLastTime: "Comme la dernière fois",
    composeToggle: "Composer mon voyage",
    orDivider: "ou",
    randomCountryAria: "Choisir un pays au hasard",
    randomKindAria: "Choisir un type au hasard",
    randomDomainAria: "Choisir un thème au hasard",
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
    presetSurprise: "Surprise me",
    presetSurpriseDesc: "The whole globe, all mixed up",
    presetDaily: "Destination of the day",
    presetDailyDesc: (country) => `Today: ${country} — tomorrow, a new country`,
    presetProverbs: "Proverbs of the world",
    presetProverbsDesc: "Wisdom from every country",
    presetLastTime: "Same as last time",
    composeToggle: "Compose your journey",
    orDivider: "or",
    randomCountryAria: "Pick a random country",
    randomKindAria: "Pick a random type",
    randomDomainAria: "Pick a random theme",
  },
  es: {
    title: "Viaje",
    subtitle: "Diseña tu viaje — o lánzate a la aventura.",
    countryLabel: "País",
    kindLabel: "Tipo",
    domainLabel: "Tema",
    allCountries: "Todos los países",
    allKinds: "Todos",
    cta: "¡Vamos!",
    cards: "cartas",
    empty: "No hay expresiones para estos filtros — prueba otra combinación.",
    serverError: "El servidor no responde — inténtalo de nuevo en un momento.",
    presetSurprise: "Sorpréndeme",
    presetSurpriseDesc: "Todo el mundo, todo mezclado",
    presetDaily: "Destino del día",
    presetDailyDesc: (country) => `Hoy: ${country} — mañana, otro país`,
    presetProverbs: "Proverbios del mundo",
    presetProverbsDesc: "La sabiduría de todos los países",
    presetLastTime: "Como la última vez",
    composeToggle: "Diseñar mi viaje",
    orDivider: "o",
    randomCountryAria: "Elegir un país al azar",
    randomKindAria: "Elegir un tipo al azar",
    randomDomainAria: "Elegir un tema al azar",
  },
  it: {
    title: "Viaggio",
    subtitle: "Componi il tuo viaggio — o parti all'avventura.",
    countryLabel: "Paese",
    kindLabel: "Tipo",
    domainLabel: "Tema",
    allCountries: "Tutti i paesi",
    allKinds: "Tutti",
    cta: "Si parte!",
    cards: "carte",
    empty: "Nessuna espressione per questi filtri — prova un'altra combinazione.",
    serverError: "Il server non risponde — riprova tra un momento.",
    presetSurprise: "Sorprendimi",
    presetSurpriseDesc: "Tutto il mondo, tutto mescolato",
    presetDaily: "Destinazione del giorno",
    presetDailyDesc: (country) => `Oggi: ${country} — domani, un altro paese`,
    presetProverbs: "Proverbi del mondo",
    presetProverbsDesc: "La saggezza di tutti i paesi",
    presetLastTime: "Come l'ultima volta",
    composeToggle: "Componi il tuo viaggio",
    orDivider: "oppure",
    randomCountryAria: "Scegli un paese a caso",
    randomKindAria: "Scegli un tipo a caso",
    randomDomainAria: "Scegli un tema a caso",
  },
  tr: {
    title: "Yolculuk",
    subtitle: "Yolculuğunu tasarla — ya da kendini maceraya bırak.",
    countryLabel: "Ülke",
    kindLabel: "Tür",
    domainLabel: "Tema",
    allCountries: "Tüm ülkeler",
    allKinds: "Tümü",
    cta: "Hadi başlayalım!",
    cards: "kart",
    empty: "Bu filtreler için deyim yok — başka bir kombinasyon dene.",
    serverError: "Sunucu yanıt vermiyor — birazdan tekrar dene.",
    presetSurprise: "Beni şaşırt",
    presetSurpriseDesc: "Tüm dünya, birbirine karışmış",
    presetDaily: "Günün destinasyonu",
    presetDailyDesc: (country) => `Bugün: ${country} — yarın başka bir ülke`,
    presetProverbs: "Dünyanın atasözleri",
    presetProverbsDesc: "Tüm ülkelerin bilgeliği",
    presetLastTime: "Geçen sefer gibi",
    composeToggle: "Yolculuğumu tasarla",
    orDivider: "ya da",
    randomCountryAria: "Rastgele bir ülke seç",
    randomKindAria: "Rastgele bir tür seç",
    randomDomainAria: "Rastgele bir tema seç",
  },
  de: {
    title: "Reise",
    subtitle: "Stell deine Reise zusammen — oder stürz dich ins Abenteuer.",
    countryLabel: "Land",
    kindLabel: "Typ",
    domainLabel: "Thema",
    allCountries: "Alle Länder",
    allKinds: "Alle",
    cta: "Los geht's!",
    cards: "Karten",
    empty: "Keine Ausdrücke für diese Filter — versuch eine andere Kombination.",
    serverError: "Der Server antwortet nicht — versuch es gleich noch einmal.",
    presetSurprise: "Überrasch mich",
    presetSurpriseDesc: "Die ganze Welt, alles gemischt",
    presetDaily: "Reiseziel des Tages",
    presetDailyDesc: (country) => `Heute: ${country} — morgen ein anderes Land`,
    presetProverbs: "Sprichwörter der Welt",
    presetProverbsDesc: "Die Weisheit aller Länder",
    presetLastTime: "Wie beim letzten Mal",
    composeToggle: "Meine Reise zusammenstellen",
    orDivider: "oder",
    randomCountryAria: "Zufälliges Land wählen",
    randomKindAria: "Zufälligen Typ wählen",
    randomDomainAria: "Zufälliges Thema wählen",
  },
  ja: {
    title: "旅",
    subtitle: "旅をデザインしましょう——それとも、思いつくままに？",
    countryLabel: "国",
    kindLabel: "タイプ",
    domainLabel: "テーマ",
    allCountries: "すべての国",
    allKinds: "すべて",
    cta: "出発！",
    cards: "枚",
    empty: "この条件に合う表現がありません — 別の組み合わせを試してみましょう。",
    serverError: "サーバーが応答していません — もう一度お試しください。",
    presetSurprise: "サプライズにお任せ",
    presetSurpriseDesc: "世界中をぜんぶミックス",
    presetDaily: "今日の旅先",
    presetDailyDesc: (country) => `今日は：${country} — 明日はまた別の国`,
    presetProverbs: "世界のことわざ",
    presetProverbsDesc: "すべての国の知恵",
    presetLastTime: "前回と同じ設定で",
    composeToggle: "旅をカスタマイズ",
    orDivider: "または",
    randomCountryAria: "国をランダムに選ぶ",
    randomKindAria: "タイプをランダムに選ぶ",
    randomDomainAria: "テーマをランダムに選ぶ",
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
  es: {
    filtersEdit: "Cambiar filtros",
    quitAria: "Salir de la partida",
    guessQuestion: "¿Qué crees que significa esta expresión?",
    revealBtn: "Revelar el significado",
    meaningLabel: "Significado",
    originLabel: "¿De dónde viene?",
    exampleLabel: "Ejemplo + traducción",
    fullCard: "Ver la ficha completa →",
    keepBtn: "❤️ Guardar",
    keptBtn: "❤️ ¡Guardada!",
    nextBtn: "Siguiente ⏭",
    reportAria: "Reportar esta expresión",
    cardCounter: (c, t) => `carta ${c}/${t}`,
  },
  it: {
    filtersEdit: "Cambia filtri",
    quitAria: "Esci dalla partita",
    guessQuestion: "Secondo te, cosa significa questa espressione?",
    revealBtn: "Rivela il significato",
    meaningLabel: "Significato",
    originLabel: "Da dove viene?",
    exampleLabel: "Esempio + traduzione",
    fullCard: "Vedi la scheda completa →",
    keepBtn: "❤️ Conserva",
    keptBtn: "❤️ Conservata!",
    nextBtn: "Successiva ⏭",
    reportAria: "Segnala questa espressione",
    cardCounter: (c, t) => `carta ${c}/${t}`,
  },
  tr: {
    filtersEdit: "Filtreleri değiştir",
    quitAria: "Oyundan çık",
    guessQuestion: "Sence bu deyim ne anlama geliyor?",
    revealBtn: "Anlamı göster",
    meaningLabel: "Anlamı",
    originLabel: "Nereden geliyor?",
    exampleLabel: "Örnek + çeviri",
    fullCard: "Tam kartı gör →",
    keepBtn: "❤️ Sakla",
    keptBtn: "❤️ Saklandı!",
    nextBtn: "Sonraki ⏭",
    reportAria: "Bu deyimi bildir",
    cardCounter: (c, t) => `kart ${c}/${t}`,
  },
  de: {
    filtersEdit: "Filter ändern",
    quitAria: "Spiel verlassen",
    guessQuestion: "Was, denkst du, bedeutet dieser Ausdruck?",
    revealBtn: "Bedeutung zeigen",
    meaningLabel: "Bedeutung",
    originLabel: "Woher kommt das?",
    exampleLabel: "Beispiel + Übersetzung",
    fullCard: "Ganze Karte ansehen →",
    keepBtn: "❤️ Behalten",
    keptBtn: "❤️ Behalten!",
    nextBtn: "Weiter ⏭",
    reportAria: "Diesen Ausdruck melden",
    cardCounter: (c, t) => `Karte ${c}/${t}`,
  },
  ja: {
    filtersEdit: "フィルターを変更",
    quitAria: "ゲームを終了",
    guessQuestion: "この表現、どんな意味だと思いますか？",
    revealBtn: "意味を見る",
    meaningLabel: "意味",
    originLabel: "由来は？",
    exampleLabel: "例文と訳",
    fullCard: "カード全体を見る →",
    keepBtn: "❤️ 残す",
    keptBtn: "❤️ 残しました！",
    nextBtn: "次へ ⏭",
    reportAria: "この表現を報告",
    cardCounter: (c, t) => `カード ${c}/${t}`,
  },
};

export const VOYAGE_RARE: Record<Lang, VoyageRareLabels> = {
  fr: { badge: "rare ✨" },
  en: { badge: "rare ✨" },
  es: { badge: "rara ✨" },
  it: { badge: "rara ✨" },
  tr: { badge: "nadir ✨" },
  de: { badge: "selten ✨" },
  ja: { badge: "レア ✨" },
};

export const VOYAGE_RECAP: Record<Lang, VoyageRecapLabels> = {
  fr: {
    title: "Belle pioche !",
    kept: (n) => `10 cartes vues — tu as gardé ${n} expression${n > 1 ? "s" : ""}`,
    collectionUpdate: "Ta collection s'agrandit !",
    replay: "Rejouer ▸",
    explore: "Explorer ces expressions 🧭",
    changeFilters: "Changer les filtres",
    viewCollection: "Voir ma collection ❤️",
    emptyKept: "Aucune carte gardée cette fois — retente ta chance !",
  },
  en: {
    title: "Nice pull!",
    kept: (n) => `10 cards seen — you kept ${n} expression${n > 1 ? "s" : ""}`,
    collectionUpdate: "Your collection is growing!",
    replay: "Replay ▸",
    explore: "Explore these expressions 🧭",
    changeFilters: "Change filters",
    viewCollection: "View my collection ❤️",
    emptyKept: "No cards kept this time — give it another go!",
  },
  es: {
    title: "¡Buena pesca!",
    kept: (n) => `10 cartas vistas — guardaste ${n} ${n === 1 ? "expresión" : "expresiones"}`,
    collectionUpdate: "¡Tu colección crece!",
    replay: "Jugar de nuevo ▸",
    explore: "Explorar estas expresiones 🧭",
    changeFilters: "Cambiar filtros",
    viewCollection: "Ver mi colección ❤️",
    emptyKept: "No guardaste ninguna carta esta vez — ¡inténtalo de nuevo!",
  },
  it: {
    title: "Bella pescata!",
    kept: (n) => `10 carte viste — hai conservato ${n} ${n === 1 ? "espressione" : "espressioni"}`,
    collectionUpdate: "La tua collezione cresce!",
    replay: "Rigioca ▸",
    explore: "Esplora queste espressioni 🧭",
    changeFilters: "Cambia filtri",
    viewCollection: "Vedi la mia collezione ❤️",
    emptyKept: "Nessuna carta conservata questa volta — riprova!",
  },
  tr: {
    title: "Ne yolculuk ama!",
    kept: (n) => `10 kart görüldü — ${n} deyim sakladın`,
    collectionUpdate: "Koleksiyonun büyüyor!",
    replay: "Yeniden oyna ▸",
    explore: "Bu deyimleri keşfet 🧭",
    changeFilters: "Filtreleri değiştir",
    viewCollection: "Koleksiyonumu gör ❤️",
    emptyKept: "Bu sefer hiç kart saklamadın — bir şans daha dene!",
  },
  de: {
    title: "Guter Fang!",
    kept: (n) => `10 Karten gesehen — du hast ${n} ${n === 1 ? "Ausdruck" : "Ausdrücke"} behalten`,
    collectionUpdate: "Deine Sammlung wächst!",
    replay: "Nochmal spielen ▸",
    explore: "Diese Ausdrücke erkunden 🧭",
    changeFilters: "Filter ändern",
    viewCollection: "Meine Sammlung ansehen ❤️",
    emptyKept: "Diesmal keine Karte behalten — versuch's nochmal!",
  },
  ja: {
    title: "いい旅でしたね！",
    kept: (n) => `10枚のカードを見ました — ${n}個の表現を残しました`,
    collectionUpdate: "コレクションが増えていきます！",
    replay: "もう一度遊ぶ ▸",
    explore: "これらの表現を探索 🧭",
    changeFilters: "フィルターを変更",
    viewCollection: "マイコレクションを見る ❤️",
    emptyKept: "今回は残したカードがありませんでした — もう一度挑戦してみましょう！",
  },
};

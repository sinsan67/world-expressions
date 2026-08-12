// Labels for the games hub ("/", lot A of the games-hub pivot — see
// docs/pivot-lot0-contract.md §4). Same pattern as uiLabels.ts: every lookup
// site does `HUB_LABELS[uiLang] ?? HUB_LABELS.en` — fallback is always
// English, never French (editorial charter).
//
// FR + EN are fully arbitrated (S195 workshop). es/it/tr/de/ja were
// arbitrated with Sinan in lot E (S203, contract §5) — keys must stay
// identical across all languages. Native-speaker proofreading welcome,
// especially for ja.

type Lang = string;

export type HubLabels = {
  title: string;
  voyage: { title: string; tagline: string; cta: string };
  revision: { title: string; tagline: string; cta: string };
  constellation: { title: string; tagline: string; cta: string };
  comingSoon: { title: string; body: string };
  daily: { title: string; hint: string };
  collection: { teaser: string; count: (n: number) => string; empty: string };
  search: { invite: string; title: string };
  explore: { title: string; atlas: string; concepts: string; countries: string; proverbs: string };
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
    constellation: {
      title: "Constellation",
      tagline: "Touche un nœud, découvre 2-3 proverbes du monde. Garde ceux qui te parlent ❤️",
      cta: "Explorer ▸",
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
    explore: {
      title: "Explorer le monde",
      atlas: "Atlas",
      concepts: "Concepts",
      countries: "Pays",
      proverbs: "Proverbes",
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
    constellation: {
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
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
    explore: {
      title: "Explore the world",
      atlas: "Atlas",
      concepts: "Concepts",
      countries: "Countries",
      proverbs: "Proverbs",
    },
  },
  es: {
    title: "¿A qué jugamos?",
    voyage: {
      title: "Viaje",
      tagline: "10 cartas para adivinar o pasar. Guarda las que te gusten ❤️",
      cta: "Jugar ▸",
    },
    revision: {
      title: "Repaso",
      tagline: "Solo saca cartas de tu colección. Dale la vuelta: ¿la sabías, o todavía no?",
      cta: "Repasar ▸",
    },
    constellation: { // TODO(i18n lot)
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
    },
    comingSoon: {
      title: "Muy pronto — un 3er juego",
      body: "Explora las expresiones en un mapa del mundo… o en constelaciones de emojis ✨",
    },
    daily: {
      title: "Expresiones del día",
      hint: "toca para descubrir",
    },
    collection: {
      teaser: "Mi colección",
      count: (n) => `${n} ${n === 1 ? "expresión" : "expresiones"}`,
      empty: "Todavía no hay favoritos — guarda tu primera carta jugando",
    },
    search: {
      invite: "Una palabra, una emoción, una idea…",
      title: "Buscar",
    },
    explore: {
      title: "Explora el mundo",
      atlas: "Atlas",
      concepts: "Conceptos",
      countries: "Países",
      proverbs: "Proverbios",
    },
  },
  it: {
    title: "A cosa giochiamo?",
    voyage: {
      title: "Viaggio",
      tagline: "10 carte da indovinare o sfogliare. Tieni quelle che ti piacciono ❤️",
      cta: "Gioca ▸",
    },
    revision: {
      title: "Ripasso",
      tagline: "Pesca solo dalla tua collezione. Gira la carta: la sapevi, o non ancora?",
      cta: "Ripassa ▸",
    },
    constellation: { // TODO(i18n lot)
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
    },
    comingSoon: {
      title: "Prossimamente — un 3° gioco",
      body: "Esplora le espressioni su una mappa del mondo… o in costellazioni di emoji ✨",
    },
    daily: {
      title: "Espressioni del giorno",
      hint: "tocca per scoprire",
    },
    collection: {
      teaser: "La mia collezione",
      count: (n) => `${n} ${n === 1 ? "espressione" : "espressioni"}`,
      empty: "Ancora nessun preferito — conserva la tua prima carta giocando",
    },
    search: {
      invite: "Una parola, un'emozione, un'idea…",
      title: "Cerca",
    },
    explore: {
      title: "Esplora il mondo",
      atlas: "Atlas",
      concepts: "Concetti",
      countries: "Paesi",
      proverbs: "Proverbi",
    },
  },
  tr: {
    title: "Ne oynayalım?",
    voyage: {
      title: "Yolculuk",
      tagline: "10 kart: tahmin et ya da kaydırıp geç. Beğendiklerini sakla ❤️",
      cta: "Oyna ▸",
    },
    revision: {
      title: "Tekrar",
      tagline: "Sadece senin koleksiyonundan çeker. Kartı çevir — biliyor muydun, yoksa henüz mü?",
      cta: "Tekrar et ▸",
    },
    constellation: { // TODO(i18n lot)
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
    },
    comingSoon: {
      title: "Yakında — 3. bir oyun",
      body: "Deyimleri bir dünya haritasında keşfet… ya da emoji takımyıldızlarında ✨",
    },
    daily: {
      title: "Günün deyimleri",
      hint: "keşfetmek için dokun",
    },
    collection: {
      teaser: "Koleksiyonum",
      count: (n) => `${n} deyim`,
      empty: "Henüz favori yok — oynarken ilk kartını sakla",
    },
    search: {
      invite: "Bir kelime, bir duygu, bir fikir…",
      title: "Ara",
    },
    explore: {
      title: "Dünyayı keşfet",
      atlas: "Atlas",
      concepts: "Kavramlar",
      countries: "Ülkeler",
      proverbs: "Atasözleri",
    },
  },
  de: {
    title: "Was spielen wir?",
    voyage: {
      title: "Reise",
      tagline: "10 Karten zum Raten oder Durchblättern. Behalte die, die dir gefallen ❤️",
      cta: "Spielen ▸",
    },
    revision: {
      title: "Wiederholung",
      tagline: "Zieht nur aus deiner Sammlung. Dreh die Karte um — wusstest du sie, oder noch nicht?",
      cta: "Wiederholen ▸",
    },
    constellation: { // TODO(i18n lot)
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
    },
    comingSoon: {
      title: "Bald — ein 3. Spiel",
      body: "Entdecke Ausdrücke auf einer Weltkarte… oder in Emoji-Konstellationen ✨",
    },
    daily: {
      title: "Ausdrücke des Tages",
      hint: "tippen zum Entdecken",
    },
    collection: {
      teaser: "Meine Sammlung",
      count: (n) => `${n} ${n === 1 ? "Ausdruck" : "Ausdrücke"}`,
      empty: "Noch keine Favoriten — behalte deine erste Karte beim Spielen",
    },
    search: {
      invite: "Ein Wort, ein Gefühl, eine Idee…",
      title: "Suchen",
    },
    explore: {
      title: "Die Welt erkunden",
      atlas: "Atlas",
      concepts: "Konzepte",
      countries: "Länder",
      proverbs: "Sprichwörter",
    },
  },
  ja: {
    title: "何して遊びましょう？",
    voyage: {
      title: "旅",
      tagline: "10枚のカードを当てたり、めくったり。気に入ったカードは残しましょう ❤️",
      cta: "遊ぶ ▸",
    },
    revision: {
      title: "復習",
      tagline: "あなたのコレクションからだけ出題。カードをめくって——覚えていましたか、まだですか？",
      cta: "復習する ▸",
    },
    constellation: { // TODO(i18n lot)
      title: "Constellation",
      tagline: "Tap a node, discover 2-3 proverbs from around the world. Keep the ones that speak to you ❤️",
      cta: "Explore ▸",
    },
    comingSoon: {
      title: "近日公開 — 3つ目のゲーム",
      body: "世界地図で表現を探検…あるいは絵文字の星座の中で ✨",
    },
    daily: {
      title: "今日の表現",
      hint: "タップして発見",
    },
    collection: {
      teaser: "マイコレクション",
      count: (n) => `${n}個の表現`,
      empty: "まだお気に入りはありません — 遊びながら最初のカードを残しましょう",
    },
    search: {
      invite: "ことば、気持ち、アイデア…",
      title: "検索",
    },
    explore: {
      title: "世界を探索",
      atlas: "アトラス",
      concepts: "概念",
      countries: "国",
      proverbs: "ことわざ",
    },
  },
};

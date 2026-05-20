export type Translation = {
  meaning: string;
  literal: string;
  idiomatic: string;
  origin?: string;
  example?: string;
};

// Hardcoded translations for prototype — 3 FR expressions × EN + TR.
// Validates layout before creating the content_translations table.
export const TRANSLATIONS: Record<string, Record<string, Translation>> = {
  "casser-les-pieds": {
    en: {
      meaning: "To annoy or bother someone persistently.",
      literal: "To break someone's feet",
      idiomatic: "To drive someone up the wall",
      origin:
        "Appeared in the 19th century. The feet, dragged along as the lowest part of the body, evoke a persistent annoyance — like a physical pain that is hard to ignore.",
      example:
        "Stop bugging me with your questions, I'm trying to concentrate.",
    },
    tr: {
      meaning: "Birini sürekli rahatsız etmek, canını sıkmak.",
      literal: "Ayakları kırmak",
      idiomatic: "Canını sıkmak",
      origin:
        "19. yüzyılda ortaya çıkmıştır. Vücudun en alt kısmı olan ayaklar, görmezden gelinmesi zor bir fiziksel ağrı gibi kalıcı bir rahatsızlığı çağrıştırır.",
      example:
        "Sorularınla canımı sıkmayı bırak, konsantre olmaya çalışıyorum.",
    },
  },
  "avoir-le-cafard": {
    en: {
      meaning: "To feel depressed or melancholic.",
      literal: "To have the cockroach",
      idiomatic: "To be down in the dumps",
      origin:
        "Popularized by Baudelaire in the 19th century. The cockroach, living in darkness and hidden corners, symbolizes dark thoughts that invade the mind.",
      example: "Since he left his job, he has really been down in the dumps.",
    },
    tr: {
      meaning: "Kendini üzgün ve karamsar hissetmek.",
      literal: "Hamamböceğine sahip olmak",
      idiomatic: "Morali bozulmak",
      origin:
        "19. yüzyılda Baudelaire tarafından popülerleştirilmiştir. Karanlıkta ve köşelerde yaşayan hamamböceği, zihni istila eden karanlık düşünceleri simgeler.",
      example: "İşinden ayrıldığından beri gerçekten morali çok bozuk.",
    },
  },
  "tomber-dans-les-pommes": {
    en: {
      meaning: "To faint, to lose consciousness.",
      literal: "To fall into the apples",
      idiomatic: "To pass out",
      origin:
        "Probably a corruption of 'tomber dans les pâmes' (pâmoison = fainting in Old French). 'Apples' (pommes) replaced 'pâmes' through popular phonetic corruption.",
      example:
        "It was so hot in the hall that one of the spectators passed out.",
    },
    tr: {
      meaning: "Bayılmak, bilincini kaybetmek.",
      literal: "Elmalara düşmek",
      idiomatic: "Bayılıp gitmek",
      origin:
        "Muhtemelen eski Fransızcada 'bayılma' anlamına gelen 'tomber dans les pâmes' ifadesinin bozulmuş halidir. 'Elmalar' (pommes), halk ağzındaki ses değişimiyle 'pâmes' kelimesinin yerini almıştır.",
      example: "Salonda o kadar sıcaktı ki bir seyirci bayıldı.",
    },
  },
};

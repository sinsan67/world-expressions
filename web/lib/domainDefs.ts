export type DomainDef = { emoji: string; labels: Record<string, string> };

export const DOMAIN_DEFS: Record<string, DomainDef> = {
  emotions:  { emoji: "💛", labels: { fr: "Émotions",        en: "Emotions",          es: "Emociones",        it: "Emozioni",        tr: "Duygular" } },
  relations: { emoji: "🤝", labels: { fr: "Relations",       en: "Relationships",     es: "Relaciones",       it: "Relazioni",       tr: "İlişkiler" } },
  money:     { emoji: "💰", labels: { fr: "Argent & pouvoir",en: "Money & power",     es: "Dinero & poder",   it: "Denaro & potere", tr: "Para & güç" } },
  wisdom:    { emoji: "🧠", labels: { fr: "Esprit & sagesse",en: "Mind & wisdom",     es: "Mente & sabiduría",it: "Mente & saggezza",tr: "Akıl & bilgelik" } },
  speech:    { emoji: "🗣️", labels: { fr: "Parole",          en: "Speech",            es: "Palabra",          it: "Parola",          tr: "Söz" } },
  morality:  { emoji: "⚖️", labels: { fr: "Morale & société",en: "Morality",          es: "Moral & sociedad", it: "Morale",          tr: "Ahlak" } },
  nature:    { emoji: "🌿", labels: { fr: "Nature & corps",  en: "Nature & body",     es: "Naturaleza",       it: "Natura & corpo",  tr: "Doğa & beden" } },
  time:      { emoji: "⏳", labels: { fr: "Temps & destin",  en: "Time & fate",       es: "Tiempo & destino", it: "Tempo & destino", tr: "Zaman & kader" } },
  work:      { emoji: "💪", labels: { fr: "Travail & effort",en: "Work & effort",     es: "Trabajo & esfuerzo",it: "Lavoro & sforzo",tr: "Çalışma" } },
  humor:     { emoji: "🎭", labels: { fr: "Humour & absurde",en: "Humor & absurdity", es: "Humor & absurdo",  it: "Umorismo",        tr: "Mizah" } },
  pleasure:  { emoji: "🍷", labels: { fr: "Plaisirs & excès",en: "Pleasures & excess",es: "Placeres",         it: "Piaceri",         tr: "Zevk" } },
  travel:    { emoji: "🌍", labels: { fr: "Voyage & exil",   en: "Travel & exile",    es: "Viaje & exilio",   it: "Viaggio",         tr: "Seyahat" } },
  luck:      { emoji: "🎲", labels: { fr: "Chance & risque", en: "Luck & risk",       es: "Suerte & riesgo",  it: "Fortuna",         tr: "Şans & risk" } },
  knowledge: { emoji: "📖", labels: { fr: "Savoir",          en: "Knowledge",         es: "Saber",            it: "Sapere",          tr: "Bilgi" } },
  justice:   { emoji: "⚔️", labels: { fr: "Justice & loi",   en: "Justice & law",     es: "Justicia & ley",   it: "Giustizia",       tr: "Adalet" } },
  conflict:  { emoji: "🔥", labels: { fr: "Conflit",         en: "Conflict",          es: "Conflicto",        it: "Conflitto",       tr: "Çatışma" } },
  ambition:  { emoji: "👑", labels: { fr: "Ambition",        en: "Ambition",          es: "Ambición",         it: "Ambizione",       tr: "Hırs" } },
  body:      { emoji: "🫀", labels: { fr: "Corps & santé",   en: "Body & health",     es: "Cuerpo & salud",   it: "Corpo & salute",  tr: "Beden & sağlık" } },
  change:    { emoji: "🌀", labels: { fr: "Changement",      en: "Change",            es: "Cambio",           it: "Cambiamento",     tr: "Değişim" } },
  food:      { emoji: "🍽️", labels: { fr: "Nourriture",      en: "Food",              es: "Comida",           it: "Cibo",            tr: "Yemek" } },
};

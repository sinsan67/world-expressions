// Static mapping: domain slug → canonical tag slugs (multi-domain allowed)
// Source of truth for the /emojis reference page.
// Tags can appear in multiple domains (Q3 decision, session 2026-06-08).
export const DOMAIN_TAGS: Record<string, string[]> = {
  emotions:  ["amour", "joie", "tristesse", "colère", "honte", "peur", "surprise", "ironie", "disappointment", "despair", "regret", "nostalgia", "hope", "optimism", "homesickness", "resignation"],
  relations: ["famille", "ami", "marriage", "loyalty", "trust", "betrayal", "unity", "support", "generosity", "hospitality"],
  money:     ["argent", "richesse", "pauvreté"],
  wisdom:    ["wisdom", "intelligence", "behavior", "advice", "experience"],
  speech:    ["communication", "mensonge", "lying", "secret", "silence", "criticism", "honesty", "slang", "cliché"],
  morality:  ["caractère", "responsibility", "truth", "respect", "humility", "foolishness", "mockery", "arrogance", "pride", "honor", "faith"],
  nature:    ["animal", "chien", "chat", "cheval", "oiseau", "loup", "renard", "feu", "eau", "mer", "pluie", "soleil", "neige", "vent", "arbre", "fleur", "météo", "village-life"],
  time:      ["temps", "age", "old-age", "youth", "patience", "tradition", "inevitability", "destiny", "fate"],
  work:      ["travail", "effort", "succès", "échec", "skill", "determination", "perseverance", "resilience", "difficulty"],
  humor:     ["humor", "ironie", "exaggeration", "maladresse", "mockery"],
  pleasure:  ["fête", "jeu", "sport", "vin", "bière", "café", "laziness", "freedom", "sommeil"],
  travel:    ["voyage", "partir", "maison", "escape", "movement", "culture"],
  luck:      ["chance", "risk", "danger", "misfortune", "opportunity", "fate", "caution"],
  knowledge: ["learning", "wisdom", "experience", "proverb", "adage", "saying", "maxim"],
  justice:   ["justice", "consequences", "politics", "acceptance", "honesty"],
  conflict:  ["conflit", "betrayal", "distrust", "hardship", "danger"],
  ambition:  ["ambition", "power", "energy", "courage", "determination", "succès"],
  body:      ["pied", "main", "tête", "oeil", "bouche", "nez", "bras", "corps", "santé", "mort", "fatigue", "appearance"],
  change:    ["change", "action", "speed", "resilience", "escape", "movement"],
  food:      ["nourriture", "pain", "vin", "bière", "café", "hospitality"],
};

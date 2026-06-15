// Sous-régions par pays (filtre de recherche imbriqué pays → région).
// Seule la France a des sous-régions en base pour l'instant (bretagne, alsace).
// Le rattachement région → pays n'existe pas côté backend ; on le porte ici côté front.

export const COUNTRY_SUBREGIONS: Record<string, string[]> = {
  fr: ["bretagne", "alsace"],
};

export const SUBREGION_LABELS: Record<string, string> = {
  bretagne: "🦀 Bretagne",
  alsace: "🥨 Alsace",
};

// Tous les codes de sous-région, pour distinguer un code région d'un code pays
// au moment de router le filtre vers le bon paramètre d'API (region vs country).
export const ALL_SUBREGION_CODES = new Set(Object.values(COUNTRY_SUBREGIONS).flat());

export function isSubregion(code: string): boolean {
  return ALL_SUBREGION_CODES.has(code);
}

// Sépare une liste de codes sélectionnés en { countries, regions }.
export function splitCountryRegion(codes: string[]): { countries: string[]; regions: string[] } {
  const countries: string[] = [];
  const regions: string[] = [];
  for (const c of codes) (isSubregion(c) ? regions : countries).push(c);
  return { countries, regions };
}

/**
 * Client API — toutes les fonctions qui appellent le backend FastAPI.
 * L'URL de base vient de la variable d'environnement NEXT_PUBLIC_API_URL.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ExpressionTranslation = {
  meaning: string | null;
  literal: string | null;
  idiomatic: string | null;
  origin: string | null;
  example: string | null;
};

export type ConceptEquivalent = {
  id: string;
  text: string;
  language: string;
  region: string;
  country: string;
  literal_fr: string | null;
  concept_confidence: number;
  meaning_fr: string | null;
};

export type Expression = {
  id: string;
  expression: string;
  meaning: string;
  origin: string;
  example: string;
  register: string;
  tags: string[];
  region: string;
  country: string;
  illustration: string | null;
  language: string;
  type: string;
  source: string | null;
  match_type: "exact" | "semantic" | "translation" | "concept" | "direct" | "tag";
  literal_fr: string | null;
  translation: ExpressionTranslation | null;
  concept_equivalents: ConceptEquivalent[];
};

export type SearchResponse = {
  query: string;
  countries: string[] | "all";
  total: number;
  offset: number;
  limit: number;
  exact: number;
  semantic: number;
  detected_concepts: string[];
  results: Expression[];
};

export type ConceptResponse = {
  concept_tags: string[];
  total: number;
  offset: number;
  limit: number;
  results: Expression[];
};

export async function searchExpressions(
  query: string,
  regions: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string,
  lang?: string,
  language?: string,
  countries?: string[]
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    offset: String(offset),
  });
  if (regions.length) params.set("region", regions.join(","));
  if (countries && countries.length) params.set("country", countries.join(","));
  if (typeFilter) params.set("type_filter", typeFilter);
  if (lang) params.set("locale", lang);
  if (language) params.set("language", language);
  const res = await fetch(`${API}/search?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function searchByConcept(
  tags: string[],
  regions: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string,
  lang?: string,
  language?: string,
  countries?: string[]
): Promise<ConceptResponse> {
  const params = new URLSearchParams({
    tags: tags.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  if (regions.length) params.set("region", regions.join(","));
  if (countries && countries.length) params.set("country", countries.join(","));
  if (typeFilter) params.set("type_filter", typeFilter);
  if (lang) params.set("locale", lang);
  if (language) params.set("language", language);
  const res = await fetch(`${API}/concept?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function searchByDomain(
  domain: string,
  regions: string[],
  limit = 20,
  offset = 0,
  lang?: string,
  typeFilter?: string,
  countries?: string[]
): Promise<ConceptResponse> {
  const params = new URLSearchParams({
    domain,
    limit: String(limit),
    offset: String(offset),
  });
  if (regions.length) params.set("region", regions.join(","));
  if (countries && countries.length) params.set("country", countries.join(","));
  if (lang) params.set("locale", lang);
  if (typeFilter) params.set("type_filter", typeFilter);
  const res = await fetch(`${API}/concept?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function browseByRegion(
  regions: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string,
  lang?: string,
  language?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  if (typeFilter) params.set("type_filter", typeFilter);
  if (lang) params.set("locale", lang);
  if (language) params.set("language", language);
  const res = await fetch(`${API}/browse?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// country → language fallback for backends that don't support country= yet
const COUNTRY_LANG_MAP: Record<string, string> = {
  fr: "fr", it: "it", tr: "tr", de: "de", jp: "ja",
  es: "es", ar: "es", mx: "es", co: "es", pe: "es", cu: "es", ve: "es", cl: "es",
  uk: "en", us: "en", au: "en", en: "en",
};

export async function browseByCountry(
  countries: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string,
  lang?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (countries.length) {
    params.set("country", countries.join(","));
    // Fallback for old backend: also send language= so it can filter correctly
    const langs = [...new Set(countries.map((c) => COUNTRY_LANG_MAP[c]).filter(Boolean))];
    if (langs.length) params.set("language", langs.join(","));
  }
  if (typeFilter) params.set("type_filter", typeFilter);
  if (lang) params.set("locale", lang);
  const res = await fetch(`${API}/browse?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export type TagInfo = { slug: string; count: number; name: string };

export async function getAllTagNames(locale = "en"): Promise<Record<string, string>> {
  const params = new URLSearchParams({ limit: "500", locale });
  const res = await fetch(`${API}/tags?${params}`);
  if (!res.ok) return {};
  const tags: TagInfo[] = await res.json();
  return Object.fromEntries(tags.map((t) => [t.slug, t.name]));
}

export async function getTopTags(language = "", limit = 30, locale = "en"): Promise<TagInfo[]> {
  const params = new URLSearchParams({ limit: String(limit), locale });
  if (language) params.set("language", language);
  const res = await fetch(`${API}/tags?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export type ConceptItem = { slug: string; name: string; count: number; domains: string[] };
export type ConceptsResponse = { domain_counts: Record<string, number>; domain_expr_counts: Record<string, number>; concepts: ConceptItem[] };

export async function getConcepts(
  locale = "en",
  lang = "",
  domain = "",
  minCount = 5,
  kind = "",
): Promise<ConceptsResponse> {
  const params = new URLSearchParams({ locale, min_count: String(minCount) });
  if (lang) params.set("lang", lang);
  if (domain) params.set("domain", domain);
  if (kind) params.set("kind", kind);
  const res = await fetch(`${API}/concepts?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getRandomExpression(locale = ""): Promise<Expression & { meaning_locale: string; literal: string | null }> {
  const params = locale ? `?locale=${locale}` : "";
  const res = await fetch(`${API}/random${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getExpression(id: string, lang = ""): Promise<Expression> {
  const params = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await fetch(`${API}/expression/${id}${params}`);
  if (!res.ok) throw new Error("Expression not found");
  return res.json();
}

export type RegionInfo = { code: string; count: number };

export async function getRegions(): Promise<RegionInfo[]> {
  const res = await fetch(`${API}/regions`);
  if (!res.ok) return [];
  return res.json();
}

// Fallback used when the backend doesn't have /countries yet (deploy lag)
const KNOWN_COUNTRIES: RegionInfo[] = [
  { code: "tr", count: 2551 }, { code: "it", count: 2438 }, { code: "fr", count: 2249 },
  { code: "es", count: 1484 }, { code: "de", count: 1424 }, { code: "en", count: 1259 },
  { code: "jp", count: 1139 }, { code: "mx", count: 379 }, { code: "pe", count: 348 },
  { code: "ar", count: 347 }, { code: "co", count: 340 }, { code: "us", count: 300 },
  { code: "uk", count: 100 }, { code: "au", count: 99 },
];

export async function getCountries(): Promise<RegionInfo[]> {
  try {
    const res = await fetch(`${API}/countries`);
    if (!res.ok) return KNOWN_COUNTRIES;
    return res.json();
  } catch {
    return KNOWN_COUNTRIES;
  }
}

export type TypeCounts = {
  idiom: number;
  proverb: number;
  locution: number;
  word: number;
};

export async function getTypeCounts(
  regions: string[] = [],
  tags: string[] = [],
  query = "",
  language?: string,
  countries?: string[]
): Promise<TypeCounts> {
  const params = new URLSearchParams();
  if (regions.length) params.set("region", regions.join(","));
  if (countries && countries.length) params.set("country", countries.join(","));
  if (tags.length) params.set("tag", tags.join(","));
  if (query) params.set("q", query);
  if (language) params.set("language", language);
  const res = await fetch(`${API}/type-counts?${params}`);
  if (!res.ok) return { idiom: 0, proverb: 0, locution: 0, word: 0 };
  return res.json();
}

export type Facets = {
  region: Record<string, number>;
  kind: Record<string, number>;
};

export async function getFacets(
  countries: string[] = [],
  query = "",
  typeFilter: string | null = null,
): Promise<Facets> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (countries.length) params.set("country", countries.join(","));
  if (typeFilter) params.set("type_filter", typeFilter);
  const res = await fetch(`${API}/facets?${params}`);
  if (!res.ok) return { region: {}, kind: {} };
  return res.json();
}

export async function updateUserName(userId: string, name: string): Promise<{ name: string | null }> {
  const res = await fetch(`${API}/users/${userId}/name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to update name");
  return res.json();
}

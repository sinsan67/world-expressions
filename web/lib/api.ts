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
  illustration: string | null;
  language: string;
  type: string;
  source: string | null;
  match_type: "exact" | "semantic" | "tag" | "direct";
  translation: ExpressionTranslation | null;
  concept_equivalents: ConceptEquivalent[];
};

export type SearchResponse = {
  query: string;
  regions: string[] | "all";
  total: number;
  offset: number;
  limit: number;
  exact: number;
  semantic: number;
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
  lang?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  if (typeFilter) params.set("type_filter", typeFilter);
  if (lang) params.set("locale", lang);
  const res = await fetch(`${API}/search?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function searchByConcept(
  tags: string[],
  regions: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string
): Promise<ConceptResponse> {
  const params = new URLSearchParams({
    tags: tags.join(","),
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  if (typeFilter) params.set("type_filter", typeFilter);
  const res = await fetch(`${API}/concept?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function browseByRegion(
  regions: string[],
  limit = 20,
  offset = 0,
  typeFilter?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  if (typeFilter) params.set("type_filter", typeFilter);
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

export type TypeCounts = {
  idiom: number;
  proverb: number;
  locution: number;
  word: number;
};

export async function getTypeCounts(
  regions: string[] = [],
  tags: string[] = [],
  query = ""
): Promise<TypeCounts> {
  const params = new URLSearchParams();
  if (regions.length) params.set("region", regions.join(","));
  if (tags.length) params.set("tag", tags.join(","));
  if (query) params.set("q", query);
  const res = await fetch(`${API}/type-counts?${params}`);
  if (!res.ok) return { idiom: 0, proverb: 0, locution: 0, word: 0 };
  return res.json();
}

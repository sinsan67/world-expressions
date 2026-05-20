/**
 * Client API — toutes les fonctions qui appellent le backend FastAPI.
 * L'URL de base vient de la variable d'environnement NEXT_PUBLIC_API_URL.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  type: "expression" | "word";
  match_type: "exact" | "semantic" | "tag" | "direct";
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
  offset = 0
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${API}/search?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function searchByConcept(
  tags: string[],
  regions: string[],
  limit = 20,
  offset = 0
): Promise<ConceptResponse> {
  const params = new URLSearchParams({
    tags: tags.join(","),
    region: regions.join(","),
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${API}/concept?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export type TagInfo = { slug: string; count: number };

export async function getTopTags(language = "", limit = 30): Promise<TagInfo[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (language) params.set("language", language);
  const res = await fetch(`${API}/tags?${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getRandomExpression(locale = ""): Promise<Expression & { meaning_locale: string }> {
  const params = locale ? `?locale=${locale}` : "";
  const res = await fetch(`${API}/random${params}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getExpression(id: string): Promise<Expression> {
  const res = await fetch(`${API}/expression/${id}`);
  if (!res.ok) throw new Error("Expression not found");
  return res.json();
}

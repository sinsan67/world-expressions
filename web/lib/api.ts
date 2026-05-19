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
  match_type: "exact" | "semantic" | "tag" | "direct";
};

export type SearchResponse = {
  query: string;
  regions: string[] | "all";
  total: number;
  exact: number;
  semantic: number;
  results: Expression[];
};

export type ConceptResponse = {
  concept_tags: string[];
  total: number;
  results: Expression[];
};

export async function searchExpressions(
  query: string,
  regions: string[]
): Promise<SearchResponse> {
  const regionParam = regions.join(",");
  const res = await fetch(
    `${API}/search?q=${encodeURIComponent(query)}&region=${regionParam}`
  );
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function searchByConcept(
  tags: string[],
  regions: string[]
): Promise<ConceptResponse> {
  const regionParam = regions.join(",");
  const res = await fetch(
    `${API}/concept?tags=${encodeURIComponent(tags.join(","))}&region=${regionParam}`
  );
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getExpression(id: string): Promise<Expression> {
  const res = await fetch(`${API}/expression/${id}`);
  if (!res.ok) throw new Error("Expression not found");
  return res.json();
}

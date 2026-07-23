import type { VoyageFilters } from "@/components/voyage/VoyageSetup";

/**
 * Recap → exploration bridge (lot N2, atelier S208 décision 2, borrowed
 * from mockup-nav-globale-B): maps the filters of the game that just ended
 * to the exploration page that best matches them, so "Explore these
 * expressions" lands somewhere coherent with what the player just saw.
 *
 * Priority mirrors filter specificity: a domain is narrower than a kind,
 * a kind page exists for proverb/locution only, a bare country goes to its
 * country page (whose default tab is idioms — also the right landing for
 * kind=idiom). Quick games and empty filters fall back to the Atlas.
 */
export function buildExploreHref(filters: VoyageFilters, wasQuick: boolean): string {
  if (!wasQuick) {
    if (filters.domain) {
      const params = new URLSearchParams({ domain: filters.domain });
      if (filters.country) params.set("country", filters.country);
      return `/search?${params.toString()}`;
    }
    if (filters.kind === "proverb" || filters.kind === "locution") {
      return `/type/${filters.kind}${filters.country ? `?country=${filters.country}` : ""}`;
    }
    if (filters.country) return `/country/${filters.country}`;
  }
  return "/atlas";
}

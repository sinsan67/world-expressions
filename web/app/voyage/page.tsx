import Voyage from "./Voyage";
import type { VoyageFilters } from "@/components/voyage/VoyageSetup";

/**
 * Server Component entry — reads `?quick=1` at the params/searchParams
 * boundary and hands it down as a plain prop, so the client component never
 * has to touch useSearchParams()/Suspense at all (Next 16: `searchParams` on
 * a Server Component page is a Promise, awaited directly — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md).
 *
 * Lot N2: also reads `?country=`, `?kind=` and `?domain=` the same way — the
 * exploration pages' "Play with these cards" CTA links here with the page's
 * context pre-filled (atelier S208, décision 2). The filters land on the
 * setup screen (composer pre-filled), they do not auto-start a game.
 */
export default async function VoyagePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const quick = params.quick === "1";
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const initialFilters: VoyageFilters = {
    country: str(params.country),
    kind: str(params.kind),
    domain: str(params.domain),
  };
  const hasInitial = !!(initialFilters.country || initialFilters.kind || initialFilters.domain);
  return <Voyage quick={quick} initialFilters={hasInitial ? initialFilters : undefined} />;
}

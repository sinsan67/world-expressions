import Voyage from "./Voyage";

/**
 * Server Component entry — reads `?quick=1` at the params/searchParams
 * boundary and hands it down as a plain prop, so the client component never
 * has to touch useSearchParams()/Suspense at all (Next 16: `searchParams` on
 * a Server Component page is a Promise, awaited directly — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md).
 */
export default async function VoyagePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const quick = params.quick === "1";
  return <Voyage quick={quick} />;
}

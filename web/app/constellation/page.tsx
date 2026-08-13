import Constellation from "./Constellation";

/**
 * Server Component entry — mirrors web/app/voyage/page.tsx (that file's own
 * comment marks the split as the newer/preferred pattern in this codebase
 * vs. older routes that are "use client" all the way down): `searchParams`
 * on a Server Component page is a Promise on this Next version, awaited
 * directly, so the client component below never has to touch
 * useSearchParams()/Suspense at all.
 *
 * Reads `?tag=` (S240, addendum §7.3) — the card-to-node link from
 * `/constellation/browse` navigates here as `/constellation?tag=X`, and
 * `initialTag` is how Constellation.tsx knows to open that node's overlay
 * and center the camera on it as soon as the graph has loaded.
 */
export default async function ConstellationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  return <Constellation initialTag={tag} />;
}

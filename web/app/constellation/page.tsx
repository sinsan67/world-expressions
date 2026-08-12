import Constellation from "./Constellation";

/**
 * Server Component entry — thin wrapper, mirrors web/app/voyage/page.tsx
 * (that file's own comment marks the split as the newer/preferred pattern in
 * this codebase vs. older routes that are "use client" all the way down).
 * No query params needed yet, but the shape leaves room for a future
 * `?tag=` deep link (contract game3-constellation-lot0 — not required now).
 */
export default async function ConstellationPage() {
  return <Constellation />;
}

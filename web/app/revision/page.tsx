import Revision from "./Revision";

/**
 * Server Component entry — thin wrapper, mirrors web/app/voyage/page.tsx.
 * No query params needed: unlike Voyage, Révision never has a setup screen
 * (decision #1, pivot-lot0-contract §5) — it always goes straight from the
 * hub card into the mixed-language queue.
 */
export default async function RevisionPage() {
  return <Revision />;
}

/**
 * Révision (/revision, lot D of the games-hub pivot — docs/pivot-lot0-
 * contract.md §2/§5) — pure classification + queue-building helpers, shared
 * by the hub (chip counts) and the /revision page (the actual play queue).
 * No React, no fetch — keeps the "to review / new / known" rule in one place.
 *
 * v1 semantics (contract §2, "user_favorites — new columns"):
 * - to review: `reviewedAt !== null && reviewBox === 0` (answered "not yet")
 * - fresh/new: `reviewedAt === null` (never reviewed)
 * - known:     `reviewBox >= 1` (answered "knew")
 */

export type FavoriteReviewState = {
  expressionId: string;
  reviewBox: number;
  reviewedAt: string | null;
};

// Below this many favorites, /revision shows the "locked" state instead of
// a too-short session (decision #2, S205 plan).
export const REVISION_LOCK_THRESHOLD = 5;

export function classifyFavorites(favs: FavoriteReviewState[]): {
  toReview: string[];
  fresh: string[];
  known: string[];
} {
  const toReview: string[] = [];
  const fresh: string[] = [];
  const known: string[] = [];
  for (const f of favs) {
    if (f.reviewedAt !== null && f.reviewBox === 0) {
      toReview.push(f.expressionId);
    } else if (f.reviewedAt === null) {
      fresh.push(f.expressionId);
    } else {
      known.push(f.expressionId);
    }
  }
  return { toReview, fresh, known };
}

// Draw order (contract §2): to review → new → known, capped to `limit`.
export function buildRevisionQueue(favs: FavoriteReviewState[], limit = 10): string[] {
  const { toReview, fresh, known } = classifyFavorites(favs);
  return [...toReview, ...fresh, ...known].slice(0, limit);
}

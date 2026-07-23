"use client";

/**
 * Syncs an in-component "screen" (or sheet) selection with a single query
 * param via the raw History API — never `useRouter().push()`/`replace()`,
 * which in the app router re-renders/refetches the server component route
 * segment. Pattern lifted from `app/emoji/page.tsx`'s `openDomain`/
 * `closeDomain` (pushState/replaceState + a popstate listener).
 *
 * Lets the Android/browser back button step through in-app screens instead
 * of leaving the page — `back()` and a real back-button press both funnel
 * through the same `popstate` → `onPop` path, so they stay behaviorally
 * identical by construction.
 */

import { useCallback, useEffect } from "react";

export function useScreenHistory(
  paramName: string,
  onPop: (value: string | null) => void,
) {
  useEffect(() => {
    const handlePopState = () => {
      const value = new URLSearchParams(window.location.search).get(paramName);
      onPop(value);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramName]);

  // Preserves any other query params already on the URL — two instances of
  // this hook (e.g. `screen` here, `sheet` in a future lot) must not stomp
  // on each other's param when building the next URL.
  const buildUrl = useCallback((value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null) params.delete(paramName);
    else params.set(paramName, value);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
  }, [paramName]);

  const push = useCallback((value: string) => {
    window.history.pushState({}, "", buildUrl(value));
  }, [buildUrl]);

  const replace = useCallback((value: string | null) => {
    window.history.replaceState({}, "", buildUrl(value));
  }, [buildUrl]);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  return { push, replace, back };
}

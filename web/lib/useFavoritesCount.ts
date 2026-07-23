"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getCarnet } from "@/lib/carnet";
import { getUserFavorites } from "@/lib/api";

// Shared by Sidebar and BottomNav's Collection nav item badge, and
// CarnetHeartLink/CollectionStrip's badges — single source of truth for the
// live favorites count. For a logged-in user the local carnet only mirrors
// the server truth once per (account, device) — see AuthGate's one-time
// sync — so anything relying on it alone goes stale as soon as a favorite
// is added elsewhere. This queries the server fresh for logged-in users
// (same pattern as Collection.tsx) and refreshes on every
// `wex-carnet-updated` (covers a same-device toggle, see useFavorite.ts).

// Module-scope: avoids duplicate simultaneous /users/{id}/favorites calls
// when several badges (header, sidebar, bottom nav, hub strip) mount on the
// same page. `fresh=true` bypasses it to reflect a favorite just
// added/removed on this device.
let cachedUserId: string | null = null;
let cachedPromise: Promise<number> | null = null;

function fetchServerCount(userId: string, fresh: boolean): Promise<number> {
  if (!fresh && cachedUserId === userId && cachedPromise) return cachedPromise;
  cachedUserId = userId;
  cachedPromise = getUserFavorites(userId).then((favs) => favs.length).catch(() => 0);
  return cachedPromise;
}

export function useFavoritesCount(): number | undefined {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [count, setCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    function refresh(fresh: boolean) {
      if (status === "authenticated" && userId) {
        fetchServerCount(userId, fresh).then((n) => { if (!cancelled) setCount(n); });
      } else {
        setCount(getCarnet().favorites.length);
      }
    }

    refresh(false);
    const onUpdate = () => refresh(true);
    window.addEventListener("wex-carnet-updated", onUpdate);
    return () => { cancelled = true; window.removeEventListener("wex-carnet-updated", onUpdate); };
  }, [status, userId]);

  return count;
}

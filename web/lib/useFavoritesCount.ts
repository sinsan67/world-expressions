"use client";

import { useEffect, useState } from "react";
import { getCarnet } from "@/lib/carnet";

// Shared by Sidebar and BottomNav's Collection nav item badge, and
// CarnetHeartLink's header badge — single source of truth for the
// live favorites count, updated on every `wex-carnet-updated` event.
export function useFavoritesCount(): number | undefined {
  const [count, setCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      const n = getCarnet().favorites.length;
      setCount(n > 0 ? n : undefined);
    };
    update();
    window.addEventListener("wex-carnet-updated", update);
    return () => window.removeEventListener("wex-carnet-updated", update);
  }, []);

  return count;
}

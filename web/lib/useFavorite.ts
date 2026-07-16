"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toggleFavorite, isFavorite } from "./carnet";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useFavorite(expressionId: string): [boolean, (ev?: React.MouseEvent) => void] {
  const { data: session } = useSession();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(expressionId));
  }, [expressionId]);

  function handleFav(ev?: React.MouseEvent) {
    ev?.stopPropagation();
    toggleFavorite(expressionId);
    setFav((v) => !v);
    const userId = session?.user?.id;
    if (userId) {
      // keepalive: same optimistic-update-then-navigate-away pattern as
      // updateUserPreferences — without it, a quick navigation right after
      // tapping the heart can abort the request before it reaches the server.
      fetch(`${API_URL}/users/${userId}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression_id: expressionId }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  return [fav, handleFav];
}

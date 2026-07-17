/**
 * Persistence for the Voyage game (`app/voyage/Voyage.tsx`) — two separate
 * storages, deliberately not shared with `carnet.ts` (permanent user data):
 *
 * - sessionStorage: the in-progress game (session/cardIndex/keptIds) so an
 *   Android WebView process kill-and-resume doesn't lose the round. Ephemeral
 *   by design — cleared once the player returns to setup.
 * - localStorage: the last-used filters, kept across sessions as the socket
 *   for a future "replay last configuration" preset (Lot S) — nothing reads
 *   this yet, only `saveLastFilters` is wired up in this lot.
 *
 * Versioned + defensive read/write, same style as `carnet.ts`.
 */

import type { GameSession } from "@/lib/api";
import type { VoyageFilters } from "@/components/voyage/VoyageSetup";

const SESSION_KEY = "wex_voyage_session";
const FILTERS_KEY = "wex_voyage_last_filters";

type PersistedVoyageSession = {
  version: 1;
  phase: "play" | "recap";
  session: GameSession;
  cardIndex: number;
  keptIds: string[];
  lastFilters: VoyageFilters;
  lastQuick: boolean;
};

export function saveVoyageSession(data: Omit<PersistedVoyageSession, "version">): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ version: 1, ...data }));
  } catch {
    // sessionStorage full/unavailable (private browsing) — non-fatal, the
    // game just won't survive a process kill this time.
  }
}

export function loadVoyageSession(): PersistedVoyageSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed.session?.cards?.length) return null;
    return parsed as PersistedVoyageSession;
  } catch {
    return null;
  }
}

export function clearVoyageSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveLastFilters(filters: VoyageFilters): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

export function getLastFilters(): VoyageFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? (JSON.parse(raw) as VoyageFilters) : null;
  } catch {
    return null;
  }
}

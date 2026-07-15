const STORAGE_KEY = "wex_carnet";

export type LanguageMode = "discovery" | "mastered";

type Carnet = {
  version: 2;
  // Anonymous device id — generated once, lazily backfilled for carnets
  // created before this field existed. Feeds game_sessions.client_id
  // (pivot-lot0-contract §2/§5) and, later, expression_reports.client_id.
  clientId?: string;
  user: {
    pseudo: string | null;
    createdAt: string;
    syncedAccountId: string | null;
    bannerDismissed?: boolean;
  };
  favorites: Array<{
    expressionId: string;
    savedAt: string;
    // Mirrors of the server user_favorites columns (pivot-lot0-contract §2,
    // v2 migration). Kept in sync with the server on login (AuthGate);
    // authoritative locally for anonymous users.
    reviewBox: number;
    reviewedAt: string | null;
    sessionId: string | null;
  }>;
  // Each entry also carries region + language for stats computation
  history: Array<{
    expressionId: string;
    region: string;
    language: string;
    viewedAt: string;
  }>;
  notes: Array<{
    expressionId: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  stats: {
    streakDays: number;
    lastActiveDate: string; // ISO date "YYYY-MM-DD"
  };
  // Mirror of users.language_modes (pivot-lot0-contract §2) — 🧳 discovery /
  // 📚 mastered per language, keyed by language code (e.g. "it", "tr").
  languageModes: Record<string, LanguageMode>;
};

export type ComputedStats = {
  totalSeen: number;
  favoritesCount: number;
  countriesExplored: number;
  topLang: string | null;
  streakDays: number;
};

export type CountryProgress = {
  region: string;
  seen: number;
};

const DEFAULT: Carnet = {
  version: 2,
  user: {
    pseudo: null,
    createdAt: new Date().toISOString(),
    syncedAccountId: null,
  },
  favorites: [],
  history: [],
  notes: [],
  stats: {
    streakDays: 0,
    lastActiveDate: "",
  },
  languageModes: {},
};

/**
 * Migrates a raw parsed localStorage payload to the current v2 shape.
 * v1 carnets (or unversioned, pre-dating the `version` field) get
 * `favorites[*].reviewBox/reviewedAt/sessionId` defaulted and a top-level
 * `languageModes: {}` added, per pivot-lot0-contract §2's "local carnet
 * v1→2 migration" note. Idempotent — already-v2 carnets are passed through
 * (defensively re-defaulting any missing field, e.g. hand-edited storage).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(raw: any): Carnet {
  const favorites = Array.isArray(raw.favorites)
    ? raw.favorites.map((f: { expressionId: string; savedAt: string; reviewBox?: number; reviewedAt?: string | null; sessionId?: string | null }) => ({
        expressionId: f.expressionId,
        savedAt: f.savedAt,
        reviewBox: f.reviewBox ?? 0,
        reviewedAt: f.reviewedAt ?? null,
        sessionId: f.sessionId ?? null,
      }))
    : [];
  return {
    ...structuredClone(DEFAULT),
    ...raw,
    version: 2,
    favorites,
    languageModes: raw.languageModes && typeof raw.languageModes === "object" ? raw.languageModes : {},
  };
}

export function getCarnet(): Carnet {
  if (typeof window === "undefined") return structuredClone(DEFAULT);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    raw = stored ? JSON.parse(stored) : null;
  } catch {
    raw = null;
  }
  let c: Carnet;
  if (raw) {
    const needsMigration = (raw.version ?? 1) < 2;
    c = migrate(raw);
    if (needsMigration) saveCarnet(c);
  } else {
    c = structuredClone(DEFAULT);
  }
  // Lazy backfill: carnets created before clientId existed get one generated
  // now, persisted immediately so it's stable across reads.
  if (!c.clientId) {
    c.clientId = crypto.randomUUID();
    saveCarnet(c);
  }
  return c;
}

function saveCarnet(c: Carnet): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function toggleFavorite(expressionId: string): void {
  const c = getCarnet();
  const idx = c.favorites.findIndex((f) => f.expressionId === expressionId);
  if (idx !== -1) {
    c.favorites.splice(idx, 1);
  } else {
    c.favorites.push({
      expressionId,
      savedAt: new Date().toISOString(),
      reviewBox: 0,
      reviewedAt: null,
      sessionId: null,
    });
  }
  saveCarnet(c);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wex-carnet-updated"));
  }
}

export function isFavorite(expressionId: string): boolean {
  return getCarnet().favorites.some((f) => f.expressionId === expressionId);
}

// Local-only language mode setter (anonymous users) — the collection page
// (Lot C) mirrors this to the server via PUT /users/{id}/preferences when
// the visitor is logged in; this function only ever touches localStorage.
export function setLanguageMode(language: string, mode: LanguageMode): void {
  const c = getCarnet();
  c.languageModes[language] = mode;
  saveCarnet(c);
}

export function getLanguageModes(): Record<string, LanguageMode> {
  return getCarnet().languageModes;
}

function updateStreak(c: Carnet): void {
  const today = new Date().toISOString().slice(0, 10);
  if (c.stats.lastActiveDate === today) return;

  if (c.stats.lastActiveDate) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    c.stats.streakDays = c.stats.lastActiveDate === yesterday
      ? c.stats.streakDays + 1
      : 1;
  } else {
    c.stats.streakDays = 1;
  }
  c.stats.lastActiveDate = today;
}

export function recordView(expressionId: string, region: string, language: string): void {
  const c = getCarnet();
  updateStreak(c);
  // Move to most-recent position, deduplicated
  c.history = c.history.filter((h) => h.expressionId !== expressionId);
  c.history.unshift({ expressionId, region, language, viewedAt: new Date().toISOString() });
  if (c.history.length > 50) c.history = c.history.slice(0, 50);
  saveCarnet(c);
}

export function setNote(expressionId: string, text: string): void {
  const c = getCarnet();
  const idx = c.notes.findIndex((n) => n.expressionId === expressionId);
  if (text.trim() === "") {
    if (idx !== -1) c.notes.splice(idx, 1);
  } else if (idx !== -1) {
    c.notes[idx].text = text;
    c.notes[idx].updatedAt = new Date().toISOString();
  } else {
    const now = new Date().toISOString();
    c.notes.push({ expressionId, text, createdAt: now, updatedAt: now });
  }
  saveCarnet(c);
}

export function getStats(): ComputedStats {
  const c = getCarnet();
  const langCounts: Record<string, number> = {};
  for (const h of c.history) {
    langCounts[h.language] = (langCounts[h.language] ?? 0) + 1;
  }
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    totalSeen: c.history.length,
    favoritesCount: c.favorites.length,
    countriesExplored: new Set(c.history.map((h) => h.region)).size,
    topLang,
    streakDays: c.stats.streakDays,
  };
}

export function getProgressByCountry(): CountryProgress[] {
  const c = getCarnet();
  const counts: Record<string, number> = {};
  for (const h of c.history) {
    counts[h.region] = (counts[h.region] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([region, seen]) => ({ region, seen }))
    .sort((a, b) => b.seen - a.seen);
}

export function markSynced(accountId: string): void {
  const c = getCarnet();
  c.user.syncedAccountId = accountId;
  saveCarnet(c);
}

export function dismissBanner(): void {
  const c = getCarnet();
  c.user.bannerDismissed = true;
  saveCarnet(c);
}

export function isBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  // Migrate from old key
  if (localStorage.getItem("wex_banner_dismissed")) return true;
  return getCarnet().user.bannerDismissed === true;
}

export function exportJSON(): Blob {
  return new Blob([JSON.stringify(getCarnet(), null, 2)], { type: "application/json" });
}

export function exportCSV(): Blob {
  const c = getCarnet();
  const rows: string[][] = [
    ["type", "expressionId", "date"],
    ...c.favorites.map((f) => ["favorite", f.expressionId, f.savedAt]),
    ...c.history.map((h) => ["view", h.expressionId, h.viewedAt]),
    ...c.notes.map((n) => ["note", n.expressionId, n.updatedAt]),
  ];
  return new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
}

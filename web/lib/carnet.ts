const STORAGE_KEY = "wex_carnet";

type Carnet = {
  version: 1;
  user: {
    pseudo: string | null;
    createdAt: string;
    syncedAccountId: string | null;
    bannerDismissed?: boolean;
  };
  favorites: Array<{
    expressionId: string;
    savedAt: string;
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
  version: 1,
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
};

export function getCarnet(): Carnet {
  if (typeof window === "undefined") return structuredClone(DEFAULT);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT);
    return JSON.parse(raw) as Carnet;
  } catch {
    return structuredClone(DEFAULT);
  }
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
    c.favorites.push({ expressionId, savedAt: new Date().toISOString() });
  }
  saveCarnet(c);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wex-carnet-updated"));
  }
}

export function isFavorite(expressionId: string): boolean {
  return getCarnet().favorites.some((f) => f.expressionId === expressionId);
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

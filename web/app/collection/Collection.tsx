"use client";

/**
 * Ma collection (/collection, lot C of the games-hub pivot —
 * docs/pivot-lot0-contract.md §1/§5, mockup docs/mockups/pivot-carnet.html
 * "Écran 1" only — the "retravail"/study view is Écran 2, out of scope,
 * see the lot brief). Works for BOTH anonymous and logged-in visitors,
 * unlike its predecessor /profile#carnet (login-gated) — CarnetTab.tsx and
 * the /profile "Favoris" tab are untouched, this is a new, separate page.
 *
 * Anonymous: favorites come from the local carnet (localStorage). Logged-in:
 * favorites come from the server (authoritative — no merge with local, same
 * precedent as CarnetTab). Either way, rows are hydrated in one batched call
 * via GET /browse?ids= (browseByIds).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  browseByIds,
  getUserFavorites,
  getUserPreferences,
  updateUserPreferences,
  getRandomCount,
  getAllTagNames,
  Expression,
  UserPreferences,
} from "@/lib/api";
import { getCarnet, setLanguageMode, LanguageMode } from "@/lib/carnet";
import { useUILangContext } from "@/lib/UILangContext";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LanguageSection, { CollectionItem } from "@/components/collection/LanguageSection";
import CollectionToolbar, { ThemeOption, SortOption } from "@/components/collection/CollectionToolbar";
import EmptyCollection from "@/components/collection/EmptyCollection";

type RawFavorite = {
  expressionId: string;
  savedAt: string;
  reviewBox: number;
  reviewedAt: string | null;
};

export default function Collection() {
  const { uiLang } = useUILangContext();
  const { data: authSession, status } = useSession();
  const userId = authSession?.user?.id;
  const t = COLLECTION_LABELS[uiLang] ?? COLLECTION_LABELS.en;

  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [rawFavorites, setRawFavorites] = useState<RawFavorite[]>([]);
  const [expressionsMap, setExpressionsMap] = useState<Record<string, Expression>>({});
  const [languageModes, setLanguageModesState] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [setCounts, setSetCounts] = useState<Record<string, number | null>>({});

  const [query, setQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");

  // ── Load favorites (anon: local carnet · logged-in: server, authoritative) ──
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && userId) {
      getUserFavorites(userId)
        .then((favs) => {
          setRawFavorites(favs.map((f) => ({
            expressionId: f.expression_id,
            savedAt: f.saved_at,
            reviewBox: f.review_box,
            reviewedAt: f.reviewed_at,
          })));
        })
        .catch(() => setRawFavorites([]))
        .finally(() => setPhase("ready"));
    } else {
      const c = getCarnet();
      setRawFavorites(c.favorites.map((f) => ({
        expressionId: f.expressionId,
        savedAt: f.savedAt,
        reviewBox: f.reviewBox,
        reviewedAt: f.reviewedAt,
      })));
      setPhase("ready");
    }
  }, [status, userId]);

  // ── Load language modes: server preferences (logged-in, source of truth
  // while authenticated) or local carnet mirror (anon) ──
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && userId) {
      getUserPreferences(userId).then((p) => {
        if (p) {
          setPrefs(p);
          setLanguageModesState(p.language_modes ?? {});
        }
      }).catch(() => {});
    } else {
      setPrefs(null);
      setLanguageModesState(getCarnet().languageModes);
    }
  }, [status, userId]);

  // ── Hydrate expressions in one batched call, localized to uiLang ──
  useEffect(() => {
    const ids = Array.from(new Set(rawFavorites.map((f) => f.expressionId)));
    if (ids.length === 0) {
      setExpressionsMap({});
      return;
    }
    let cancelled = false;
    browseByIds(ids, uiLang)
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, Expression> = {};
        for (const expr of res.results) map[expr.id] = expr;
        setExpressionsMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rawFavorites, uiLang]);

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames).catch(() => {});
  }, [uiLang]);

  // ── Items: raw favorites joined with hydrated expressions ──
  const items: CollectionItem[] = useMemo(() => {
    const out: CollectionItem[] = [];
    for (const f of rawFavorites) {
      const expr = expressionsMap[f.expressionId];
      if (!expr) continue;
      out.push({ expression: expr, savedAt: f.savedAt, reviewBox: f.reviewBox, reviewedAt: f.reviewedAt });
    }
    return out;
  }, [rawFavorites, expressionsMap]);

  const byLanguageAll = useMemo(() => {
    const groups: Record<string, CollectionItem[]> = {};
    for (const it of items) {
      (groups[it.expression.language] ??= []).push(it);
    }
    return groups;
  }, [items]);

  const languages = useMemo(
    () => Object.keys(byLanguageAll).sort((a, b) => byLanguageAll[b].length - byLanguageAll[a].length),
    [byLanguageAll]
  );

  // ── Set counter per language section: batched, one call per visible language ──
  const languagesKey = languages.join(",");
  useEffect(() => {
    if (!languagesKey) return;
    const langs = languagesKey.split(",");
    let cancelled = false;
    Promise.all(
      langs.map((lang) =>
        getRandomCount("", "", "", lang).then((count) => [lang, count] as const).catch(() => [lang, null] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      setSetCounts((prev) => {
        const next = { ...prev };
        for (const [lang, count] of results) next[lang] = count;
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [languagesKey]);

  const themes: ThemeOption[] = useMemo(() => {
    const slugs = new Set<string>();
    for (const it of items) for (const tag of it.expression.tags) slugs.add(tag);
    return Array.from(slugs)
      .map((slug) => ({ slug, name: tagNames[slug] ?? slug }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, tagNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter && it.expression.type !== typeFilter) return false;
      if (themeFilter && !it.expression.tags.includes(themeFilter)) return false;
      if (q) {
        const haystack = [
          it.expression.expression,
          it.expression.meaning,
          it.expression.literal ?? "",
          it.expression.literal_fr ?? "",
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, typeFilter, themeFilter]);

  const byLanguageFiltered = useMemo(() => {
    const groups: Record<string, CollectionItem[]> = {};
    for (const it of filtered) {
      (groups[it.expression.language] ??= []).push(it);
    }
    for (const lang of Object.keys(groups)) {
      groups[lang] = [...groups[lang]].sort((a, b) =>
        sortBy === "name"
          ? a.expression.expression.localeCompare(b.expression.expression)
          : new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
    }
    return groups;
  }, [filtered, sortBy]);

  const resolveMode = useCallback((language: string): LanguageMode | null => {
    const m = languageModes[language];
    if (m === "discovery" || m === "mastered") return m;
    // Contract default: UI language = mastered, others asked at first favorite.
    if (language === uiLang) return "mastered";
    return null;
  }, [languageModes, uiLang]);

  const handleSetMode = useCallback((language: string, mode: LanguageMode) => {
    setLanguageModesState((prev) => ({ ...prev, [language]: mode }));
    if (status === "authenticated" && userId) {
      // Guard against a race where the picker is somehow used before the
      // preferences GET (effect above) resolves: PUT requires the full
      // body, so firing it with `prefs` still null would resend defaults
      // and clobber the user's real explore_mode/learning_langs/content_type.
      // Safer to skip the server write than to silently corrupt their prefs —
      // the optimistic local state update above still makes the tap feel
      // instant, and the next mount reconciles from the server.
      if (!prefs) return;
      const nextModes = { ...(prefs.language_modes ?? {}), [language]: mode };
      updateUserPreferences(userId, {
        ui_lang: prefs.ui_lang,
        explore_mode: prefs.explore_mode,
        learning_langs: prefs.learning_langs,
        content_type: prefs.content_type,
        native_lang: prefs.native_lang,
        user_goal: prefs.user_goal,
        language_modes: nextModes,
      }).then((p) => { if (p) setPrefs(p); }).catch(() => {});
    } else {
      setLanguageMode(language, mode);
    }
  }, [status, userId, prefs]);

  const totalCount = items.length;

  if (phase === "loading") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
        <Sidebar uiLang={uiLang} />
        <main className="wex-main" style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 76 }}>
          <span style={{ fontSize: 40 }} aria-hidden="true">🧳</span>
        </main>
        <BottomNav uiLang={uiLang} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ flex: 1, padding: "1.25rem 1rem 2rem", paddingBottom: 76, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", margin: 0 }}>{t.title}</h1>
          <span style={{ fontSize: 12.5, color: "var(--ink-softer)", fontWeight: 600 }}>{t.totalCount(totalCount)}</span>
        </div>

        {totalCount === 0 ? (
          <EmptyCollection t={t} />
        ) : (
          <>
            <CollectionToolbar
              query={query}
              onQueryChange={setQuery}
              themes={themes}
              themeFilter={themeFilter}
              onThemeChange={setThemeFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              uiLang={uiLang}
              t={t}
            />

            {filtered.length === 0 ? (
              <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", textAlign: "center", padding: "1.5rem 0.5rem" }}>
                {t.noResults}
              </p>
            ) : (
              languages
                .filter((lang) => (byLanguageFiltered[lang]?.length ?? 0) > 0)
                .map((lang) => (
                  <LanguageSection
                    key={lang}
                    language={lang}
                    items={byLanguageFiltered[lang] ?? []}
                    totalFavorited={byLanguageAll[lang]?.length ?? 0}
                    mode={resolveMode(lang)}
                    onSetMode={handleSetMode}
                    setCountTotal={setCounts[lang] ?? null}
                    uiLang={uiLang}
                    t={t}
                  />
                ))
            )}
          </>
        )}
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

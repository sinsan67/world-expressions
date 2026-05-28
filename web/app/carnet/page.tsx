"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";
import Eyebrow from "@/components/home/Eyebrow";
import Avatar from "@/components/carnet/Avatar";
import StatTile from "@/components/carnet/StatTile";
import CountryProgressBar from "@/components/carnet/CountryProgressBar";
import TabBar from "@/components/carnet/TabBar";
import FavoriteRow from "@/components/carnet/FavoriteRow";
import HistoryRow from "@/components/carnet/HistoryRow";
import NoteCard from "@/components/carnet/NoteCard";
import AccountBanner from "@/components/carnet/AccountBanner";
import ExportCard from "@/components/carnet/ExportCard";
import { getCarnet, getStats, getProgressByCountry, toggleFavorite, dismissBanner, isBannerDismissed } from "@/lib/carnet";
import { getExpression, getRegions, getAllTagNames, Expression, RegionInfo } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { tagIcon } from "@/lib/tagIcons";

type UILang = "fr" | "en" | "es" | "it" | "tr";

const T: Record<UILang, {
  title: string;
  memberSince: (d: string) => string;
  streak: (n: number) => string;
  seenLabel: string;
  favLabel: string;
  countriesLabel: string;
  topLangLabel: string;
  yourThemes: string;
  tabFavoris: string;
  tabHistory: string;
  tabNotes: string;
  filterFav: string;
  allCountries: string;
  clearHistory: string;
  last50: string;
  emptyFav: string;
  emptyHistory: string;
  emptyNotes: string;
  progressTitle: string;
  exportTitle: string;
  exportJSON: string;
  exportCSV: string;
  localMode: string;
  createAccount: string;
  back: string;
  noLang: string;
  moreCountries: (n: number) => string;
}> = {
  fr: {
    title: "Mon carnet",
    memberSince: (d) => `Membre depuis ${d}`,
    streak: (n) => `🔥 ${n} jour${n > 1 ? "s" : ""} d'affilée`,
    seenLabel: "Expressions vues",
    favLabel: "Favoris",
    countriesLabel: "Pays explorés",
    topLangLabel: "Langue dominante",
    yourThemes: "Tes thèmes",
    tabFavoris: "Favoris",
    tabHistory: "Historique",
    tabNotes: "Notes",
    filterFav: "filtrer mes favoris…",
    allCountries: "tous",
    clearHistory: "effacer l'historique",
    last50: "Tes 50 dernières lectures",
    emptyFav: "Pas encore de favoris — clique sur ♡ pour sauvegarder une expression",
    emptyHistory: "Aucune expression vue pour l'instant",
    emptyNotes: "Aucune note pour l'instant",
    progressTitle: "Progression par pays",
    exportTitle: "Télécharger mon carnet",
    exportJSON: "Export JSON",
    exportCSV: "Export CSV",
    localMode: "Mode local · tes données restent sur cet appareil.",
    createAccount: "Créer un compte →",
    back: "Accueil",
    noLang: "—",
    moreCountries: (n) => `+ ${n} autres pays`,
  },
  en: {
    title: "My notebook",
    memberSince: (d) => `Member since ${d}`,
    streak: (n) => `🔥 ${n} day${n > 1 ? "s" : ""} in a row`,
    seenLabel: "Expressions seen",
    favLabel: "Favorites",
    countriesLabel: "Countries explored",
    topLangLabel: "Top language",
    yourThemes: "Your themes",
    tabFavoris: "Favorites",
    tabHistory: "History",
    tabNotes: "Notes",
    filterFav: "filter favorites…",
    allCountries: "all",
    clearHistory: "clear history",
    last50: "Your last 50 reads",
    emptyFav: "No favorites yet — tap ♡ to save an expression",
    emptyHistory: "No expressions viewed yet",
    emptyNotes: "No notes yet",
    progressTitle: "Country progression",
    exportTitle: "Download my notebook",
    exportJSON: "Export JSON",
    exportCSV: "Export CSV",
    localMode: "Local mode · data stays on this device.",
    createAccount: "Create an account →",
    back: "Home",
    noLang: "—",
    moreCountries: (n) => `+ ${n} more countries`,
  },
  es: {
    title: "Mi cuaderno",
    memberSince: (d) => `Miembro desde ${d}`,
    streak: (n) => `🔥 ${n} día${n > 1 ? "s" : ""} seguidos`,
    seenLabel: "Expresiones vistas",
    favLabel: "Favoritos",
    countriesLabel: "Países explorados",
    topLangLabel: "Idioma principal",
    yourThemes: "Tus temas",
    tabFavoris: "Favoritos",
    tabHistory: "Historial",
    tabNotes: "Notas",
    filterFav: "filtrar favoritos…",
    allCountries: "todos",
    clearHistory: "borrar historial",
    last50: "Tus últimas 50 lecturas",
    emptyFav: "Sin favoritos aún — toca ♡ para guardar una expresión",
    emptyHistory: "Ninguna expresión vista todavía",
    emptyNotes: "Sin notas todavía",
    progressTitle: "Progresión por país",
    exportTitle: "Descargar mi cuaderno",
    exportJSON: "Exportar JSON",
    exportCSV: "Exportar CSV",
    localMode: "Modo local · los datos quedan en este dispositivo.",
    createAccount: "Crear una cuenta →",
    back: "Inicio",
    noLang: "—",
    moreCountries: (n) => `+ ${n} países más`,
  },
  it: {
    title: "Il mio taccuino",
    memberSince: (d) => `Membro da ${d}`,
    streak: (n) => `🔥 ${n} giorno${n > 1 ? "i" : ""} di fila`,
    seenLabel: "Espressioni viste",
    favLabel: "Preferiti",
    countriesLabel: "Paesi esplorati",
    topLangLabel: "Lingua principale",
    yourThemes: "I tuoi temi",
    tabFavoris: "Preferiti",
    tabHistory: "Cronologia",
    tabNotes: "Note",
    filterFav: "filtra preferiti…",
    allCountries: "tutti",
    clearHistory: "cancella cronologia",
    last50: "Le tue ultime 50 letture",
    emptyFav: "Nessun preferito ancora — tocca ♡ per salvare",
    emptyHistory: "Nessuna espressione vista ancora",
    emptyNotes: "Nessuna nota ancora",
    progressTitle: "Progressione per paese",
    exportTitle: "Scarica il mio taccuino",
    exportJSON: "Esporta JSON",
    exportCSV: "Esporta CSV",
    localMode: "Modalità locale · i dati rimangono su questo dispositivo.",
    createAccount: "Crea un account →",
    back: "Home",
    noLang: "—",
    moreCountries: (n) => `+ ${n} altri paesi`,
  },
  tr: {
    title: "Defterim",
    memberSince: (d) => `${d} tarihinden beri üye`,
    streak: (n) => `🔥 ${n} gün art arda`,
    seenLabel: "Görülen deyimler",
    favLabel: "Favoriler",
    countriesLabel: "Keşfedilen ülkeler",
    topLangLabel: "Dominant dil",
    yourThemes: "Temaların",
    tabFavoris: "Favoriler",
    tabHistory: "Geçmiş",
    tabNotes: "Notlar",
    filterFav: "favorileri filtrele…",
    allCountries: "tümü",
    clearHistory: "geçmişi temizle",
    last50: "Son 50 okumanız",
    emptyFav: "Henüz favori yok — ♡ tıkla",
    emptyHistory: "Henüz hiç ifade görülmedi",
    emptyNotes: "Henüz not yok",
    progressTitle: "Ülke bazında ilerleme",
    exportTitle: "Defterimi indir",
    exportJSON: "JSON Dışa Aktar",
    exportCSV: "CSV Dışa Aktar",
    localMode: "Yerel mod · veriler bu cihazda kalır.",
    createAccount: "Hesap oluştur →",
    back: "Ana Sayfa",
    noLang: "—",
    moreCountries: (n) => `+ ${n} ülke daha`,
  },
};

const LANG_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", it: "Italiano", tr: "Türkçe",
};

export default function CarnetPage() {
  const router = useRouter();
  const [uiLang, setUILang] = useState<UILang>("fr");
  const [activeTab, setActiveTab] = useState<"favoris" | "historique" | "notes">("favoris");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Carnet data
  const [stats, setStats] = useState({ totalSeen: 0, favoritesCount: 0, countriesExplored: 0, topLang: null as string | null, streakDays: 0 });
  const [favorites, setFavorites] = useState<Array<{ expressionId: string; savedAt: string }>>([]);
  const [history, setHistory] = useState<Array<{ expressionId: string; region: string; language: string; viewedAt: string }>>([]);
  const [notes, setNotes] = useState<Array<{ expressionId: string; text: string; updatedAt: string }>>([]);
  const [memberSince, setMemberSince] = useState("");
  const [progressByCountry, setProgressByCountry] = useState<Array<{ region: string; seen: number }>>([]);

  // API data
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [expressionMap, setExpressionMap] = useState<Record<string, Expression>>({});
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [filterQuery, setFilterQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  // Load carnet from localStorage on mount
  useEffect(() => {
    const lang = localStorage.getItem("wex_lang") as UILang | null;
    if (lang && ["fr", "en", "es", "it", "tr"].includes(lang)) setUILang(lang);

    const c = getCarnet();
    setStats(getStats());
    setFavorites(c.favorites);
    setHistory(c.history);
    setNotes(c.notes);
    setProgressByCountry(getProgressByCountry());

    const d = new Date(c.user.createdAt);
    setMemberSince(d.toLocaleDateString(undefined, { month: "long", year: "numeric" }));

    if (isBannerDismissed()) setBannerDismissed(true);
  }, []);

  // Fetch regions for progress totals
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
  }, []);

  // Fetch tag names for theme chips
  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames).catch(() => {});
  }, [uiLang]);

  // Fetch expression details for favorites + history
  useEffect(() => {
    const ids = new Set<string>();
    favorites.forEach((f) => ids.add(f.expressionId));
    history.slice(0, 30).forEach((h) => ids.add(h.expressionId));
    notes.forEach((n) => ids.add(n.expressionId));

    if (ids.size === 0) return;

    let cancelled = false;
    Promise.all(
      Array.from(ids).map((id) =>
        getExpression(id, uiLang).then((expr) => ({ id, expr })).catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Expression> = {};
      for (const r of results) {
        if (r) map[r.id] = r.expr;
      }
      setExpressionMap(map);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length, history.length, notes.length, uiLang]);

  const changeLang = useCallback((lang: UILang) => {
    setUILang(lang);
    localStorage.setItem("wex_lang", lang);
  }, []);

  const handleRemoveFavorite = useCallback((expressionId: string) => {
    toggleFavorite(expressionId);
    setFavorites((prev) => prev.filter((f) => f.expressionId !== expressionId));
    setStats(getStats());
  }, []);

  const t = T[uiLang];

  // Top tags computed from favorited expressions
  const topTags: Array<{ slug: string; name: string }> = (() => {
    const counts: Record<string, number> = {};
    favorites.forEach((f) => {
      const expr = expressionMap[f.expressionId];
      if (expr) expr.tags.forEach((tag) => { counts[tag] = (counts[tag] ?? 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug]) => ({ slug, name: tagNames[slug] ?? slug }));
  })();

  // Country chips computed from favorites × expressionMap
  const favoriteCountries: Array<{ region: string; count: number; flag: string }> = (() => {
    const counts: Record<string, number> = {};
    favorites.forEach((f) => {
      const region = expressionMap[f.expressionId]?.region;
      if (region) counts[region] = (counts[region] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({ region, count, flag: FLAG[region] ?? "🌍" }));
  })();

  // Filtered favorites
  const filteredFavorites = favorites.filter((f) => {
    if (countryFilter) {
      const region = expressionMap[f.expressionId]?.region;
      if (region !== countryFilter) return false;
    }
    if (filterQuery.trim()) {
      const expr = expressionMap[f.expressionId];
      const q = filterQuery.toLowerCase();
      return (
        f.expressionId.toLowerCase().includes(q) ||
        expr?.expression.toLowerCase().includes(q) ||
        expr?.meaning.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Progress data: merge carnet history with API total counts
  const progressData = progressByCountry
    .map((p) => ({
      region: p.region,
      seen: p.seen,
      total: regions.find((r) => r.code === p.region)?.count ?? 0,
      flag: FLAG[p.region] ?? "🌍",
      name: COUNTRY_NAME[p.region] ?? p.region.toUpperCase(),
    }))
    .filter((p) => p.total > 0);

  const initial = (uiLang[0] ?? "M").toUpperCase();

  const tabs = [
    { id: "favoris",    icon: "♥", label: t.tabFavoris,  count: stats.favoritesCount || undefined },
    { id: "historique", icon: "👁", label: t.tabHistory,  count: stats.totalSeen || undefined },
    { id: "notes",      icon: "✎", label: t.tabNotes,    count: notes.length || undefined },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />
      <LangBar uiLang={uiLang} onLangChange={changeLang} />

      <main className="wex-main" style={{ paddingBottom: 80 }}>

        {/* Top nav — mobile only */}
        <div
          className="wex-mobile-header"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--paper-edge)",
            background: "var(--paper)",
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-softer)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ← {t.back}
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--terra)" }}>
            {t.title}
          </span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>

          {/* Breadcrumb — desktop only */}
          <div className="wex-atlas-card" style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
              <Link href="/" style={{ color: "var(--ink-softer)", textDecoration: "none" }}>{t.back}</Link>
              {" › "}<span style={{ color: "var(--ink)" }}>{t.title}</span>
            </p>
          </div>

          {/* ── COVER POSTCARD ── */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--paper-edge)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-postcard)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.25rem",
              transform: "rotate(-0.2deg)",
              animation: "fadeSlideUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <Avatar initial={initial} size={64} tone="terra" />

              <div style={{ flex: 1, minWidth: 160 }}>
                <Eyebrow tone="terra">Mon carnet</Eyebrow>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "clamp(22px, 4vw, 32px)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.2,
                    margin: "0.2rem 0 0.25rem",
                  }}
                >
                  {t.title}
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)" }}>
                  {memberSince ? t.memberSince(memberSince) : ""}
                  {stats.streakDays > 0 && (
                    <span style={{ marginLeft: "0.75rem", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--terra)" }}>
                      {t.streak(stats.streakDays)}
                    </span>
                  )}
                </p>
              </div>

              {/* Stat tiles row — desktop */}
              <div className="wex-atlas-card" style={{ display: "flex", gap: "0.75rem" }}>
                <StatTile value={stats.totalSeen} label="vues" size="lg" />
                <StatTile value={stats.favoritesCount} label="favoris" icon="♥" tone="terra" size="lg" />
                <StatTile value={`${stats.countriesExplored}/14`} label="pays" tone="plum" size="lg" />
              </div>
            </div>

            {topTags.length > 0 && (
              <>
                <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "1rem 0 0.75rem" }} />
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-faint)", marginBottom: "0.5rem" }}>
                    {t.yourThemes}
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {topTags.map(({ slug, name }) => (
                      <span
                        key={slug}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "var(--r-pill)",
                          background: "var(--plum-bg)",
                          color: "var(--plum)",
                          fontSize: 12,
                          fontFamily: "var(--font-body)",
                          border: "1.5px solid var(--plum-soft)",
                        }}
                      >
                        {tagIcon(slug) && <span style={{ marginRight: 3 }}>{tagIcon(slug)}</span>}
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── STAT TILES — mobile only (2×2) ── */}
          <div
            className="wex-mobile-header"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}
          >
            <StatTile value={stats.totalSeen} label={t.seenLabel} />
            <StatTile value={stats.favoritesCount} label={t.favLabel} icon="♥" tone="terra" />
            <StatTile value={`${stats.countriesExplored}/14`} label={t.countriesLabel} tone="plum" />
            <StatTile value={stats.topLang ? (LANG_NAME[stats.topLang] ?? stats.topLang) : t.noLang} label={t.topLangLabel} />
          </div>

          {/* ── TWO COLUMN LAYOUT (desktop) / stacked (mobile) ── */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* LEFT: TabBar + tab content */}
            <div style={{ flex: "1 1 400px", minWidth: 0 }}>
              <TabBar
                tabs={tabs}
                active={activeTab}
                onChange={(id) => {
                  setActiveTab(id as typeof activeTab);
                  window.history.replaceState(null, "", `/carnet#${id}`);
                }}
              />

              <div
                key={activeTab}
                style={{ marginTop: "1rem", animation: "fadeIn 200ms ease both" }}
              >
                {/* ── FAVORIS ── */}
                {activeTab === "favoris" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {favorites.length > 0 && (
                      <>
                        <input
                          type="search"
                          placeholder={t.filterFav}
                          value={filterQuery}
                          onChange={(e) => setFilterQuery(e.target.value)}
                          className="wex-input"
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "var(--r-md)",
                            border: "1.5px solid var(--paper-edge)",
                            background: "var(--paper)",
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            color: "var(--ink)",
                            boxSizing: "border-box",
                          }}
                        />

                        {/* Country filter chips */}
                        {favoriteCountries.length > 1 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            <button
                              onClick={() => setCountryFilter(null)}
                              style={{
                                padding: "3px 10px",
                                borderRadius: "var(--r-pill)",
                                border: `1.5px solid ${countryFilter === null ? "var(--ink)" : "var(--paper-edge)"}`,
                                background: countryFilter === null ? "var(--ink)" : "transparent",
                                color: countryFilter === null ? "var(--paper)" : "var(--ink-soft)",
                                fontSize: 12,
                                fontFamily: "var(--font-body)",
                                cursor: "pointer",
                              }}
                            >
                              {t.allCountries} ({favorites.length})
                            </button>
                            {favoriteCountries.map(({ region, count, flag }) => (
                              <button
                                key={region}
                                onClick={() => setCountryFilter(countryFilter === region ? null : region)}
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: "var(--r-pill)",
                                  border: `1.5px solid ${countryFilter === region ? "var(--plum)" : "var(--paper-edge)"}`,
                                  background: countryFilter === region ? "var(--plum-bg)" : "transparent",
                                  color: countryFilter === region ? "var(--plum)" : "var(--ink-soft)",
                                  fontSize: 12,
                                  fontFamily: "var(--font-body)",
                                  cursor: "pointer",
                                }}
                              >
                                {flag} {count}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {filteredFavorites.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>
                        {t.emptyFav}
                      </p>
                    ) : (
                      filteredFavorites.map((f) => (
                        <FavoriteRow
                          key={f.expressionId}
                          expressionId={f.expressionId}
                          expression={expressionMap[f.expressionId] ?? null}
                          savedAt={f.savedAt}
                          onRemove={() => handleRemoveFavorite(f.expressionId)}
                          uiLang={uiLang}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* ── HISTORIQUE ── */}
                {activeTab === "historique" && (
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-faint)", marginBottom: "0.5rem" }}>
                      {t.last50}
                    </p>
                    {history.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>
                        {t.emptyHistory}
                      </p>
                    ) : (
                      <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                        {history.slice(0, 30).map((h) => (
                          <HistoryRow
                            key={h.expressionId + h.viewedAt}
                            expressionId={h.expressionId}
                            region={h.region}
                            language={h.language}
                            viewedAt={h.viewedAt}
                            expression={expressionMap[h.expressionId] ?? null}
                            uiLang={uiLang}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── NOTES ── */}
                {activeTab === "notes" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {notes.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>
                        {t.emptyNotes}
                      </p>
                    ) : (
                      notes.map((n) => (
                        <NoteCard
                          key={n.expressionId}
                          expressionId={n.expressionId}
                          text={n.text}
                          updatedAt={n.updatedAt}
                          expression={expressionMap[n.expressionId] ?? null}
                          uiLang={uiLang}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Progress + Account + Export */}
            <div style={{ flex: "0 1 280px", minWidth: 240, display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Country progression */}
              <div
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--paper-edge)",
                  borderRadius: "var(--r-md)",
                  padding: "1rem",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <Eyebrow tone="terra">Ta collection</Eyebrow>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    color: "var(--ink)",
                    margin: "0.3rem 0 1rem",
                    fontWeight: 500,
                  }}
                >
                  {t.progressTitle}
                </h3>

                {progressData.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>
                    —
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {progressData.slice(0, 6).map((p) => (
                      <CountryProgressBar
                        key={p.region}
                        flag={p.flag}
                        name={p.name}
                        seen={p.seen}
                        total={p.total}
                      />
                    ))}
                  </div>
                )}

                {progressData.length > 6 && (
                  <p style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--ink-softer)", marginTop: "0.75rem" }}>
                    {t.moreCountries(progressData.length - 6)}
                  </p>
                )}
              </div>

              {/* Account banner — local mode */}
              {!bannerDismissed && (
                <AccountBanner
                  label={t.localMode}
                  cta={t.createAccount}
                  onDismiss={() => {
                    setBannerDismissed(true);
                    dismissBanner();
                  }}
                />
              )}

              {/* Export */}
              <ExportCard
                title={t.exportTitle}
                labelJSON={t.exportJSON}
                labelCSV={t.exportCSV}
              />
            </div>

          </div>
        </div>

        {/* Bottom spacer */}
        <div style={{ height: "3rem" }} />
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

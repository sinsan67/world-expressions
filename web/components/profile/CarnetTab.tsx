"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import Eyebrow from "@/components/home/Eyebrow";
import Avatar from "@/components/carnet/Avatar";
import StatTile from "@/components/carnet/StatTile";
import CountryProgressBar from "@/components/carnet/CountryProgressBar";
import TabBar from "@/components/carnet/TabBar";
import FavoriteRow from "@/components/carnet/FavoriteRow";
import HistoryRow from "@/components/carnet/HistoryRow";
import NoteCard from "@/components/carnet/NoteCard";
import ExportCard from "@/components/carnet/ExportCard";
import AuthModal from "@/components/profile/AuthModal";
import { getCarnet, getStats, getProgressByCountry } from "@/lib/carnet";
import { getExpression, getCountries, getAllTagNames, Expression, CountryInfo } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { tagIcon } from "@/lib/tagIcons";
import type { UILang } from "@/lib/useUILang";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const T: Record<UILang, {
  memberSince: (d: string) => string;
  streak: (n: number) => string;
  seenLabel: string; favLabel: string; countriesLabel: string; topLangLabel: string;
  yourThemes: string;
  tabFavoris: string; tabHistory: string; tabNotes: string;
  filterFav: string; allCountries: string;
  last50: string;
  emptyFav: string; emptyHistory: string; emptyNotes: string;
  progressTitle: string;
  exportTitle: string; exportJSON: string; exportCSV: string;
  noLang: string;
  moreCountries: (n: number) => string;
  signInPrompt: string; signInCta: string;
}> = {
  fr: {
    memberSince: (d) => `Membre depuis ${d}`,
    streak: (n) => `🔥 ${n} jour${n > 1 ? "s" : ""} d'affilée`,
    seenLabel: "Expressions vues", favLabel: "Favoris", countriesLabel: "Pays explorés", topLangLabel: "Langue dominante",
    yourThemes: "Tes thèmes",
    tabFavoris: "Favoris", tabHistory: "Historique", tabNotes: "Notes",
    filterFav: "filtrer mes favoris…", allCountries: "tous",
    last50: "Tes 50 dernières lectures",
    emptyFav: "Pas encore de favoris — clique sur ♡ pour sauvegarder une expression",
    emptyHistory: "Aucune expression vue pour l'instant",
    emptyNotes: "Aucune note pour l'instant",
    progressTitle: "Progression par pays",
    exportTitle: "Télécharger mon carnet", exportJSON: "Export JSON", exportCSV: "Export CSV",
    noLang: "—",
    moreCountries: (n) => `+ ${n} autres pays`,
    signInPrompt: "Connecte-toi pour sauvegarder tes favoris, suivre ta progression et retrouver ton carnet sur tous tes appareils.",
    signInCta: "Créer un compte →",
  },
  en: {
    memberSince: (d) => `Member since ${d}`,
    streak: (n) => `🔥 ${n} day${n > 1 ? "s" : ""} in a row`,
    seenLabel: "Expressions seen", favLabel: "Favorites", countriesLabel: "Countries explored", topLangLabel: "Top language",
    yourThemes: "Your themes",
    tabFavoris: "Favorites", tabHistory: "History", tabNotes: "Notes",
    filterFav: "filter favorites…", allCountries: "all",
    last50: "Your last 50 reads",
    emptyFav: "No favorites yet — tap ♡ to save an expression",
    emptyHistory: "No expressions viewed yet",
    emptyNotes: "No notes yet",
    progressTitle: "Country progression",
    exportTitle: "Download my notebook", exportJSON: "Export JSON", exportCSV: "Export CSV",
    noLang: "—",
    moreCountries: (n) => `+ ${n} more countries`,
    signInPrompt: "Sign in to save your favorites, track your progress, and pick up where you left off on any device.",
    signInCta: "Create an account →",
  },
  es: {
    memberSince: (d) => `Miembro desde ${d}`,
    streak: (n) => `🔥 ${n} día${n > 1 ? "s" : ""} seguidos`,
    seenLabel: "Expresiones vistas", favLabel: "Favoritos", countriesLabel: "Países explorados", topLangLabel: "Idioma principal",
    yourThemes: "Tus temas",
    tabFavoris: "Favoritos", tabHistory: "Historial", tabNotes: "Notas",
    filterFav: "filtrar favoritos…", allCountries: "todos",
    last50: "Tus últimas 50 lecturas",
    emptyFav: "Sin favoritos aún — toca ♡ para guardar una expresión",
    emptyHistory: "Ninguna expresión vista todavía",
    emptyNotes: "Sin notas todavía",
    progressTitle: "Progresión por país",
    exportTitle: "Descargar mi cuaderno", exportJSON: "Exportar JSON", exportCSV: "Exportar CSV",
    noLang: "—",
    moreCountries: (n) => `+ ${n} países más`,
    signInPrompt: "Inicia sesión para guardar tus favoritos, seguir tu progreso y retomar desde cualquier dispositivo.",
    signInCta: "Crear una cuenta →",
  },
  it: {
    memberSince: (d) => `Membro da ${d}`,
    streak: (n) => `🔥 ${n} giorno${n > 1 ? "i" : ""} di fila`,
    seenLabel: "Espressioni viste", favLabel: "Preferiti", countriesLabel: "Paesi esplorati", topLangLabel: "Lingua principale",
    yourThemes: "I tuoi temi",
    tabFavoris: "Preferiti", tabHistory: "Cronologia", tabNotes: "Note",
    filterFav: "filtra preferiti…", allCountries: "tutti",
    last50: "Le tue ultime 50 letture",
    emptyFav: "Nessun preferito ancora — tocca ♡ per salvare",
    emptyHistory: "Nessuna espressione vista ancora",
    emptyNotes: "Nessuna nota ancora",
    progressTitle: "Progressione per paese",
    exportTitle: "Scarica il mio taccuino", exportJSON: "Esporta JSON", exportCSV: "Esporta CSV",
    noLang: "—",
    moreCountries: (n) => `+ ${n} altri paesi`,
    signInPrompt: "Accedi per salvare i tuoi preferiti, seguire i progressi e ritrovare il taccuino su qualsiasi dispositivo.",
    signInCta: "Crea un account →",
  },
  tr: {
    memberSince: (d) => `${d} tarihinden beri üye`,
    streak: (n) => `🔥 ${n} gün art arda`,
    seenLabel: "Görülen deyimler", favLabel: "Favoriler", countriesLabel: "Keşfedilen ülkeler", topLangLabel: "Dominant dil",
    yourThemes: "Temaların",
    tabFavoris: "Favoriler", tabHistory: "Geçmiş", tabNotes: "Notlar",
    filterFav: "favorileri filtrele…", allCountries: "tümü",
    last50: "Son 50 okumanız",
    emptyFav: "Henüz favori yok — ♡ tıkla",
    emptyHistory: "Henüz hiç ifade görülmedi",
    emptyNotes: "Henüz not yok",
    progressTitle: "Ülke bazında ilerleme",
    exportTitle: "Defterimi indir", exportJSON: "JSON Dışa Aktar", exportCSV: "CSV Dışa Aktar",
    noLang: "—",
    moreCountries: (n) => `+ ${n} ülke daha`,
    signInPrompt: "Favorilerini kaydetmek, ilerlemeyi takip etmek ve her cihazdan kaldığın yerden devam etmek için giriş yap.",
    signInCta: "Hesap oluştur →",
  },
  de: {
    memberSince: (d) => `Mitglied seit ${d}`,
    streak: (n) => `🔥 ${n} Tag${n !== 1 ? "e" : ""} hintereinander`,
    seenLabel: "Gesehene Ausdrücke", favLabel: "Favoriten", countriesLabel: "Erkundete Länder", topLangLabel: "Hauptsprache",
    yourThemes: "Deine Themen",
    tabFavoris: "Favoriten", tabHistory: "Verlauf", tabNotes: "Notizen",
    filterFav: "Favoriten filtern…", allCountries: "alle",
    last50: "Deine letzten 50 Lektüren",
    emptyFav: "Noch keine Favoriten — tippe auf ♡ um zu speichern",
    emptyHistory: "Noch keine Ausdrücke angesehen",
    emptyNotes: "Noch keine Notizen",
    progressTitle: "Fortschritt nach Land",
    exportTitle: "Heft herunterladen", exportJSON: "JSON exportieren", exportCSV: "CSV exportieren",
    noLang: "—",
    moreCountries: (n) => `+ ${n} weitere Länder`,
    signInPrompt: "Melde dich an, um deine Favoriten zu speichern, deinen Fortschritt zu verfolgen und auf jedem Gerät weiterzumachen.",
    signInCta: "Konto erstellen →",
  },
  ja: {
    memberSince: (d) => `${d}からのメンバー`,
    streak: (n) => `🔥 ${n}日連続`,
    seenLabel: "見た表現", favLabel: "お気に入り", countriesLabel: "探した国", topLangLabel: "主な言語",
    yourThemes: "テーマ",
    tabFavoris: "お気に入り", tabHistory: "履歴", tabNotes: "メモ",
    filterFav: "お気に入りを絞り込む…", allCountries: "すべて",
    last50: "最近の50件",
    emptyFav: "まだお気に入りなし — ♡をタップして保存",
    emptyHistory: "まだ表現を見ていません",
    emptyNotes: "まだメモなし",
    progressTitle: "国別の進捗",
    exportTitle: "ノートをダウンロード", exportJSON: "JSONエクスポート", exportCSV: "CSVエクスポート",
    noLang: "—",
    moreCountries: (n) => `+ ${n}ヶ国`,
    signInPrompt: "サインインしてお気に入りを保存し、進捗を追跡し、どのデバイスでも続けよう。",
    signInCta: "アカウントを作成 →",
  },
};

const LANG_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", it: "Italiano", tr: "Türkçe", de: "Deutsch", ja: "日本語",
};

interface Props {
  session: Session | null;
  uiLang: UILang;
  onAuthRequired: () => void;
}

export default function CarnetTab({ session, uiLang, onAuthRequired }: Props) {
  const t = T[uiLang];
  const [activeTab, setActiveTab] = useState<"favoris" | "historique" | "notes">("favoris");

  // API favorites (logged-in)
  const [apiFavorites, setApiFavorites] = useState<Array<{ expression_id: string; saved_at: string }>>([]);

  // Local data (history + notes, localStorage)
  const [history, setHistory] = useState<Array<{ expressionId: string; region: string; language: string; viewedAt: string }>>([]);
  const [notes, setNotes] = useState<Array<{ expressionId: string; text: string; updatedAt: string }>>([]);
  const [memberSince, setMemberSince] = useState("");
  const [progressByCountry, setProgressByCountry] = useState<Array<{ region: string; seen: number }>>([]);

  // API data
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [expressionMap, setExpressionMap] = useState<Record<string, Expression>>({});
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [filterQuery, setFilterQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/users/${userId}/favorites`)
      .then((r) => r.json())
      .then((d) => setApiFavorites(d.favorites ?? []))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const c = getCarnet();
    setHistory(c.history);
    setNotes(c.notes);
    setProgressByCountry(getProgressByCountry());
    const d = new Date(c.user.createdAt);
    setMemberSince(d.toLocaleDateString(undefined, { month: "long", year: "numeric" }));
  }, [userId]);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames).catch(() => {});
  }, [uiLang]);

  useEffect(() => {
    if (!userId) return;
    const ids = new Set<string>();
    apiFavorites.forEach((f) => ids.add(f.expression_id));
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
      for (const r of results) if (r) map[r.id] = r.expr;
      setExpressionMap(map);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFavorites.length, history.length, notes.length, uiLang, userId]);

  const handleRemoveFavorite = useCallback(async (expressionId: string) => {
    if (!userId) return;
    await fetch(`${API_URL}/users/${userId}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression_id: expressionId }),
    });
    setApiFavorites((prev) => prev.filter((f) => f.expression_id !== expressionId));
  }, [userId]);

  // Not logged in — gate
  if (!session) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: "1rem" }}>📖</div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          {t.signInPrompt}
        </p>
        <button
          onClick={onAuthRequired}
          style={{
            padding: "0.625rem 1.5rem",
            borderRadius: "var(--r-pill)",
            border: "none",
            background: "var(--ink)",
            color: "var(--paper)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t.signInCta}
        </button>
      </div>
    );
  }

  const stats = getStats();
  const initial = (uiLang[0] ?? "M").toUpperCase();

  const topTags: Array<{ slug: string; name: string }> = (() => {
    const counts: Record<string, number> = {};
    apiFavorites.forEach((f) => {
      const expr = expressionMap[f.expression_id];
      if (expr) expr.tags.forEach((tag) => { counts[tag] = (counts[tag] ?? 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([slug]) => ({ slug, name: tagNames[slug] ?? slug }));
  })();

  const favoriteCountries: Array<{ region: string; count: number; flag: string }> = (() => {
    const counts: Record<string, number> = {};
    apiFavorites.forEach((f) => {
      const expr = expressionMap[f.expression_id];
      const region = expr?.country || expr?.region;
      if (region) counts[region] = (counts[region] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({ region, count, flag: FLAG[region] ?? "🌍" }));
  })();

  const filteredFavorites = apiFavorites.filter((f) => {
    const expr = expressionMap[f.expression_id];
    if (countryFilter && (expr?.country || expr?.region) !== countryFilter) return false;
    if (filterQuery.trim()) {
      const expr = expressionMap[f.expression_id];
      const q = filterQuery.toLowerCase();
      return (
        f.expression_id.toLowerCase().includes(q) ||
        expr?.expression.toLowerCase().includes(q) ||
        expr?.meaning.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const progressData = progressByCountry
    .map((p) => ({
      region: p.region,
      seen: p.seen,
      total: countries.find((r) => r.code === p.region)?.count ?? 0,
      flag: FLAG[p.region] ?? "🌍",
      name: COUNTRY_NAME[p.region] ?? p.region.toUpperCase(),
    }))
    .filter((p) => p.total > 0);

  const tabs = [
    { id: "favoris",    icon: "♥", label: t.tabFavoris,  count: apiFavorites.length || undefined },
    { id: "historique", icon: "👁", label: t.tabHistory,  count: history.length || undefined },
    { id: "notes",      icon: "✎", label: t.tabNotes,    count: notes.length || undefined },
  ];

  return (
    <div>
      {/* Cover postcard */}
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
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-softer)", margin: "0.25rem 0 0" }}>
              {memberSince ? t.memberSince(memberSince) : ""}
              {stats.streakDays > 0 && (
                <span style={{ marginLeft: "0.75rem", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--terra)" }}>
                  {t.streak(stats.streakDays)}
                </span>
              )}
            </p>
          </div>
          <div className="wex-atlas-card" style={{ display: "flex", gap: "0.75rem" }}>
            <StatTile value={stats.totalSeen} label={t.seenLabel} size="lg" />
            <StatTile value={apiFavorites.length} label={t.favLabel} icon="♥" tone="terra" size="lg" />
            <StatTile value={`${stats.countriesExplored}/14`} label={t.countriesLabel} tone="plum" size="lg" />
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
                  <span key={slug} style={{ padding: "3px 10px", borderRadius: "var(--r-pill)", background: "var(--plum-bg)", color: "var(--plum)", fontSize: 12, fontFamily: "var(--font-body)", border: "1.5px solid var(--plum-soft)" }}>
                    {tagIcon(slug) && <span style={{ marginRight: 3 }}>{tagIcon(slug)}</span>}
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile stats grid */}
      <div className="wex-mobile-header" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <StatTile value={stats.totalSeen} label={t.seenLabel} />
        <StatTile value={apiFavorites.length} label={t.favLabel} icon="♥" tone="terra" />
        <StatTile value={`${stats.countriesExplored}/14`} label={t.countriesLabel} tone="plum" />
        <StatTile value={stats.topLang ? (LANG_NAME[stats.topLang] ?? stats.topLang) : t.noLang} label={t.topLangLabel} />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Left: tabs + content */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <TabBar
            tabs={tabs}
            active={activeTab}
            onChange={(id) => {
              setActiveTab(id as typeof activeTab);
              window.history.replaceState(null, "", `/profile#${id}`);
            }}
          />

          <div key={activeTab} style={{ marginTop: "1rem", animation: "fadeIn 200ms ease both" }}>
            {/* Favoris */}
            {activeTab === "favoris" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {apiFavorites.length > 0 && (
                  <>
                    <input
                      type="search"
                      placeholder={t.filterFav}
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="wex-input"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--r-md)", border: "1.5px solid var(--paper-edge)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", boxSizing: "border-box" }}
                    />
                    {favoriteCountries.length > 1 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        <button onClick={() => setCountryFilter(null)} style={{ padding: "3px 10px", borderRadius: "var(--r-pill)", border: `1.5px solid ${countryFilter === null ? "var(--ink)" : "var(--paper-edge)"}`, background: countryFilter === null ? "var(--ink)" : "transparent", color: countryFilter === null ? "var(--paper)" : "var(--ink-soft)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                          {t.allCountries} ({apiFavorites.length})
                        </button>
                        {favoriteCountries.map(({ region, count, flag }) => (
                          <button key={region} onClick={() => setCountryFilter(countryFilter === region ? null : region)} style={{ padding: "3px 10px", borderRadius: "var(--r-pill)", border: `1.5px solid ${countryFilter === region ? "var(--plum)" : "var(--paper-edge)"}`, background: countryFilter === region ? "var(--plum-bg)" : "transparent", color: countryFilter === region ? "var(--plum)" : "var(--ink-soft)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                            {flag} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {filteredFavorites.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>{t.emptyFav}</p>
                ) : (
                  filteredFavorites.map((f) => (
                    <FavoriteRow
                      key={f.expression_id}
                      expressionId={f.expression_id}
                      expression={expressionMap[f.expression_id] ?? null}
                      savedAt={f.saved_at}
                      onRemove={() => handleRemoveFavorite(f.expression_id)}
                      uiLang={uiLang}
                    />
                  ))
                )}
              </div>
            )}

            {/* Historique */}
            {activeTab === "historique" && (
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-faint)", marginBottom: "0.5rem" }}>{t.last50}</p>
                {history.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>{t.emptyHistory}</p>
                ) : (
                  <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                    {history.slice(0, 30).map((h) => (
                      <HistoryRow key={h.expressionId + h.viewedAt} expressionId={h.expressionId} region={h.region} language={h.language} viewedAt={h.viewedAt} expression={expressionMap[h.expressionId] ?? null} uiLang={uiLang} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {notes.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--ink-softer)", padding: "1.5rem 0.5rem", textAlign: "center" }}>{t.emptyNotes}</p>
                ) : (
                  notes.map((n) => (
                    <NoteCard key={n.expressionId} expressionId={n.expressionId} text={n.text} updatedAt={n.updatedAt} expression={expressionMap[n.expressionId] ?? null} uiLang={uiLang} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: progress + export */}
        <div style={{ flex: "0 1 280px", minWidth: 240, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: "var(--r-md)", padding: "1rem", boxShadow: "var(--shadow-card)" }}>
            <Eyebrow tone="terra">Ta collection</Eyebrow>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", margin: "0.3rem 0 1rem", fontWeight: 500 }}>{t.progressTitle}</h3>
            {progressData.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>—</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {progressData.slice(0, 6).map((p) => (
                  <CountryProgressBar key={p.region} flag={p.flag} name={p.name} seen={p.seen} total={p.total} />
                ))}
              </div>
            )}
            {progressData.length > 6 && (
              <p style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--ink-softer)", marginTop: "0.75rem" }}>
                {t.moreCountries(progressData.length - 6)}
              </p>
            )}
          </div>

          <ExportCard title={t.exportTitle} labelJSON={t.exportJSON} labelCSV={t.exportCSV} />
        </div>

      </div>
    </div>
  );
}

"use client";

/**
 * Random mode — draw random expressions as flip cards.
 *
 * Two phases:
 *  - "entry": dice hero + three tap-first filters (country chips, kind tiles,
 *             domain pills) + live pool counter on the roll button
 *             + "Surprise me" that spins the filters like a slot machine.
 *  - "play":  flip card (front = expression + emoji hints, back = meaning +
 *             clickable tags) over a country-tinted background, with a bottom
 *             action bar (review / new card). Swipe + arrow keys still work.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRandomExpression, getRandomCount, getCountries, Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { tagIcon } from "@/lib/tagIcons";
import { EDITORIAL_DOMAINS } from "@/lib/editorialDomains";
import { useUILangContext } from "@/lib/UILangContext";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";

type RandomCard = Expression & { meaning_locale: string; literal: string | null };

const KINDS = ["idiom", "proverb", "locution"] as const;
const KIND_EMOJI: Record<string, string> = { idiom: "💬", proverb: "📜", locution: "🧩" };

const T: Record<string, {
  title: string;
  subtitle: string;
  countryLabel: string;
  kindLabel: string;
  domainLabel: string;
  allCountries: string;
  allKinds: string;
  rollBtn: string;
  surpriseBtn: string;
  cards: string;
  tapHint: string;
  hintsLabel: string;
  meaningLabel: string;
  exampleLabel: string;
  tagsLabel: string;
  fullCard: string;
  card: string;
  reviewBtn: string;
  newCardBtn: string;
  back: string;
  empty: string;
  serverError: string;
}> = {
  fr: {
    title: "Au hasard !",
    subtitle: "Compose ton voyage — ou lance le dé tel quel.",
    countryLabel: "Pays",
    kindLabel: "Type",
    domainLabel: "Domaine",
    allCountries: "Tous les pays",
    allKinds: "Tous",
    rollBtn: "Lancer le dé !",
    surpriseBtn: "Surprends-moi",
    cards: "cartes",
    tapHint: "Tape pour révéler le sens",
    hintsLabel: "Indices",
    meaningLabel: "Signification",
    exampleLabel: "Exemple",
    tagsLabel: "Tags",
    fullCard: "Voir la fiche complète →",
    card: "carte",
    reviewBtn: "Revoir",
    newCardBtn: "Nouvelle carte",
    back: "Retour",
    empty: "Aucune expression pour ces filtres — essaie une autre combinaison.",
    serverError: "Le serveur ne répond pas — réessaie dans un instant.",
  },
  en: {
    title: "Random mode",
    subtitle: "Compose your journey — or just roll the dice.",
    countryLabel: "Country",
    kindLabel: "Type",
    domainLabel: "Domain",
    allCountries: "All countries",
    allKinds: "All",
    rollBtn: "Roll the dice!",
    surpriseBtn: "Surprise me",
    cards: "cards",
    tapHint: "Tap to reveal the meaning",
    hintsLabel: "Hints",
    meaningLabel: "Meaning",
    exampleLabel: "Example",
    tagsLabel: "Tags",
    fullCard: "See the full card →",
    card: "card",
    reviewBtn: "Review",
    newCardBtn: "New card",
    back: "Back",
    empty: "No expression for these filters — try another combination.",
    serverError: "The server isn't responding — try again in a moment.",
  },
  es: {
    title: "Modo aleatorio",
    subtitle: "Compón tu viaje — o lanza el dado tal cual.",
    countryLabel: "País",
    kindLabel: "Tipo",
    domainLabel: "Tema",
    allCountries: "Todos los países",
    allKinds: "Todos",
    rollBtn: "¡Lanza el dado!",
    surpriseBtn: "Sorpréndeme",
    cards: "cartas",
    tapHint: "Toca para revelar el significado",
    hintsLabel: "Pistas",
    meaningLabel: "Significado",
    exampleLabel: "Ejemplo",
    tagsLabel: "Etiquetas",
    fullCard: "Ver la ficha completa →",
    card: "carta",
    reviewBtn: "Repasar",
    newCardBtn: "Nueva carta",
    back: "Volver",
    empty: "Ninguna expresión con estos filtros — prueba otra combinación.",
    serverError: "El servidor no responde — inténtalo de nuevo en un momento.",
  },
  it: {
    title: "Modalità casuale",
    subtitle: "Componi il tuo viaggio — o lancia il dado così com'è.",
    countryLabel: "Paese",
    kindLabel: "Tipo",
    domainLabel: "Tema",
    allCountries: "Tutti i paesi",
    allKinds: "Tutti",
    rollBtn: "Lancia il dado!",
    surpriseBtn: "Sorprendimi",
    cards: "carte",
    tapHint: "Tocca per svelare il significato",
    hintsLabel: "Indizi",
    meaningLabel: "Significato",
    exampleLabel: "Esempio",
    tagsLabel: "Tag",
    fullCard: "Vedi la scheda completa →",
    card: "carta",
    reviewBtn: "Rivedi",
    newCardBtn: "Nuova carta",
    back: "Indietro",
    empty: "Nessuna espressione con questi filtri — prova un'altra combinazione.",
    serverError: "Il server non risponde — riprova tra un istante.",
  },
  tr: {
    title: "Rastgele mod",
    subtitle: "Yolculuğunu kur — ya da zarı olduğu gibi at.",
    countryLabel: "Ülke",
    kindLabel: "Tür",
    domainLabel: "Tema",
    allCountries: "Tüm ülkeler",
    allKinds: "Tümü",
    rollBtn: "Zarı at!",
    surpriseBtn: "Beni şaşırt",
    cards: "kart",
    tapHint: "Anlamı görmek için dokun",
    hintsLabel: "İpuçları",
    meaningLabel: "Anlam",
    exampleLabel: "Örnek",
    tagsLabel: "Etiketler",
    fullCard: "Tam kartı gör →",
    card: "kart",
    reviewBtn: "Tekrar bak",
    newCardBtn: "Yeni kart",
    back: "Geri",
    empty: "Bu filtrelerle ifade bulunamadı — başka bir kombinasyon dene.",
    serverError: "Sunucu yanıt vermiyor — birazdan tekrar dene.",
  },
  de: {
    title: "Zufallsmodus",
    subtitle: "Stell deine Reise zusammen — oder würfle einfach.",
    countryLabel: "Land",
    kindLabel: "Typ",
    domainLabel: "Thema",
    allCountries: "Alle Länder",
    allKinds: "Alle",
    rollBtn: "Würfeln!",
    surpriseBtn: "Überrasch mich",
    cards: "Karten",
    tapHint: "Tippe, um die Bedeutung aufzudecken",
    hintsLabel: "Hinweise",
    meaningLabel: "Bedeutung",
    exampleLabel: "Beispiel",
    tagsLabel: "Tags",
    fullCard: "Zur vollständigen Karte →",
    card: "Karte",
    reviewBtn: "Zurück",
    newCardBtn: "Neue Karte",
    back: "Zurück",
    empty: "Kein Ausdruck für diese Filter — probiere eine andere Kombination.",
    serverError: "Der Server antwortet nicht — versuche es gleich noch einmal.",
  },
  ja: {
    title: "ランダムモード",
    subtitle: "旅を組み立てても、そのままサイコロを振ってもOK。",
    countryLabel: "国",
    kindLabel: "種類",
    domainLabel: "テーマ",
    allCountries: "すべての国",
    allKinds: "すべて",
    rollBtn: "サイコロを振る！",
    surpriseBtn: "おまかせで",
    cards: "枚",
    tapHint: "タップして意味を見る",
    hintsLabel: "ヒント",
    meaningLabel: "意味",
    exampleLabel: "例文",
    tagsLabel: "タグ",
    fullCard: "詳細カードを見る →",
    card: "カード",
    reviewBtn: "もどる",
    newCardBtn: "新しいカード",
    back: "戻る",
    empty: "この条件に合う表現がありません — 別の組み合わせを試してください。",
    serverError: "サーバーが応答していません — しばらくしてからもう一度お試しください。",
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RandomModePage() {
  const router = useRouter();
  const { uiLang } = useUILangContext();
  const t = T[uiLang] ?? T.en;

  const [phase, setPhase] = useState<"entry" | "play">("entry");
  const [country, setCountry] = useState("");
  const [kind, setKind] = useState("");
  const [domain, setDomain] = useState("");
  const [countries, setCountries] = useState<{ code: string; count: number }[]>([]);
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<RandomCard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<"" | "empty" | "server">("");
  const drawing = useRef(false);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  // Live pool counter: how many cards match the current filters (debounced)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      getRandomCount(country, kind, domain)
        .then((n) => { if (!cancelled) setPoolCount(n); })
        .catch(() => {});
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [country, kind, domain]);

  // During the "surprise" spin, keep the moving selection visible in its row
  useEffect(() => {
    if (!spinning) return;
    document.querySelectorAll(".wex-chip-scroll .chip-on").forEach((el) =>
      el.scrollIntoView({ inline: "center", block: "nearest" })
    );
  }, [spinning, country, domain]);

  // Draw a card. A 404 means the filter pool is empty — no point retrying.
  // Any other failure (Render cold start, flaky network) is retried twice
  // before giving up, so transient errors rarely reach the user.
  const draw = useCallback(
    async (c: string, k: string, d: string): Promise<RandomCard | "empty" | "server"> => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await getRandomExpression(uiLang, c, k, d);
        } catch (e) {
          if (e instanceof Error && e.message === "empty-pool") return "empty";
          if (attempt >= 2) return "server";
          await sleep(600 * (attempt + 1));
        }
      }
    },
    [uiLang],
  );

  const rollWith = useCallback(async (c: string, k: string, d: string) => {
    if (drawing.current) return;
    drawing.current = true;
    setRolling(true);
    setError("");
    const card = await draw(c, k, d);
    drawing.current = false;
    setRolling(false);
    if (card === "empty" || card === "server") { setError(card); return; }
    setHistory([card]);
    setPos(0);
    setFlipped(false);
    setPhase("play");
  }, [draw]);

  const roll = useCallback(() => rollWith(country, kind, domain), [rollWith, country, kind, domain]);

  // "Surprise me": spin the three filters like slot-machine reels
  // (fast at first, slowing down), settle on a random combo, then roll.
  const surprise = useCallback(async () => {
    if (drawing.current || spinning) return;
    setSpinning(true);
    const countryOptions = ["", ...countries.map((c) => c.code)];
    const kindOptions = ["", ...KINDS];
    const domainOptions = ["", ...EDITORIAL_DOMAINS.map((d) => d.slug)];
    let c = "", k = "", d = "";
    for (const ms of [60, 70, 85, 105, 130, 165, 210, 270, 340]) {
      c = pickRandom(countryOptions);
      k = pickRandom(kindOptions);
      d = pickRandom(domainOptions);
      setCountry(c);
      setKind(k);
      setDomain(d);
      await sleep(ms);
    }
    // The settled combo can be empty (e.g. Japanese locutions about money):
    // nudge the reels again until the pool has at least one card.
    for (let tries = 0; tries < 8; tries++) {
      const n = await getRandomCount(c, k, d).catch(() => 0);
      if (n > 0) break;
      c = pickRandom(countryOptions);
      k = pickRandom(kindOptions);
      d = pickRandom(domainOptions);
      setCountry(c);
      setKind(k);
      setDomain(d);
      await sleep(140);
    }
    setSpinning(false);
    await rollWith(c, k, d);
  }, [countries, spinning, rollWith]);

  // Swap animation: hide card content briefly while it changes
  const goTo = useCallback((newPos: number, newCard?: RandomCard) => {
    setSwapping(true);
    setFlipped(false);
    // Wait for the un-flip before swapping content, so the back never flashes
    setTimeout(() => {
      if (newCard) setHistory((h) => [...h, newCard]);
      setPos(newPos);
      setSwapping(false);
    }, 180);
  }, []);

  const next = useCallback(async () => {
    if (drawing.current) return;
    if (pos < history.length - 1) { goTo(pos + 1); return; }
    drawing.current = true;
    const card = await draw(country, kind, domain);
    drawing.current = false;
    if (typeof card !== "string") goTo(pos + 1, card);
  }, [pos, history.length, draw, country, kind, domain, goTo]);

  const prev = useCallback(() => {
    if (pos > 0) goTo(pos - 1);
  }, [pos, goTo]);

  // Keyboard navigation in play phase
  useEffect(() => {
    if (phase !== "play") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, next, prev]);

  // Swipe navigation (same thresholds as ExpressionFloatingNav)
  useEffect(() => {
    if (phase !== "play") return;
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (Math.abs(dx) > 60 && dy < 40) {
        if (dx < 0) next(); else prev();
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [phase, next, prev]);

  const current = history[pos];
  const countryCode = current ? (current.country || current.language) : "";
  const activeDomain = domain ? EDITORIAL_DOMAINS.find((d) => d.slug === domain) : undefined;
  const filterChip = [
    country ? `${FLAG[country] ?? "🌍"} ${COUNTRY_NAME[country] ?? country}` : `🌍 ${t.allCountries}`,
    kind ? `${KIND_EMOJI[kind]} ${getTypeLabel(kind, uiLang)}` : `✨ ${t.allKinds}`,
    ...(activeDomain ? [`${activeDomain.emoji} ${activeDomain.labels[uiLang] ?? activeDomain.slug}`] : []),
  ].join(" · ");

  // Front-face hints: the expression's tags rendered as emoji tiles (deduped)
  const hintIcons = current
    ? Array.from(new Set(current.tags.map((tg) => tagIcon(tg)).filter(Boolean))).slice(0, 4)
    : [];

  const domainRows = [EDITORIAL_DOMAINS.slice(0, 8), EDITORIAL_DOMAINS.slice(8)];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 76 }}>

        {phase === "entry" && (
          <section style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "2.5rem 1.5rem 1.25rem",
            maxWidth: 440,
            margin: "0 auto",
            width: "100%",
          }}>
            <button
              onClick={roll}
              aria-label={t.rollBtn}
              className={rolling || spinning ? "wex-dice-rolling" : "wex-dice-idle"}
              style={{ background: "none", border: "none", fontSize: 68, lineHeight: 1, cursor: "pointer", padding: 0, alignSelf: "center" }}
            >
              🎲
            </button>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 29, fontWeight: 700, margin: "12px 0 5px", color: "var(--ink)", textAlign: "center" }}>
              {t.title}
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, marginBottom: 22, textAlign: "center" }}>
              {t.subtitle}
            </p>

            {/* Country chips */}
            <div style={filterLabelStyle}>🌍 {t.countryLabel}</div>
            <div className="wex-chip-scroll">
              <button
                onClick={() => setCountry("")}
                className={country === "" ? "chip-on" : undefined}
                style={{ ...countryChipStyle, ...(country === "" ? chipSelected : {}) }}
              >
                <span style={{ fontSize: 22, lineHeight: 1.2 }}>🌍</span>
                <span style={countryChipName}>{t.allCountries}</span>
              </button>
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCountry(country === c.code ? "" : c.code)}
                  className={country === c.code ? "chip-on" : undefined}
                  style={{ ...countryChipStyle, ...(country === c.code ? chipSelected : {}) }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1.2 }}>{FLAG[c.code] ?? "🌍"}</span>
                  <span style={countryChipName}>{COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Kind tiles */}
            <div style={filterLabelStyle}>✨ {t.kindLabel}</div>
            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={() => setKind("")}
                style={{ ...kindTileStyle, ...(kind === "" ? chipSelected : {}) }}
              >
                <span style={{ fontSize: 18, display: "block" }}>✨</span>
                <span style={kindTileText}>{t.allKinds}</span>
              </button>
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(kind === k ? "" : k)}
                  style={{ ...kindTileStyle, ...(kind === k ? chipSelected : {}) }}
                >
                  <span style={{ fontSize: 18, display: "block" }}>{KIND_EMOJI[k]}</span>
                  <span style={kindTileText}>{getTypeLabel(k, uiLang)}</span>
                </button>
              ))}
            </div>

            {/* Domain pills — two scrollable rows over the editorial gradients */}
            <div style={filterLabelStyle}>🎨 {t.domainLabel}</div>
            {domainRows.map((row, i) => (
              <div key={i} className="wex-chip-scroll" style={i === 1 ? { marginTop: 7 } : undefined}>
                {row.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => setDomain(domain === d.slug ? "" : d.slug)}
                    className={domain === d.slug ? "chip-on" : undefined}
                    style={{
                      ...domainPillStyle,
                      background: d.bg,
                      ...(domain === d.slug ? chipSelected : {}),
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{d.emoji}</span>
                    {d.labels[uiLang] ?? d.labels.en}
                  </button>
                ))}
              </div>
            ))}

            <button
              onClick={roll}
              disabled={rolling || spinning || poolCount === 0}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                color: "white",
                background: "var(--plum)",
                border: "none",
                borderRadius: 999,
                padding: "14px 28px",
                cursor: poolCount === 0 ? "default" : "pointer",
                opacity: poolCount === 0 ? 0.55 : 1,
                boxShadow: "0 4px 0 var(--plum-deep), var(--shadow-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                marginTop: 24,
              }}
            >
              🎲 {t.rollBtn}
              {poolCount !== null && (
                <span style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 11.5,
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  padding: "3px 9px",
                }}>
                  {poolCount.toLocaleString(uiLang)} {t.cards}
                </span>
              )}
            </button>

            <button
              onClick={surprise}
              disabled={rolling || spinning}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--plum)",
                background: "none",
                border: "1.5px dashed var(--plum-soft)",
                borderRadius: 999,
                padding: "9px 22px",
                cursor: "pointer",
                marginTop: 12,
                alignSelf: "center",
              }}
            >
              ✨ {t.surpriseBtn}
            </button>

            {error && (
              <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--terra, #b4552d)", textAlign: "center" }}>
                {error === "server" ? t.serverError : t.empty}
              </p>
            )}
          </section>
        )}

        {phase === "play" && current && (
          <>
            {/* Top bar: active filters (tap to change) + card counter */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              // Right padding clears the fixed GlobalHeader (heart + lang switcher)
              padding: "12px 118px 12px 14px",
              borderBottom: "1px solid var(--paper-edge)",
              background: "var(--paper)",
              zIndex: 3,
            }}>
              <span aria-hidden="true">🎲</span>
              <button
                onClick={() => setPhase("entry")}
                style={{
                  background: "var(--plum-bg)",
                  color: "var(--plum-deep)",
                  border: "none",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {filterChip}
              </button>
              {/* Counter sits next to the chip — the far right belongs to the
                  fixed GlobalHeader (lang switcher / heart) on every viewport */}
              <span style={{ color: "var(--ink-faint)", fontSize: 12.5, flexShrink: 0 }}>
                {t.card} {pos + 1}
              </span>
            </div>

            {/* Card zone with country-tinted background */}
            <div style={{
              flex: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              overflow: "hidden",
              padding: "20px 24px",
            }}>
              {/* Tint layer: the country flag gradient, softened over the paper */}
              <div aria-hidden="true" style={{
                position: "absolute",
                inset: 0,
                background: COUNTRY_GRADIENT[countryCode] ?? "var(--paper-deep)",
                opacity: 0.13,
                transition: "opacity 0.4s",
                pointerEvents: "none",
              }} />

              <div
                className={`wex-flip-wrap${flipped ? " flipped" : ""}`}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                aria-label={flipped ? current.expression : t.tapHint}
                style={{ width: "min(280px, 100%)", height: 400, opacity: swapping ? 0 : 1, transition: "opacity 0.15s" }}
              >
                <div className="wex-flip-inner">
                  {/* Front: the expression + emoji hints — guess the meaning */}
                  <div className="wex-flip-face" style={{ background: "rgba(255,255,255,0.94)", padding: "26px 22px" }}>
                    <span style={{ fontSize: 42, marginBottom: 9 }} aria-hidden="true">{FLAG[countryCode] ?? "🌍"}</span>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", justifyContent: "center" }}>
                      {getTypeLabel(current.type, uiLang) && (
                        <span style={badgeStyle}>{getTypeLabel(current.type, uiLang)}</span>
                      )}
                      <span style={{ ...badgeStyle, background: "var(--paper-deep)", color: "var(--ink-soft)" }}>
                        {COUNTRY_NAME[countryCode] ?? countryCode.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, color: "var(--ink)" }}>
                      {current.expression}
                    </div>
                    {current.literal && (
                      <div style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-softer)" }}>
                        “{current.literal}”
                      </div>
                    )}
                    {hintIcons.length > 0 && (
                      <>
                        <div style={{ display: "flex", gap: 9, justifyContent: "center", marginTop: 16 }}>
                          {hintIcons.map((icon) => (
                            <span key={icon} style={hintTileStyle} aria-hidden="true">{icon}</span>
                          ))}
                        </div>
                        <span style={{ ...labelStyle, marginTop: 7 }}>{t.hintsLabel}</span>
                      </>
                    )}
                    <span style={{ position: "absolute", bottom: 13, fontSize: 11, color: "var(--ink-faint)" }}>
                      👆 {t.tapHint}
                    </span>
                  </div>
                  {/* Back: meaning + example + clickable tags + link to the full card */}
                  <div className="wex-flip-face back" style={{ background: "rgba(255,255,255,0.96)", padding: "24px 22px" }}>
                    <span style={labelStyle}>{t.meaningLabel}</span>
                    {/* Long meanings (proverbs) are clamped so the card never overflows;
                        the full-card button below gives access to the whole text */}
                    <p style={{ ...clampStyle(8), fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-soft)", margin: "7px 0 12px" }}>
                      {current.meaning}
                    </p>
                    {current.example && (
                      <>
                        <span style={labelStyle}>{t.exampleLabel}</span>
                        <p style={{ ...clampStyle(2), fontSize: 12, lineHeight: 1.5, color: "var(--ink-softer)", fontStyle: "italic", margin: "6px 0 0" }}>
                          {current.example}
                        </p>
                      </>
                    )}
                    {current.tags.length > 0 && (
                      /* maxHeight keeps the chips on a single row: overflowing chips
                         wrap to a second row that is clipped away, so the height
                         budget of the 400px card always holds */
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 13, maxHeight: 26, overflow: "hidden", flexShrink: 0 }}>
                        {current.tags.slice(0, 5).map((tg) => (
                          <Link
                            key={tg}
                            href={`/#q=${encodeURIComponent(tg)}`}
                            onClick={(e) => e.stopPropagation()}
                            style={tagChipStyle}
                          >
                            {tagIcon(tg) && <span>{tagIcon(tg)}</span>}
                            {tg}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/expression/${current.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 13,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "white",
                        background: "var(--plum)",
                        borderRadius: 999,
                        padding: "7px 16px",
                        textDecoration: "none",
                        boxShadow: "0 2px 0 var(--plum-deep)",
                        flexShrink: 0,
                      }}
                    >
                      {t.fullCard}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar: review (ghost) + new card (hero) */}
            <div style={{
              display: "flex",
              gap: 10,
              padding: "0 18px 14px",
              maxWidth: 400,
              margin: "0 auto",
              width: "100%",
              zIndex: 5,
            }}>
              <button
                onClick={prev}
                disabled={pos === 0}
                aria-label={t.reviewBtn}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  background: "white",
                  border: "1.5px solid var(--paper-edge)",
                  borderRadius: 18,
                  padding: "8px 6px",
                  cursor: pos === 0 ? "default" : "pointer",
                  opacity: pos === 0 ? 0.4 : 1,
                  boxShadow: "var(--shadow-card)",
                  color: "var(--ink-soft)",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">↩</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-body)" }}>{t.reviewBtn}</span>
              </button>
              <button
                onClick={next}
                aria-label={t.newCardBtn}
                style={{
                  flex: 2.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "var(--font-display)",
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "white",
                  background: "var(--plum)",
                  border: "none",
                  borderRadius: 18,
                  padding: 12,
                  cursor: "pointer",
                  boxShadow: "0 4px 0 var(--plum-deep), var(--shadow-card)",
                }}
              >
                <span className="wex-dice-idle" style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">🎲</span>
                {t.newCardBtn}
              </button>
            </div>
          </>
        )}

        {/* Mobile back link on entry phase */}
        {phase === "entry" && (
          <button
            className="wex-mobile-header"
            onClick={() => router.push("/")}
            style={{
              position: "absolute",
              top: 12,
              left: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink-softer)",
              fontFamily: "var(--font-body)",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            ← {t.back}
          </button>
        )}
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

const filterLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-softer)",
  margin: "14px 0 7px",
};

const countryChipStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  padding: "8px 10px 6px",
  cursor: "pointer",
  minWidth: 60,
  fontFamily: "var(--font-body)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const countryChipName: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  whiteSpace: "nowrap",
};

const kindTileStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  background: "white",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  padding: "8px 4px 6px",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  transition: "transform 0.12s, box-shadow 0.12s",
};

const kindTileText: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
};

const domainPillStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1.5px solid transparent",
  borderRadius: 999,
  padding: "7px 13px 7px 9px",
  cursor: "pointer",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#3f3428",
  fontFamily: "var(--font-body)",
  whiteSpace: "nowrap",
  transition: "transform 0.12s, box-shadow 0.12s",
};

// Selected state shared by all filter chips: plum ring + slight pop
const chipSelected: React.CSSProperties = {
  boxShadow: "0 0 0 2px var(--plum)",
  transform: "scale(1.04)",
};

const hintTileStyle: React.CSSProperties = {
  fontSize: 21,
  background: "var(--paper)",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 12,
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--shadow-card)",
};

const tagChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--ink-soft)",
  background: "var(--paper)",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 999,
  padding: "3px 10px 3px 7px",
  textDecoration: "none",
  fontFamily: "var(--font-body)",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderRadius: 999,
  padding: "3px 10px",
  background: "var(--plum-bg)",
  color: "var(--plum-deep)",
};

// Cut text cleanly after n lines (CSS line-clamp) — mockup B "Résumé + Lire la suite".
// flexShrink 0 is load-bearing: the back face is a fixed-height flex column, and
// without it a crowded card shrinks the clamped block a few px, slicing the last
// line in half instead of ending on the ellipsis.
const clampStyle = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  flexShrink: 0,
});

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--ink-faint)",
};

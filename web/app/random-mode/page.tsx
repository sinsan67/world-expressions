"use client";

/**
 * Random mode — draw random expressions as flip cards.
 *
 * Two phases:
 *  - "entry": dice hero + two filters (country, kind) + roll button
 *  - "play":  flip card (front = expression, back = meaning) over a
 *             country-tinted background, with ‹ › history navigation
 *             (‹ rewinds to cards already seen, › draws a new one).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRandomExpression, getCountries, Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { useUILangContext } from "@/lib/UILangContext";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";

type RandomCard = Expression & { meaning_locale: string; literal: string | null };

const KINDS = ["idiom", "proverb", "locution"] as const;

const T: Record<string, {
  title: string;
  subtitle: string;
  countryLabel: string;
  kindLabel: string;
  allCountries: string;
  allKinds: string;
  rollBtn: string;
  tapHint: string;
  meaningLabel: string;
  exampleLabel: string;
  fullCard: string;
  card: string;
  navHint: string;
  prevAria: string;
  nextAria: string;
  back: string;
  empty: string;
}> = {
  fr: {
    title: "Au hasard !",
    subtitle: "Laisse le hasard te faire voyager. Filtre si tu veux — ou lance le dé tel quel.",
    countryLabel: "Pays",
    kindLabel: "Type d'expression",
    allCountries: "Tous les pays",
    allKinds: "Tous les types",
    rollBtn: "Lancer le dé !",
    tapHint: "Tape pour révéler le sens",
    meaningLabel: "Signification",
    exampleLabel: "Exemple",
    fullCard: "Voir la fiche complète →",
    card: "carte",
    navHint: "‹ revient en arrière · › tire une nouvelle carte",
    prevAria: "Carte précédente",
    nextAria: "Nouvelle carte",
    back: "Retour",
    empty: "Aucune expression pour ces filtres — essaie une autre combinaison.",
  },
  en: {
    title: "Random mode",
    subtitle: "Let chance take you places. Filter if you like — or just roll the dice.",
    countryLabel: "Country",
    kindLabel: "Expression type",
    allCountries: "All countries",
    allKinds: "All types",
    rollBtn: "Roll the dice!",
    tapHint: "Tap to reveal the meaning",
    meaningLabel: "Meaning",
    exampleLabel: "Example",
    fullCard: "See the full card →",
    card: "card",
    navHint: "‹ goes back · › draws a new card",
    prevAria: "Previous card",
    nextAria: "New card",
    back: "Back",
    empty: "No expression for these filters — try another combination.",
  },
  es: {
    title: "Modo aleatorio",
    subtitle: "Deja que el azar te lleve de viaje. Filtra si quieres — o lanza el dado tal cual.",
    countryLabel: "País",
    kindLabel: "Tipo de expresión",
    allCountries: "Todos los países",
    allKinds: "Todos los tipos",
    rollBtn: "¡Lanza el dado!",
    tapHint: "Toca para revelar el significado",
    meaningLabel: "Significado",
    exampleLabel: "Ejemplo",
    fullCard: "Ver la ficha completa →",
    card: "carta",
    navHint: "‹ vuelve atrás · › saca una nueva carta",
    prevAria: "Carta anterior",
    nextAria: "Nueva carta",
    back: "Volver",
    empty: "Ninguna expresión con estos filtros — prueba otra combinación.",
  },
  it: {
    title: "Modalità casuale",
    subtitle: "Lascia che il caso ti faccia viaggiare. Filtra se vuoi — o lancia il dado così com'è.",
    countryLabel: "Paese",
    kindLabel: "Tipo di espressione",
    allCountries: "Tutti i paesi",
    allKinds: "Tutti i tipi",
    rollBtn: "Lancia il dado!",
    tapHint: "Tocca per svelare il significato",
    meaningLabel: "Significato",
    exampleLabel: "Esempio",
    fullCard: "Vedi la scheda completa →",
    card: "carta",
    navHint: "‹ torna indietro · › pesca una nuova carta",
    prevAria: "Carta precedente",
    nextAria: "Nuova carta",
    back: "Indietro",
    empty: "Nessuna espressione con questi filtri — prova un'altra combinazione.",
  },
  tr: {
    title: "Rastgele mod",
    subtitle: "Bırak şans seni gezdirsin. İstersen filtrele — ya da zarı olduğu gibi at.",
    countryLabel: "Ülke",
    kindLabel: "İfade türü",
    allCountries: "Tüm ülkeler",
    allKinds: "Tüm türler",
    rollBtn: "Zarı at!",
    tapHint: "Anlamı görmek için dokun",
    meaningLabel: "Anlam",
    exampleLabel: "Örnek",
    fullCard: "Tam kartı gör →",
    card: "kart",
    navHint: "‹ geri döner · › yeni kart çeker",
    prevAria: "Önceki kart",
    nextAria: "Yeni kart",
    back: "Geri",
    empty: "Bu filtrelerle ifade bulunamadı — başka bir kombinasyon dene.",
  },
  de: {
    title: "Zufallsmodus",
    subtitle: "Lass den Zufall dich auf Reisen schicken. Filtere, wenn du magst — oder würfle einfach.",
    countryLabel: "Land",
    kindLabel: "Ausdruckstyp",
    allCountries: "Alle Länder",
    allKinds: "Alle Typen",
    rollBtn: "Würfeln!",
    tapHint: "Tippe, um die Bedeutung aufzudecken",
    meaningLabel: "Bedeutung",
    exampleLabel: "Beispiel",
    fullCard: "Zur vollständigen Karte →",
    card: "Karte",
    navHint: "‹ geht zurück · › zieht eine neue Karte",
    prevAria: "Vorherige Karte",
    nextAria: "Neue Karte",
    back: "Zurück",
    empty: "Kein Ausdruck für diese Filter — probiere eine andere Kombination.",
  },
  ja: {
    title: "ランダムモード",
    subtitle: "偶然に旅をまかせよう。絞り込んでも、そのままサイコロを振ってもOK。",
    countryLabel: "国",
    kindLabel: "表現の種類",
    allCountries: "すべての国",
    allKinds: "すべての種類",
    rollBtn: "サイコロを振る！",
    tapHint: "タップして意味を見る",
    meaningLabel: "意味",
    exampleLabel: "例文",
    fullCard: "詳細カードを見る →",
    card: "カード",
    navHint: "‹ 前に戻る · › 新しいカードを引く",
    prevAria: "前のカード",
    nextAria: "新しいカード",
    back: "戻る",
    empty: "この条件に合う表現がありません — 別の組み合わせを試してください。",
  },
};

export default function RandomModePage() {
  const router = useRouter();
  const { uiLang } = useUILangContext();
  const t = T[uiLang] ?? T.en;

  const [phase, setPhase] = useState<"entry" | "play">("entry");
  const [country, setCountry] = useState("");
  const [kind, setKind] = useState("");
  const [countries, setCountries] = useState<{ code: string; count: number }[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<RandomCard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  const draw = useCallback(async (): Promise<RandomCard | null> => {
    try {
      return await getRandomExpression(uiLang, country, kind);
    } catch {
      return null;
    }
  }, [uiLang, country, kind]);

  const roll = useCallback(async () => {
    if (drawing.current) return;
    drawing.current = true;
    setRolling(true);
    setError(false);
    const card = await draw();
    drawing.current = false;
    setRolling(false);
    if (!card) { setError(true); return; }
    setHistory([card]);
    setPos(0);
    setFlipped(false);
    setPhase("play");
  }, [draw]);

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
    const card = await draw();
    drawing.current = false;
    if (card) goTo(pos + 1, card);
  }, [pos, history.length, draw, goTo]);

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
  const filterChip = `${country ? `${FLAG[country] ?? "🌍"} ${COUNTRY_NAME[country] ?? country}` : `🌍 ${t.allCountries}`} · ${kind ? getTypeLabel(kind, uiLang) : `✨ ${t.allKinds}`}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 76 }}>

        {phase === "entry" && (
          <section style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2.5rem 1.75rem",
            textAlign: "center",
            maxWidth: 420,
            margin: "0 auto",
            width: "100%",
          }}>
            <button
              onClick={roll}
              aria-label={t.rollBtn}
              className={rolling ? "wex-dice-rolling" : undefined}
              style={{ background: "none", border: "none", fontSize: 76, lineHeight: 1, cursor: "pointer", padding: 0 }}
            >
              🎲
            </button>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, margin: "14px 0 6px", color: "var(--ink)" }}>
              {t.title}
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.5, marginBottom: 30 }}>
              {t.subtitle}
            </p>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, marginBottom: 30, textAlign: "left" }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-softer)", marginBottom: 6 }}>
                  {t.countryLabel}
                </span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">🌍 {t.allCountries}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {FLAG[c.code] ?? "🌍"} {COUNTRY_NAME[c.code] ?? c.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-softer)", marginBottom: 6 }}>
                  {t.kindLabel}
                </span>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">✨ {t.allKinds}</option>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{getTypeLabel(k, uiLang)}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={roll}
              disabled={rolling}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "white",
                background: "var(--plum)",
                border: "none",
                borderRadius: 999,
                padding: "15px 36px",
                cursor: "pointer",
                boxShadow: "0 4px 0 var(--plum-deep), var(--shadow-card)",
              }}
            >
              🎲 {t.rollBtn}
            </button>
            {error && (
              <p style={{ marginTop: 16, fontSize: 13.5, color: "var(--terra, #b4552d)" }}>{t.empty}</p>
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
              padding: "20px 58px",
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

              <button
                onClick={prev}
                disabled={pos === 0}
                aria-label={t.prevAria}
                style={{ ...floatBtnStyle, left: 8, opacity: pos === 0 ? 0.3 : 1, cursor: pos === 0 ? "default" : "pointer" }}
              >
                ‹
              </button>

              <div
                className={`wex-flip-wrap${flipped ? " flipped" : ""}`}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                aria-label={flipped ? current.expression : t.tapHint}
                style={{ width: "min(270px, 100%)", height: 380, opacity: swapping ? 0 : 1, transition: "opacity 0.15s" }}
              >
                <div className="wex-flip-inner">
                  {/* Front: the expression — guess the meaning */}
                  <div className="wex-flip-face" style={{ background: "rgba(255,255,255,0.94)", padding: "26px 22px" }}>
                    <span style={{ fontSize: 44, marginBottom: 10 }} aria-hidden="true">{FLAG[countryCode] ?? "🌍"}</span>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", justifyContent: "center" }}>
                      {getTypeLabel(current.type, uiLang) && (
                        <span style={badgeStyle}>{getTypeLabel(current.type, uiLang)}</span>
                      )}
                      <span style={{ ...badgeStyle, background: "var(--paper-deep)", color: "var(--ink-soft)" }}>
                        {COUNTRY_NAME[countryCode] ?? countryCode.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, color: "var(--ink)" }}>
                      {current.expression}
                    </div>
                    {current.literal && (
                      <div style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "var(--ink-softer)" }}>
                        “{current.literal}”
                      </div>
                    )}
                    <span style={{ position: "absolute", bottom: 13, fontSize: 11, color: "var(--ink-faint)" }}>
                      👆 {t.tapHint}
                    </span>
                  </div>
                  {/* Back: meaning + example + link to the full card */}
                  <div className="wex-flip-face back" style={{ background: "rgba(255,255,255,0.96)", padding: "26px 22px" }}>
                    <span style={labelStyle}>{t.meaningLabel}</span>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", margin: "8px 0 14px" }}>
                      {current.meaning}
                    </p>
                    {current.example && (
                      <>
                        <span style={labelStyle}>{t.exampleLabel}</span>
                        <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-softer)", fontStyle: "italic", margin: "6px 0 0" }}>
                          {current.example}
                        </p>
                      </>
                    )}
                    <Link
                      href={`/expression/${current.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginTop: 16, fontSize: 12.5, color: "var(--plum)", fontWeight: 600 }}
                    >
                      {t.fullCard}
                    </Link>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 11.5, color: "var(--ink-soft)", opacity: 0.75, textAlign: "center", zIndex: 2, margin: 0 }}>
                {t.navHint}
              </p>

              <button
                onClick={next}
                aria-label={t.nextAria}
                style={{ ...floatBtnStyle, right: 8 }}
              >
                ›
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

const selectStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  padding: "12px 14px",
  border: "1.5px solid var(--paper-edge)",
  borderRadius: 14,
  background: "white",
  color: "var(--ink)",
  cursor: "pointer",
};

const floatBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "1px solid var(--paper-edge)",
  background: "var(--paper)",
  boxShadow: "var(--shadow-card)",
  fontSize: 23,
  color: "var(--ink)",
  cursor: "pointer",
  zIndex: 5,
  lineHeight: 1,
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

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--ink-faint)",
};

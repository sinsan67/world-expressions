"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExpression,
  getAllTagNames,
  searchByConcept,
  Expression,
  ConceptEquivalent,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { getTypeLabel } from "@/lib/typeLabels";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { cap } from "@/lib/utils";
import CountryPhotoBackdrop from "@/components/home/CountryPhotoBackdrop";
import Eyebrow from "@/components/home/Eyebrow";
import { recordView } from "@/lib/carnet";
import { useFavorite } from "@/lib/useFavorite";
import { useAudio } from "@/lib/useAudio";
import { Heart, Dice5, Search, Volume2, VolumeX } from "lucide-react";
import SearchOverlay from "@/components/SearchOverlay";
import { useUILangContext } from "@/lib/UILangContext";
import { FAV_LABEL, CONFIDENCE_LABEL } from "@/lib/uiLabels";
import ExpressionFloatingNav from "@/components/ui/ExpressionFloatingNav";
import BottomNav from "@/components/home/BottomNav";
import Sidebar from "@/components/home/Sidebar";

type UILang = "fr" | "en" | "es" | "tr" | "it" | "de" | "ja";

const T: Record<UILang, {
  wordForWord: string;
  equivalent: string;
  original: string;
  origin: string;
  example: string;
  meaning: string;
  source: string;
  tags: string;
  related: string;
  randomBtn: string;
  back: string;
  searchBack: string;
  sameIdea: string;
  elsewhereInTheWorld: string;
  listen: string;
  noVoice: string;
  notFound: string;
  register: Record<string, string>;
}> = {
  fr: {
    notFound: "Expression introuvable.",
    wordForWord: "Mot à mot",
    equivalent: "Équivalent",
    sameIdea: "La même idée",
    elsewhereInTheWorld: "...ailleurs dans le monde",
    original: "Version originale",
    origin: "Origine",
    example: "Exemple",
    meaning: "Signification",
    source: "Source",
    tags: "Thèmes",
    related: "Dans le même univers",
    randomBtn: "Expression au hasard",
    back: "Retour",
    searchBack: "Résultats pour",
    listen: "Écouter",
    noVoice: "Voix non disponible sur cet appareil",
    register: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" },
  },
  en: {
    notFound: "Expression not found.",
    wordForWord: "Word for word",
    equivalent: "Equivalent",
    original: "Original version",
    origin: "Origin",
    example: "Example",
    meaning: "Meaning",
    source: "Source",
    tags: "Themes",
    related: "More like this",
    randomBtn: "Random expression",
    back: "Back",
    searchBack: "Results for",
    sameIdea: "The same idea",
    elsewhereInTheWorld: "...around the world",
    listen: "Listen",
    noVoice: "Voice not available on this device",
    register: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" },
  },
  es: {
    notFound: "Expresión no encontrada.",
    wordForWord: "Literalmente",
    equivalent: "Equivalente",
    original: "Versión original",
    origin: "Origen",
    example: "Ejemplo",
    meaning: "Significado",
    source: "Fuente",
    tags: "Temas",
    related: "En el mismo universo",
    randomBtn: "Expresión al azar",
    back: "Volver",
    searchBack: "Resultados de",
    sameIdea: "La misma idea",
    elsewhereInTheWorld: "...en todo el mundo",
    listen: "Escuchar",
    noVoice: "Voz no disponible en este dispositivo",
    register: { standard: "estándar", informal: "informal", slang: "argot", vulgar: "vulgar", formal: "formal" },
  },
  tr: {
    notFound: "İfade bulunamadı.",
    wordForWord: "Kelimesi kelimesine",
    equivalent: "Karşılığı",
    original: "Orijinal versiyon",
    origin: "Köken",
    example: "Örnek",
    meaning: "Anlam",
    source: "Kaynak",
    tags: "Temalar",
    related: "Benzer ifadeler",
    randomBtn: "Rastgele ifade",
    back: "Geri",
    searchBack: "Sonuçlar:",
    sameIdea: "Aynı fikir",
    elsewhereInTheWorld: "...dünyada",
    listen: "Dinle",
    noVoice: "Bu cihazda ses mevcut değil",
    register: { standard: "standart", informal: "günlük", slang: "argo", vulgar: "kaba", formal: "resmi" },
  },
  it: {
    notFound: "Espressione non trovata.",
    wordForWord: "Letteralmente",
    equivalent: "Equivalente",
    original: "Versione originale",
    origin: "Origine",
    example: "Esempio",
    meaning: "Significato",
    source: "Fonte",
    tags: "Temi",
    related: "Nello stesso universo",
    randomBtn: "Espressione casuale",
    back: "Indietro",
    searchBack: "Risultati per",
    sameIdea: "La stessa idea",
    elsewhereInTheWorld: "...nel mondo",
    listen: "Ascolta",
    noVoice: "Voce non disponibile su questo dispositivo",
    register: { standard: "standard", informal: "informale", slang: "slang", vulgar: "volgare", formal: "formale" },
  },
  de: {
    notFound: "Ausdruck nicht gefunden.",
    wordForWord: "Wörtlich",
    equivalent: "Entsprechung",
    original: "Originalversion",
    origin: "Herkunft",
    example: "Beispiel",
    meaning: "Bedeutung",
    source: "Quelle",
    tags: "Themen",
    related: "Im gleichen Universum",
    randomBtn: "Zufälliger Ausdruck",
    back: "Zurück",
    searchBack: "Ergebnisse für",
    sameIdea: "Dieselbe Idee",
    elsewhereInTheWorld: "...auf der Welt",
    listen: "Anhören",
    noVoice: "Stimme auf diesem Gerät nicht verfügbar",
    register: { standard: "standard", informal: "umgangssprachlich", slang: "Slang", vulgar: "vulgär", formal: "formell" },
  },
  ja: {
    notFound: "表現が見つかりません。",
    wordForWord: "逐語訳",
    equivalent: "同義表現",
    original: "原文",
    origin: "由来",
    example: "例",
    meaning: "意味",
    source: "出典",
    tags: "テーマ",
    related: "同じ世界で",
    randomBtn: "ランダムな表現",
    back: "戻る",
    searchBack: "検索結果：",
    sameIdea: "同じ考え",
    elsewhereInTheWorld: "...世界の各地で",
    listen: "聴く",
    noVoice: "このデバイスでは音声を利用できません",
    register: { standard: "普通", informal: "くだけた", slang: "俗語", vulgar: "卑語", formal: "丁寧" },
  },
};

const LANGUAGE_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", it: "Italiano", tr: "Türkçe", de: "Deutsch", ja: "日本語",
};

function confidenceBadge(score: number, lang: string) {
  const labels = CONFIDENCE_LABEL[lang] ?? CONFIDENCE_LABEL.en;
  if (score >= 1.0)  return { label: labels.mirror,     bg: "#ede8f5", color: "#6b4d8f", border: "#c9b8e8" };
  if (score >= 0.90) return { label: labels.equivalent, bg: "#e8f3e8", color: "#2d7a3a", border: "#a8d4a8" };
  return                    { label: labels.vein,       bg: "#fef5e7", color: "#92400e", border: "#f0d090" };
}

function ConceptCard({ eq, lang, onNavigate }: { eq: ConceptEquivalent; lang: string; onNavigate: (url: string) => void }) {
  const badge = confidenceBadge(eq.concept_confidence ?? 0.65, lang);
  return (
    <div
      onClick={() => onNavigate(`/expression/${eq.id}`)}
      style={{
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 150ms ease, border-color 150ms ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-card)";
        el.style.borderColor = "var(--terra-soft)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--paper-edge)";
      }}
    >
      <div style={{ height: 3, background: "var(--terra)" }} />
      <div style={{ padding: "0.75rem 1rem" }}>
        <span style={{
          position: "absolute", top: "0.6rem", right: "0.6rem",
          fontSize: 10, fontWeight: 700, padding: "2px 7px",
          borderRadius: 10, border: `1px solid ${badge.border}`,
          background: badge.bg, color: badge.color,
          fontFamily: "var(--font-body)", lineHeight: 1.4,
        }}>
          {badge.label}
        </span>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: "0.4rem", fontFamily: "var(--font-body)" }}>
          <Link
            href={`/country/${eq.country || eq.language}`}
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: "none", color: "inherit" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            {FLAG[eq.country] || FLAG[eq.language] || ""}
          </Link>
          {" "}{LANGUAGE_NAME[eq.language] || eq.language.toUpperCase()}
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500, fontSize: 15, color: "var(--ink)", lineHeight: 1.25, marginBottom: eq.literal_fr && eq.language !== "fr" ? "0.35rem" : "0.4rem" }}>
          {eq.text}
        </p>
        {eq.literal_fr && eq.language !== "fr" && (
          <p style={{ fontSize: 12, color: "var(--ink-softer)", fontStyle: "italic", marginBottom: "0.35rem" }}>
            « {eq.literal_fr} »
          </p>
        )}
        {eq.meaning_fr && (
          <p style={{ fontSize: 12, color: "var(--ink-softer)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {eq.meaning_fr}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniCard({ expr, lang }: { expr: Expression; lang: string }) {
  return (
    <Link
      href={`/expression/${expr.id}?lang=${lang}`}
      style={{
        display: "block",
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        transition: "box-shadow 150ms ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ height: 3, background: "var(--terra)" }} />
      <div style={{ padding: "0.75rem" }}>
        <p style={{
          fontSize: 13,
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 500,
          color: "var(--ink)",
          lineHeight: 1.3,
          marginBottom: "0.3rem",
        }}>
          {FLAG[expr.country] || ""} {cap(expr.expression)}
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--ink-softer)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {expr.meaning}
        </p>
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "var(--ink-softer)",
      fontFamily: "var(--font-body)",
      marginBottom: "0.5rem",
    }}>
      {children}
    </p>
  );
}

function ExpressionPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uiLang } = useUILangContext();
  const lang = uiLang;

  const [expr, setExpr] = useState<Expression | null>(null);
  const [related, setRelated] = useState<Expression[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [fav, handleFav] = useFavorite(id);
  const [showSearch, setShowSearch] = useState(false);
  const { speaking, voiceAvailable, handleListen: handleSpeak } = useAudio(
    expr?.expression ?? "",
    expr?.language ?? ""
  );

  const prev = searchParams.get("prev") || null;
  const fromSearch = searchParams.get("from_search") || null;

  useEffect(() => {
    setExpr(null);
    setRelated([]);
    Promise.all([
      getExpression(id, lang),
      getAllTagNames(lang),
    ])
      .then(([exprData, tags]) => {
        setExpr(exprData);
        setTagNames(tags);
        recordView(id, exprData.country, exprData.language);
        if (exprData.tags.length > 0) {
          searchByConcept(exprData.tags.slice(0, 3), [], 5, 0, undefined, lang)
            .then((data) => {
              setRelated(data.results.filter((r) => r.id !== id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setError(true));
  }, [id, lang]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "var(--paper)" }}>
        <p style={{ color: "var(--terra)" }}>{(T[lang] ?? T.en).notFound}</p>
        <Link href="/" style={{ fontSize: 13, color: "var(--ink-faint)", textDecoration: "none" }}>← {(T[lang] ?? T.en).back}</Link>
      </div>
    );
  }

  if (!expr) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
        <div className="wex-skeleton" style={{
          width: 320, height: 200,
          background: "var(--paper-deep)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--paper-edge)",
        }} />
      </div>
    );
  }

  const t = T[lang];
  const translation = expr.translation ?? null;
  const translationActive = !!translation && lang !== expr.language;
  const effectiveLiteral = translation?.literal ?? (lang === "fr" && expr.language !== "fr" ? expr.literal_fr : null);

  const primaryMeaning = translation?.meaning ?? expr.meaning;
  const primaryOrigin = translation?.origin ?? expr.origin;
  const primaryExample = translation?.example ?? expr.example;

  const photo = `/images/${expr.country}.jpg`;
  const flag = FLAG[expr.country] || "";
  const countryName = COUNTRY_NAME[expr.country] || expr.country.toUpperCase();
  const langName = LANGUAGE_NAME[expr.language] || expr.language.toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={lang} />
      <div className="wex-main">

      {/* Sub-nav: Back + search + random */}
      <nav className="expr-sub-nav" style={{
        padding: "0.6rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--paper)",
        borderBottom: "1px solid var(--paper-edge)",
      }}>
        <div>
          {fromSearch ? (
            <Link
              href={`/#q=${encodeURIComponent(fromSearch)}`}
              style={{ fontSize: 13, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}
            >
              ← {t.searchBack} «&nbsp;{fromSearch}&nbsp;»
            </Link>
          ) : prev ? (
            <Link
              href={`/expression/${prev}?lang=${lang}`}
              style={{ fontSize: 13, color: "var(--ink-softer)", textDecoration: "none", fontFamily: "var(--font-body)" }}
            >
              ← {t.back}
            </Link>
          ) : (
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
              style={{
                fontSize: 13,
                color: "var(--ink-softer)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "var(--font-body)",
              }}
            >
              ← {t.back}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowSearch(true)}
            title="Search"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 4, transition: "color 120ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-faint)"; }}
          >
            <Search size={16} strokeWidth={1.5} />
          </button>
          <Link
            href={`/random?prev=${id}&lang=${lang}`}
            title={t.randomBtn}
            style={{ color: "var(--ink-faint)", textDecoration: "none", display: "flex", padding: 4, alignItems: "center", transition: "color 120ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-faint)"; }}
          >
            <Dice5 size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </nav>

      {/* Hero — country photo backdrop */}
      <CountryPhotoBackdrop photo={photo} fadeBottom>
        <div style={{ padding: "2rem 1.5rem 5rem", maxWidth: 720, margin: "0 auto" }}>
          <Eyebrow tone="on-photo">
            <Link
              href={`/country/${expr.country}`}
              style={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {flag} {countryName}
            </Link>
            {" · "}{langName}
            {expr.register && expr.register !== "standard" && (
              <> · <span style={{ textTransform: "none", letterSpacing: 0 }}>{t.register[expr.register] || expr.register}</span></>
            )}
          </Eyebrow>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: expr.expression.length > 100
              ? "clamp(22px, 4.5vw, 38px)"
              : expr.expression.length > 60
              ? "clamp(26px, 5vw, 44px)"
              : "clamp(28px, 6vw, 52px)",
            fontWeight: 500,
            color: "#fff",
            lineHeight: 1.15,
            marginTop: "0.75rem",
            marginBottom: 0,
            textShadow: "0 2px 12px rgba(28,20,16,0.4)",
          }}>
            {cap(expr.expression)}
          </h1>

          {/* Listen button */}
          <button
            onClick={voiceAvailable === false ? undefined : handleSpeak}
            title={voiceAvailable === false ? (t.noVoice ?? "Voice not available") : t.listen}
            disabled={voiceAvailable === false}
            style={{
              marginTop: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: speaking ? "var(--plum-soft)" : "var(--plum-bg)",
              border: "none",
              borderRadius: "var(--r-pill)",
              color: "var(--plum-deep)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              padding: "6px 14px",
              cursor: voiceAvailable === false ? "not-allowed" : "pointer",
              opacity: voiceAvailable === false ? 0.4 : 1,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => { if (voiceAvailable !== false) (e.currentTarget as HTMLElement).style.background = "var(--plum-soft)"; }}
            onMouseLeave={(e) => { if (voiceAvailable !== false) (e.currentTarget as HTMLElement).style.background = speaking ? "var(--plum-soft)" : "var(--plum-bg)"; }}
          >
            {speaking
              ? <VolumeX size={14} strokeWidth={1.5} />
              : <Volume2 size={14} strokeWidth={1.5} />}
            {t.listen}
          </button>

          {/* Literal translation on photo, in hand font */}
          {lang !== expr.language && effectiveLiteral && (
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: 22,
              color: "rgba(255,255,255,0.8)",
              marginTop: "0.5rem",
              lineHeight: 1.3,
            }}>
              « {effectiveLiteral} »
            </p>
          )}
        </div>
      </CountryPhotoBackdrop>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.25rem 6rem" }}>

        {/* Main content card */}
        <div style={{
          background: "var(--paper)",
          border: "1px solid var(--paper-edge)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-card)",
          padding: "1.75rem",
          marginTop: "-2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          position: "relative",
          zIndex: 1,
          animation: "fadeSlideUp 0.4s ease-out both",
        }}>

          {/* Favorite button — top-right of card */}
          <button
            onClick={handleFav}
            aria-label={fav ? (FAV_LABEL[lang] ?? FAV_LABEL.en).remove : (FAV_LABEL[lang] ?? FAV_LABEL.en).add}
            title={fav ? (FAV_LABEL[lang] ?? FAV_LABEL.en).remove : (FAV_LABEL[lang] ?? FAV_LABEL.en).add}
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              background: fav ? "var(--terra-soft, rgba(180,80,40,0.08))" : "var(--paper-tint)",
              border: `1.5px solid ${fav ? "var(--terra)" : "var(--paper-edge)"}`,
              borderRadius: "var(--r-pill)",
              cursor: "pointer",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              color: fav ? "var(--terra)" : "var(--ink-faint)",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <Heart size={16} strokeWidth={1.5} fill={fav ? "var(--terra)" : "none"} />
          </button>

          {/* Meaning */}
          <div>
            <SectionLabel>{t.meaning}</SectionLabel>
            <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.7 }}>{primaryMeaning}</p>
          </div>

          {/* Literal + idiomatic translation block */}
          {lang !== expr.language && (effectiveLiteral || translation?.idiomatic) && (
            <div style={{
              background: "var(--plum-bg)",
              borderRadius: "var(--r-md)",
              padding: "0.875rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}>
              {effectiveLiteral && (
                <p style={{ fontSize: 13, color: "var(--plum)", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600 }}>{t.wordForWord} : </span>
                  <em>« {effectiveLiteral} »</em>
                </p>
              )}
              {translation?.idiomatic && (
                <p style={{ fontSize: 13, color: "var(--plum-deep)", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600 }}>→ {t.equivalent} : </span>
                  {translation.idiomatic}
                </p>
              )}
            </div>
          )}

          {/* Example */}
          {primaryExample && (
            <div>
              <SectionLabel>{t.example}</SectionLabel>
              <p style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--ink-softer)",
                lineHeight: 1.65,
              }}>
                {primaryExample}
              </p>
            </div>
          )}

          {/* Origin */}
          {primaryOrigin && (
            <div>
              <SectionLabel>{t.origin}</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-softer)", lineHeight: 1.65 }}>{primaryOrigin}</p>
            </div>
          )}

          {/* Original version (when translation active) */}
          {translationActive && (
            <div style={{
              background: "var(--paper-deep)",
              borderRadius: "var(--r-md)",
              padding: "0.875rem 1rem",
              border: "1px solid var(--paper-edge)",
            }}>
              <SectionLabel>{flag} {t.original}</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.65 }}>{expr.meaning}</p>
              {expr.example && (
                <p style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  color: "var(--ink-softer)",
                  marginTop: "0.5rem",
                  borderLeft: "2px solid var(--paper-fold)",
                  paddingLeft: "0.5rem",
                  lineHeight: 1.5,
                }}>
                  {expr.example}
                </p>
              )}
            </div>
          )}

          {/* Source */}
          {expr.source && (
            <div style={{ borderTop: "1px solid var(--paper-edge)", paddingTop: "0.75rem" }}>
              <a
                href={expr.source}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "none",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.03em",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-softer)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink-faint)"; }}
              >
                {t.source} ↗
              </a>
            </div>
          )}

        </div>

        {/* Type badge + Tags */}
        {(expr.tags.length > 0 || getTypeLabel(expr.type, lang)) && (
          <div style={{ marginTop: "1.25rem" }}>
            <SectionLabel>{t.tags}</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {getTypeLabel(expr.type, lang) && (
                <Link
                  href={`/type/${expr.type}${expr.country ? `?country=${expr.country}` : ""}`}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--r-pill)",
                    border: "1.5px solid var(--terra-soft)",
                    background: "var(--terra-bg)",
                    color: "var(--terra)",
                    fontFamily: "var(--font-body)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {getTypeLabel(expr.type, lang)}
                </Link>
              )}
              {expr.tags.map((tag) => {
                const icon = tagIcon(tag);
                const localLabel = tagNames[tag] || tag;
                return (
                  <Link
                    key={tag}
                    href={`/#q=${encodeURIComponent(localLabel)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      padding: "4px 12px",
                      borderRadius: "var(--r-pill)",
                      border: "1.5px solid var(--plum-soft)",
                      background: "var(--plum-bg)",
                      color: "var(--plum)",
                      textDecoration: "none",
                      fontFamily: "var(--font-body)",
                      transition: "border-color 120ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
                  >
                    {icon && <span>{icon}</span>}
                    {tagNames[tag] || tag}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Concept equivalents — La même idée */}
        {expr.concept_equivalents.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <SectionLabel>{t.sameIdea}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {expr.concept_equivalents.map((eq) => (
                <ConceptCard key={eq.id} eq={eq} lang={lang} onNavigate={(url) => router.push(url)} />
              ))}
            </div>
          </div>
        )}

        {/* Related expressions */}
        {related.length > 0 && (
          <div style={{ marginTop: "1.75rem" }}>
            <SectionLabel>{t.related}</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {related.map((r) => (
                <MiniCard key={r.id} expr={r} lang={lang} />
              ))}
            </div>
          </div>
        )}


      </main>

      {showSearch && (
        <SearchOverlay uiLang={lang} onClose={() => setShowSearch(false)} />
      )}

      </div>{/* end wex-main */}
      <ExpressionFloatingNav
        expressionId={id}
        country={expr.country}
        kind={expr.type}
        uiLang={lang}
      />
      <BottomNav uiLang={lang} />
    </div>
  );
}

export default function ExpressionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
          <div className="wex-skeleton" style={{
            width: 320, height: 200,
            background: "var(--paper-deep)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--paper-edge)",
          }} />
        </div>
      }
    >
      <ExpressionPageContent id={id} />
    </Suspense>
  );
}

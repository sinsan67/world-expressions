"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CountryPhotoBackdrop from "./CountryPhotoBackdrop";
import Postcard from "./Postcard";
import Postmark from "./Postmark";
import ColdStartCard from "./ColdStartCard";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { tagIcon } from "@/lib/tagIcons";
import { Heart, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/lib/useAudio";
import { cap } from "@/lib/utils";
import { useFavorite } from "@/lib/useFavorite";
import { getTypeLabel } from "@/lib/typeLabels";
import LangDropdown from "@/components/ui/LangDropdown";
import CarnetHeartLink from "@/components/ui/CarnetHeartLink";
import { useUILangContext } from "@/lib/UILangContext";
import { FAV_LABEL, LISTEN_LABEL } from "@/lib/uiLabels";

type Featured = Expression & { meaning_locale: string; literal: string | null };

type Props = {
  featured: Featured | null;
  coldStart?: boolean;
  uiLang: string;
  tagNames: Record<string, string>;
  onRefresh: () => void;
  onConceptClick: (tag: string) => void;
  t: {
    expressionOfDay: string;
    anotherOne: string;
    readFile: string;
    share: string;
    types: Record<string, string>;
    registers: Record<string, string>;
  };
};

export default function HeroSection({ featured, coldStart, uiLang, tagNames, onRefresh, onConceptClick, t }: Props) {
  const router = useRouter();
  const { uiLang: ctxLang, setUILang } = useUILangContext();
  const [fav, handleFavToggle] = useFavorite(featured?.id ?? "");

  const { speaking, voiceAvailable, handleListen } = useAudio(
    featured?.expression ?? "",
    featured?.language ?? ""
  );

  function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    if (!featured?.id) return;
    handleFavToggle(e);
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!featured?.id) return;
    const url = `${window.location.origin}/expression/${featured.id}`;
    if (navigator.share) {
      navigator.share({ title: featured.expression, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en", { month: "short" }).toUpperCase();
  const year = String(now.getFullYear());

  const effectiveRegion = featured?.country || featured?.region || featured?.language || null;
  const photo = effectiveRegion ? `/images/${effectiveRegion}.jpg` : undefined;
  const countryName = effectiveRegion ? (COUNTRY_NAME[effectiveRegion] ?? effectiveRegion.toUpperCase()) : "";

  return (
    <CountryPhotoBackdrop photo={photo} fadeBottom>
      <div style={{ padding: "var(--wex-hero-shell-padding)", maxWidth: "var(--wex-hero-max-width)", margin: "0 auto" }}>

        {/* Mobile header — wordmark + language switcher, hidden on desktop.
            The switcher sits in the same flex row so it stays vertically
            centered on the wordmark (no fixed-position pixel guessing). */}
        <div className="wex-mobile-header" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: "var(--font-display)" }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: 500 }}>World </span>
            <em style={{ color: "var(--terra-soft)", fontSize: 18, fontStyle: "italic" }}>Expressions</em>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <CarnetHeartLink uiLang={ctxLang} color="rgba(255,255,255,0.9)" />
            <LangDropdown uiLang={ctxLang} onLangChange={setUILang} />
          </div>
        </div>


        {/* Two-column grid */}
        <div style={{
          display: "flex",
          gap: "var(--wex-hero-grid-gap)",
          marginTop: "0.75rem",
          alignItems: "flex-start",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>

          {/* LEFT: Postcard */}
          {featured ? (
            <div style={{ flex: "1 1 300px", maxWidth: "var(--wex-hero-card-max-width)", animation: "fadeSlideUp 0.5s ease-out both" }}>
              <Postcard tilt={-0.4} large>
                <div style={{ position: "absolute", top: "0.8rem", right: "0.8rem", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  {voiceAvailable && (
                    <button
                      onClick={handleListen}
                      title={speaking ? (LISTEN_LABEL[uiLang] ?? LISTEN_LABEL.en).stop : (LISTEN_LABEL[uiLang] ?? LISTEN_LABEL.en).listen}
                      style={{
                        padding: "4px 7px",
                        borderRadius: "var(--r-pill)",
                        border: `1.5px solid ${speaking ? "var(--plum-soft)" : "var(--paper-edge)"}`,
                        background: speaking ? "var(--plum-bg)" : "transparent",
                        color: speaking ? "var(--plum)" : "var(--ink-faint)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    >
                      {speaking ? <VolumeX size={13} strokeWidth={1.5} /> : <Volume2 size={13} strokeWidth={1.5} />}
                    </button>
                  )}
                  <button
                    onClick={handleFav}
                    title={fav ? (FAV_LABEL[uiLang] ?? FAV_LABEL.en).remove : (FAV_LABEL[uiLang] ?? FAV_LABEL.en).add}
                    style={{
                      padding: "4px 7px",
                      borderRadius: "var(--r-pill)",
                      border: `1.5px solid ${fav ? "var(--terra)" : "var(--paper-edge)"}`,
                      background: fav ? "rgba(180,80,40,0.08)" : "transparent",
                      color: fav ? "var(--terra)" : "var(--ink-faint)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    >
                    <Heart size={13} strokeWidth={1.5} fill={fav ? "var(--terra)" : "none"} />
                  </button>
                  <Postmark date={day} month={month} year={year} region={effectiveRegion} inline />
                </div>

                {/* Expression du jour label */}
                <div style={{ marginTop: "-0.35rem", marginBottom: "0.35rem", marginRight: 110 }}>
                  <span style={{ fontSize: "calc(var(--wex-meta-size) - 1px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--terra)", fontFamily: "var(--font-body)" }}>
                    ✦ {t.expressionOfDay}
                  </span>
                </div>

                {/* Country — flag + name, clickable → /country/[code] */}
                {effectiveRegion && (
                  <div style={{ marginBottom: "0.45rem", marginRight: 110 }}>
                    <a
                      href={`/country/${effectiveRegion}`}
                      onClick={(e) => { e.preventDefault(); router.push(`/country/${effectiveRegion}`); }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "var(--wex-body-size)",
                        fontWeight: 600,
                        color: "var(--ink)",
                        textDecoration: "none",
                        fontFamily: "var(--font-body)",
                        transition: "color 120ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--plum)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)"; }}
                    >
                      <span style={{ fontSize: 17, lineHeight: 1 }}>{FLAG[effectiveRegion] ?? "🌍"}</span>
                      {countryName}
                    </a>
                  </div>
                )}

                {/* Expression title */}
                <h2
                  onClick={() => router.push(`/expression/${featured.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--plum)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "var(--wex-hero-title-size)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.15,
                    marginBottom: "0.4rem",
                    cursor: "pointer",
                    marginRight: 110,
                  }}
                >
                  {cap(featured.expression)}
                </h2>

                {/* Literal translation in hand font */}
                {featured.literal && featured.language !== uiLang && (
                  <p style={{
                    fontFamily: "var(--font-hand)",
                    fontSize: "var(--wex-hero-literal-size)",
                    color: "var(--ink-soft)",
                    marginBottom: "0.55rem",
                    lineHeight: 1.3,
                  }}>
                    « {featured.literal} »
                  </p>
                )}

                <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "0.6rem 0" }} />

                {/* Meaning */}
                <p style={{ fontSize: "var(--wex-body-size)", color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: "0.85rem", fontFamily: "var(--font-body)" }}>
                  {featured.meaning}
                </p>

                {/* Tags + actions row */}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                  {getTypeLabel(featured.type, uiLang) && (
                    <button
                      onClick={() => router.push(`/type/${featured.type}`)}
                      style={{
                        fontSize: "calc(var(--wex-meta-size) - 1px)",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "var(--r-pill)",
                        border: "1.5px solid var(--terra-soft)",
                        background: "var(--terra-bg)",
                        color: "var(--terra)",
                        fontFamily: "var(--font-body)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                        transition: "border-color 150ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--terra)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--terra-soft)"; }}
                    >
                      {getTypeLabel(featured.type, uiLang)}
                    </button>
                  )}
                  {featured.tags.slice(0, 3).map((tag) => {
                    const icon = tagIcon(tag) ?? "";
                    const name = tagNames[tag] ?? tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => onConceptClick(tag)}
                        style={{
                          fontSize: "var(--wex-meta-size)",
                          padding: "2px 8px",
                          borderRadius: "var(--r-pill)",
                          border: "1.5px solid var(--plum-soft)",
                          background: "var(--plum-bg)",
                          color: "var(--plum)",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "border-color 150ms ease",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--plum-soft)"; }}
                      >
                        {icon && <span style={{ marginRight: 3 }}>{icon}</span>}{name}
                      </button>
                    );
                  })}

                </div>

                {/* Footer V1 — ultra-discret, transparent */}
                <div style={{
                  marginLeft: "calc(var(--wex-card-padding-lg) * -1)", marginRight: "calc(var(--wex-card-padding-lg) * -1)", marginBottom: "calc(var(--wex-card-padding-lg) * -1)",
                  marginTop: "0.95rem",
                  borderTop: "1px solid var(--paper-edge)",
                  background: "transparent",
                  display: "flex",
                }}>
                  <button
                    onClick={onRefresh}
                    style={{
                      flex: 1, padding: "0.58rem 0.65rem",
                      background: "transparent", border: "none",
                      borderRight: "1px solid var(--paper-edge)",
                      color: "var(--ink-faint)", fontSize: "var(--wex-meta-size)", fontWeight: 500,
                      cursor: "pointer", fontFamily: "var(--font-body)",
                      borderRadius: "0 0 0 var(--r-lg)", transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    🎲 {t.anotherOne}
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1, padding: "0.58rem 0.65rem",
                      background: "transparent", border: "none",
                      borderRight: "1px solid var(--paper-edge)",
                      color: "var(--ink-faint)", fontSize: "var(--wex-meta-size)", fontWeight: 500,
                      cursor: "pointer", fontFamily: "var(--font-body)",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    🔗 {t.share}
                  </button>
                  <button
                    onClick={() => router.push(`/expression/${featured.id}?lang=${uiLang}`)}
                    style={{
                      flex: 1, padding: "0.58rem 0.65rem",
                      background: "transparent", border: "none",
                      color: "var(--ink-faint)", fontSize: "var(--wex-meta-size)", fontWeight: 500,
                      cursor: "pointer", fontFamily: "var(--font-body)",
                      borderRadius: "0 0 var(--r-lg) 0", transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    📖 {t.readFile}
                  </button>
                </div>
              </Postcard>
            </div>
          ) : coldStart ? (
            <div style={{ flex: "1 1 300px", maxWidth: "var(--wex-hero-card-max-width)", animation: "fadeSlideUp 0.5s ease-out both" }}>
              <ColdStartCard uiLang={uiLang} />
            </div>
          ) : (
            /* Loading skeleton */
            <div className="wex-skeleton" style={{ flex: "1 1 300px", maxWidth: "var(--wex-hero-card-max-width)", height: 240, background: "rgba(253,248,238,0.5)", borderRadius: "var(--r-lg)", border: "1px solid var(--paper-edge)" }} />
          )}

        </div>
      </div>
    </CountryPhotoBackdrop>
  );
}

"use client";
import { useRouter } from "next/navigation";
import CountryPhotoBackdrop from "./CountryPhotoBackdrop";
import Postcard from "./Postcard";
import Postmark from "./Postmark";
import Eyebrow from "./Eyebrow";
import CountryStamp from "./CountryStamp";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { tagIcon } from "@/lib/tagIcons";
import { cap } from "@/lib/utils";

type Featured = Expression & { meaning_locale: string; literal: string | null };

type Props = {
  featured: Featured | null;
  uiLang: string;
  regions: { code: string; label: string }[];
  tagNames: Record<string, string>;
  onRefresh: () => void;
  onConceptClick: (tag: string) => void;
  t: {
    expressionOfDay: string;
    anotherOne: string;
    readFile: string;
    atlasTitle: string;
    atlasEyebrow: string;
    moreCountries: string;
    types: Record<string, string>;
    registers: Record<string, string>;
  };
};

export default function HeroSection({ featured, uiLang, regions, tagNames, onRefresh, onConceptClick, t }: Props) {
  const router = useRouter();
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en", { month: "short" }).toUpperCase();
  const year = String(now.getFullYear());

  const photo = featured?.region ? `/images/${featured.region}.jpg` : undefined;
  const countryName = featured?.region ? (COUNTRY_NAME[featured.region] ?? featured.region.toUpperCase()) : "";
  const stampCountries = regions.slice(0, 6);

  return (
    <CountryPhotoBackdrop photo={photo} fadeBottom>
      <div style={{ padding: "1.25rem 1.5rem 3rem", maxWidth: 1200, margin: "0 auto" }}>

        {/* Mobile header — wordmark + title, hidden on desktop */}
        <div className="wex-mobile-header" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <a href="/" style={{ textDecoration: "none", fontFamily: "var(--font-display)" }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: 500 }}>World </span>
            <em style={{ color: "var(--terra-soft)", fontSize: 18, fontStyle: "italic" }}>Expressions</em>
          </a>
        </div>

        {/* Eyebrow */}
        {featured && (
          <Eyebrow tone="on-photo">
            ✦ {t.expressionOfDay}{countryName ? ` · ${countryName}` : ""}
          </Eyebrow>
        )}

        {/* Two-column grid */}
        <div style={{
          display: "flex",
          gap: "2rem",
          marginTop: "1.25rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}>

          {/* LEFT: Postcard */}
          {featured ? (
            <div style={{ flex: "1 1 320px", maxWidth: 520, animation: "fadeSlideUp 0.5s ease-out both" }}>
              <Postcard tilt={-0.4} large>
                <Postmark date={day} month={month} year={year} />

                {/* Meta */}
                <div style={{ marginBottom: "0.5rem", marginRight: 88 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-softer)", fontFamily: "var(--font-body)" }}>
                    {t.types[featured.type] ?? featured.type} · {t.registers[featured.register] ?? featured.register}
                  </span>
                </div>

                {/* Expression title */}
                <h2
                  onClick={() => router.push(`/expression/${featured.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--plum)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "clamp(22px, 4vw, 36px)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.2,
                    marginBottom: "0.5rem",
                    cursor: "pointer",
                    marginRight: 88,
                  }}
                >
                  {cap(featured.expression)}
                </h2>

                {/* Literal translation in hand font */}
                {featured.literal && featured.language !== uiLang && (
                  <p style={{
                    fontFamily: "var(--font-hand)",
                    fontSize: 20,
                    color: "var(--ink-soft)",
                    marginBottom: "0.75rem",
                    lineHeight: 1.3,
                  }}>
                    « {featured.literal} »
                  </p>
                )}

                <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "0.75rem 0" }} />

                {/* Meaning */}
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: "1.25rem", fontFamily: "var(--font-body)" }}>
                  {featured.meaning}
                </p>

                {/* Tags + actions row */}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                  {featured.tags.slice(0, 3).map((tag) => {
                    const icon = tagIcon(tag) ?? "";
                    const name = tagNames[tag] ?? tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => onConceptClick(tag)}
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
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

                  <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button
                      onClick={onRefresh}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "var(--r-pill)",
                        border: "1.5px solid var(--paper-edge)",
                        background: "transparent",
                        color: "var(--ink-soft)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--ink)"; el.style.background = "var(--paper-deep)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--paper-edge)"; el.style.background = "transparent"; }}
                    >
                      🎲 {t.anotherOne}
                    </button>
                    <button
                      onClick={() => router.push(`/expression/${featured.id}?lang=${uiLang}`)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "var(--r-pill)",
                        border: "none",
                        background: "var(--plum)",
                        color: "var(--paper)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "background 150ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--plum-deep)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--plum)"; }}
                    >
                      {t.readFile}
                    </button>
                  </div>
                </div>
              </Postcard>
            </div>
          ) : (
            /* Loading skeleton */
            <div className="wex-skeleton" style={{ flex: "1 1 320px", maxWidth: 520, height: 280, background: "rgba(253,248,238,0.5)", borderRadius: "var(--r-lg)", border: "1px solid var(--paper-edge)" }} />
          )}

          {/* RIGHT: Atlas card — desktop only */}
          <div className="wex-atlas-card" style={{ flex: "1 1 240px", maxWidth: 300 }}>
            <div style={{
              background: "rgba(253,248,238,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--paper-edge)",
              boxShadow: "var(--shadow-postcard)",
              padding: "1.25rem",
            }}>
              <Eyebrow tone="plum">{t.atlasEyebrow}</Eyebrow>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "var(--ink)",
                margin: "0.4rem 0 1rem",
                lineHeight: 1.2,
              }}>
                {t.atlasTitle}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", justifyItems: "center" }}>
                {stampCountries.map((r, i) => (
                  <CountryStamp
                    key={r.code}
                    country={r.code}
                    flag={FLAG[r.code] ?? "🌍"}
                    name={COUNTRY_NAME[r.code] ?? r.code.toUpperCase()}
                    size="sm"
                    tilt={i % 2 === 0 ? 0.8 : -0.6}
                    onClick={() => router.push(`/country/${r.code}`)}
                  />
                ))}
              </div>
              {regions.length > 6 && (
                <>
                  <hr style={{ border: "none", borderTop: "1px dashed var(--paper-edge)", margin: "0.75rem 0 0.5rem" }} />
                  <p style={{ fontFamily: "var(--font-hand)", fontSize: 15, color: "var(--ink-softer)" }}>
                    + {regions.length - 6} {t.moreCountries}
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </CountryPhotoBackdrop>
  );
}

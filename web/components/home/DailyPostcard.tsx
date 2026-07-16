"use client";

import Link from "next/link";
import CountryPhotoBackdrop from "./CountryPhotoBackdrop";
import { Expression } from "@/lib/api";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";
import { cap } from "@/lib/utils";

// Compact "expression of the day" postcard at the bottom of the hub — fed by
// GET /daily (deterministic, same for everyone on the same UTC day). See
// docs/mockups/pivot-hub.html .postcard/.stamp and docs/pivot-lot0-contract.md §3.

type DailyExpression = Expression & { meaning_locale: string; literal: string | null; date: string };

type Props = {
  expression: DailyExpression | null;
  loading: boolean;
  uiLang: string;
  label: string;
  hint: string;
};

export default function DailyPostcard({ expression, loading, uiLang, label, hint }: Props) {
  const effectiveRegion = expression?.country || expression?.region || expression?.language || null;
  const photo = effectiveRegion ? `/images/${effectiveRegion}.jpg` : undefined;
  const flag = effectiveRegion ? (FLAG[effectiveRegion] ?? "🌍") : "🌍";
  const countryName = effectiveRegion ? (COUNTRY_NAME[effectiveRegion] ?? effectiveRegion.toUpperCase()) : "";
  const showLiteral = expression?.literal && expression.language !== uiLang;

  return (
    <div style={{ padding: "1.1rem 1rem 0.5rem" }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--ink-softer)", fontWeight: 700, marginBottom: 7 }}>
        {label}
      </div>

      {!expression || loading ? (
        <div
          className="wex-skeleton"
          style={{ borderRadius: "var(--r-md)", minHeight: 104, background: "var(--paper-deep)", border: "1px solid var(--paper-edge)" }}
        />
      ) : (
        <Link
          href={`/expression/${expression.id}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="daily-postcard"
          style={{ textDecoration: "none", display: "block" }}
        >
          <CountryPhotoBackdrop photo={photo} fadeBottom={false}>
            <div
              style={{
                borderRadius: "var(--r-md)",
                boxShadow: "var(--shadow-postcard)",
                color: "#fff",
                padding: "14px 16px 12px",
                cursor: "pointer",
                minHeight: 104,
                position: "relative",
                // CountryPhotoBackdrop already renders the photo + a dark
                // overlay for legibility (globals.css .country-photo::after).
                // This gradient is only a fallback when no photo file exists
                // for the region.
                background: photo ? "transparent" : "linear-gradient(120deg, #7a9e7e 0%, #b8a06a 45%, #c98d5f 100%)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontSize: 16,
                  padding: "4px 6px",
                  borderRadius: 3,
                  transform: "rotate(4deg)",
                  boxShadow: "1px 2px 0 rgba(0,0,0,0.25)",
                  border: "1px dashed var(--ink-faint)",
                }}
              >
                {flag}
              </span>

              <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, maxWidth: "78%" }}>
                {cap(expression.expression)}
              </div>

              {showLiteral && (
                <div style={{ fontFamily: "var(--font-hand)", fontSize: 17, opacity: 0.92, marginTop: 2 }}>
                  « {expression.literal} »
                </div>
              )}

              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>
                {countryName} · {hint}
              </div>
            </div>
          </CountryPhotoBackdrop>
        </Link>
      )}
    </div>
  );
}

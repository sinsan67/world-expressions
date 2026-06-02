"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { getTypeLabel } from "@/lib/typeLabels";
import { FLAG } from "@/lib/constants";
import { cap } from "@/lib/utils";
import { toggleFavorite, isFavorite } from "@/lib/carnet";
import { Heart } from "lucide-react";
import Link from "next/link";

const ORIGIN_EXAMPLE_LABEL: Record<string, { toggle: string; origin: string }> = {
  fr: { toggle: "Origine & exemple", origin: "Origine" },
  en: { toggle: "Origin & example",  origin: "Origin"  },
  es: { toggle: "Origen & ejemplo",  origin: "Origen"  },
  tr: { toggle: "Köken & örnek",     origin: "Köken"   },
  it: { toggle: "Origine & esempio", origin: "Origine" },
};

const REGISTER_LABEL: Record<string, Record<string, string>> = {
  fr: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" },
  en: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" },
  es: { standard: "estándar", informal: "informal", slang: "argot", vulgar: "vulgar", formal: "formal" },
  tr: { standard: "standart", informal: "günlük", slang: "argo", vulgar: "kaba", formal: "resmi" },
  it: { standard: "standard", informal: "informale", slang: "slang", vulgar: "volgare", formal: "formale" },
};

type Props = {
  expression: Expression;
  onTagClick: (tag: string) => void;
  uiLang?: string;
  tagNames?: Record<string, string>;
  fromSearch?: string;
};

export default function ExpressionCard({ expression: e, onTagClick, uiLang = "fr", tagNames = {}, fromSearch }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [fav, setFav] = useState(false);
  const router = useRouter();
  const flag = FLAG[e.region] || "";
  const typeLabel = getTypeLabel(e.type ?? "expression", uiLang);
  const oeLabel = ORIGIN_EXAMPLE_LABEL[uiLang] ?? ORIGIN_EXAMPLE_LABEL.en;

  // Read from localStorage only on the client (avoids SSR/hydration mismatch)
  useEffect(() => { setFav(isFavorite(e.id)); }, [e.id]);

  function handleFav(ev: React.MouseEvent) {
    ev.stopPropagation();
    toggleFavorite(e.id);
    setFav((v) => !v);
  }

  return (
    <div
      data-testid="expression-card"
      className="rounded-2xl flex flex-col transition-shadow hover:shadow-md overflow-hidden"
      style={{
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderTop: "1px solid var(--paper-edge)",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={() => router.push(`/expression/${e.id}?lang=${uiLang}${fromSearch ? `&from_search=${encodeURIComponent(fromSearch)}` : ""}`)}
    >
      {/* Top border accent */}
      <div style={{ height: 1, background: "var(--paper-edge)" }} />

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-base font-semibold leading-snug" style={{ color: "var(--ink)", fontFamily: "var(--font-body)" }}>
              {cap(e.expression)}
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {typeLabel && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded inline-block"
                  style={{ background: "var(--plum-bg)", color: "var(--plum)", fontWeight: 500 }}
                >
                  {typeLabel}
                </span>
              )}
              {e.register && e.register !== "standard" && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded inline-block"
                  style={{ background: "var(--paper-deep)", color: "var(--ink-softer)" }}
                >
                  {(REGISTER_LABEL[uiLang] ?? REGISTER_LABEL.en)[e.register] || e.register}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={`/country/${e.region}`}
              onClick={(ev) => ev.stopPropagation()}
              style={{ textDecoration: "none", lineHeight: 1, fontSize: "1.25rem" }}
              title={e.region.toUpperCase()}
            >
              {flag}
            </Link>
            {e.source && (
              <a
                href={e.source}
                target="_blank"
                rel="noopener noreferrer"
                title="Voir la source"
                className="text-xs leading-none transition-colors"
                style={{ color: "var(--ink-faint)" }}
                onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.color = "var(--plum)"; }}
                onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.color = "var(--ink-faint)"; }}
                onClick={(ev) => ev.stopPropagation()}
              >
                ↗
              </a>
            )}
            <button
              onClick={handleFav}
              title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 0",
                fontSize: 17,
                lineHeight: 1,
                color: fav ? "var(--terra)" : "var(--ink-faint)",
                transition: "color 150ms ease, transform 150ms ease",
              }}
              onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
              onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <Heart size={16} strokeWidth={1.5} fill={fav ? "var(--terra)" : "none"} />
            </button>
          </div>
        </div>

        {/* Meaning */}
        <p className="text-sm" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{e.meaning}</p>

        {/* Toggle Origine & Exemple */}
        {(e.origin || e.example) && (
          <>
            <button
              onClick={(ev) => { ev.stopPropagation(); setShowDetails((v) => !v); }}
              className="text-xs font-medium text-left transition-colors"
              style={{ color: showDetails ? "var(--plum)" : "var(--ink-faint)", fontFamily: "var(--font-body)" }}
            >
              {showDetails ? "▾" : "▸"} {oeLabel.toggle}
            </button>
            {showDetails && (
              <div className="flex flex-col gap-2">
                {e.origin && (
                  <p className="text-xs" style={{ color: "var(--ink-softer)" }}>
                    <strong>{oeLabel.origin} :</strong> {e.origin}
                  </p>
                )}
                {e.example && (
                  <p
                    className="text-xs italic border-l-2 pl-2"
                    style={{ color: "var(--ink-softer)", borderColor: "var(--paper-fold)" }}
                  >
                    {e.example}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Tags */}
        {e.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {e.tags.map((tag) => {
              const icon = tagIcon(tag);
              return (
                <button
                  key={tag}
                  onClick={(ev) => { ev.stopPropagation(); onTagClick(tag); }}
                  className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition-colors"
                  style={{ background: "var(--paper-deep)", color: "var(--ink-soft)", fontFamily: "var(--font-body)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-fold)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
                >
                  {icon && <span>{icon}</span>}
                  {tagNames[tag] || tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

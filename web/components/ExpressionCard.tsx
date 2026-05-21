"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { getTypeLabel } from "@/lib/typeLabels";
import { FLAG, COUNTRY_GRADIENT } from "@/lib/constants";

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
};

export default function ExpressionCard({ expression: e, onTagClick, uiLang = "fr", tagNames = {} }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const flag = FLAG[e.region] || "";
  const typeLabel = getTypeLabel(e.type ?? "expression", uiLang);
  const accentGradient = COUNTRY_GRADIENT[e.region] || "linear-gradient(90deg, #7c3aed, #a78bfa)";

  return (
    <div
      className="rounded-2xl flex flex-col gap-3 transition-shadow hover:shadow-md overflow-hidden"
      style={{ background: "#fff", border: "1px solid #ede9fe", cursor: "pointer" }}
      onClick={() => router.push(`/expression/${e.id}?lang=${uiLang}`)}
    >
      {/* Bandeau drapeau */}
      <div style={{ height: 5, background: accentGradient }} />
      <div className="px-5 pb-5 flex flex-col gap-3">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="text-base font-semibold leading-snug"
            style={{ color: "#1a0a2e" }}
          >
            {e.expression}
          </span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {typeLabel && (
              <span
                className="text-xs px-1.5 py-0.5 rounded inline-block"
                style={{ background: "#ede9fe", color: "#7c3aed", fontWeight: 500 }}
              >
                {typeLabel}
              </span>
            )}
            {e.register && e.register !== "standard" && (
              <span
                className="text-xs px-1.5 py-0.5 rounded inline-block"
                style={{ background: "#f3f4f6", color: "#9ca3af" }}
              >
                {(REGISTER_LABEL[uiLang] ?? REGISTER_LABEL.en)[e.register] || e.register}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xl">{flag}</span>
          {e.source && (
            <a
              href={e.source}
              target="_blank"
              rel="noopener noreferrer"
              title="Voir la source"
              className="text-xs leading-none transition-colors"
              style={{ color: "#c4b5fd" }}
              onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.color = "#7c3aed"; }}
              onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.color = "#c4b5fd"; }}
              onClick={(ev) => ev.stopPropagation()}
            >
              ↗
            </a>
          )}
        </div>
      </div>

      {/* Sens */}
      <p className="text-sm" style={{ color: "#374151" }}>{e.meaning}</p>

      {/* Toggle Origine & Exemple */}
      {(e.origin || e.example) && (
        <>
          <button
            onClick={(ev) => { ev.stopPropagation(); setShowDetails((v) => !v); }}
            className="text-xs font-medium text-left transition-colors"
            style={{ color: showDetails ? "#7c3aed" : "#9ca3af" }}
          >
            {showDetails ? "▾" : "▸"} Origine &amp; exemple
          </button>
          {showDetails && (
            <div className="flex flex-col gap-2">
              {e.origin && (
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  <strong>Origine :</strong> {e.origin}
                </p>
              )}
              {e.example && (
                <p
                  className="text-xs italic border-l-2 pl-2"
                  style={{ color: "#6b7280", borderColor: "#ede9fe" }}
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
                style={{
                  background: "#f5f3ff",
                  color: "#7c3aed",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#ede9fe";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f5f3ff";
                }}
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

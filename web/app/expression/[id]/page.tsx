"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getExpression, getAllTagNames, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_GRADIENT } from "@/lib/constants";

type UILang = "fr" | "en" | "es" | "tr" | "it";

const T: Record<UILang, {
  wordForWord: string;
  equivalent: string;
  original: string;
  originAndExample: string;
  origin: string;
  example: string;
  source: string;
  noSource: string;
  register: Record<string, string>;
}> = {
  fr: {
    wordForWord: "Mot à mot",
    equivalent: "Équivalent",
    original: "Version originale",
    originAndExample: "Origine & exemple",
    origin: "Origine",
    example: "Exemple",
    source: "Source",
    noSource: "Pas encore de source pour cette expression.",
    register: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" },
  },
  en: {
    wordForWord: "Word for word",
    equivalent: "Equivalent",
    original: "Original version",
    originAndExample: "Origin & example",
    origin: "Origin",
    example: "Example",
    source: "Source",
    noSource: "No source available yet for this expression.",
    register: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" },
  },
  es: {
    wordForWord: "Literalmente",
    equivalent: "Equivalente",
    original: "Versión original",
    originAndExample: "Origen & ejemplo",
    origin: "Origen",
    example: "Ejemplo",
    source: "Fuente",
    noSource: "Aún no hay fuente para esta expresión.",
    register: { standard: "estándar", informal: "informal", slang: "argot", vulgar: "vulgar", formal: "formal" },
  },
  tr: {
    wordForWord: "Kelimesi kelimesine",
    equivalent: "Karşılığı",
    original: "Orijinal versiyon",
    originAndExample: "Köken & örnek",
    origin: "Köken",
    example: "Örnek",
    source: "Kaynak",
    noSource: "Bu ifade için henüz kaynak yok.",
    register: { standard: "standart", informal: "günlük", slang: "argo", vulgar: "kaba", formal: "resmi" },
  },
  it: {
    wordForWord: "Letteralmente",
    equivalent: "Equivalente",
    original: "Versione originale",
    originAndExample: "Origine & esempio",
    origin: "Origine",
    example: "Esempio",
    source: "Fonte",
    noSource: "Nessuna fonte disponibile per questa espressione.",
    register: { standard: "standard", informal: "informale", slang: "slang", vulgar: "volgare", formal: "formale" },
  },
};

function ExpressionPageContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") || "fr") as UILang;
  const [expr, setExpr] = useState<Expression | null>(null);
  const [error, setError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setShowDetails(false);
    setShowOriginal(false);
    setShowSource(false);
    getExpression(id, lang).then(setExpr).catch(() => setError(true));
  }, [id, lang]);

  useEffect(() => {
    getAllTagNames(lang).then(setTagNames);
  }, [lang]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#f5f3ff" }}>
        <p style={{ color: "#7c3aed" }}>Expression not found.</p>
        <Link href="/" className="text-sm" style={{ color: "#9ca3af" }}>← Back</Link>
      </div>
    );
  }

  if (!expr) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f3ff" }}>
        <div style={{ color: "#c4b5fd", fontSize: "2rem" }}>…</div>
      </div>
    );
  }

  const t = T[lang];
  const translation = expr.translation ?? null;

  // A translation is active when UI lang differs from the expression's language AND a translation exists.
  // When active, the UI-language content is PRIMARY. The original becomes secondary (opt-in).
  const translationActive = !!translation && lang !== expr.language;

  // Primary content — always shown in the UI language
  const primaryMeaning = translation?.meaning ?? expr.meaning;
  const primaryOrigin = translation?.origin ?? expr.origin;
  const primaryExample = translation?.example ?? expr.example;

  const accentGradient = COUNTRY_GRADIENT[expr.region] || "linear-gradient(90deg, #7c3aed, #a78bfa)";

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ff" }}>
      {/* Navbar */}
      <nav
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "#fff", borderBottom: "1px solid #ede9fe" }}
      >
        <Link href="/" className="text-sm font-bold" style={{ color: "#7c3aed" }}>
          Expressions <em className="not-italic" style={{ color: "#c4b5fd" }}>du Monde</em>
        </Link>
        <div className="flex gap-1">
          {(["fr", "en", "es", "tr", "it"] as UILang[]).map((l) => (
            <Link
              key={l}
              href={`/expression/${id}?lang=${l}`}
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: lang === l ? "#7c3aed" : "transparent",
                color: lang === l ? "#fff" : "#9ca3af",
                border: "1px solid",
                borderColor: lang === l ? "#7c3aed" : "#e5e7eb",
              }}
            >
              {l}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #ede9fe" }}
        >
          {/* Country bandeau — sole flag indicator, no flag elsewhere in the card */}
          <div style={{ height: 6, background: accentGradient }} />

          <div className="p-6 flex flex-col gap-5">
            {/* Header — title + register, no flag (bandeau above already signals the country) */}
            <div>
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "#1a0a2e" }}>
                {expr.expression}
              </h1>
              {expr.register && expr.register !== "standard" && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                  style={{ background: "#f3f4f6", color: "#9ca3af" }}
                >
                  {t.register[expr.register] || expr.register}
                </span>
              )}
            </div>

            {/* PRIMARY meaning — always in UI language */}
            <p className="text-base" style={{ color: "#374151" }}>
              {primaryMeaning}
            </p>

            {/* Literal + idiomatic — only when a translation is active */}
            {translationActive && (
              <div
                className="rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm"
                style={{ background: "#f5f3ff" }}
              >
                <span style={{ color: "#6b21a8" }}>
                  <span className="font-medium" style={{ color: "#7c3aed" }}>{t.wordForWord} : </span>
                  <span className="italic">&ldquo;{translation!.literal}&rdquo;</span>
                </span>
                <span style={{ color: "#6b21a8" }}>
                  <span className="font-medium" style={{ color: "#7c3aed" }}>→ {t.equivalent} : </span>
                  {translation!.idiomatic}
                </span>
              </div>
            )}

            {/* Origin & example in the PRIMARY language */}
            {(primaryOrigin || primaryExample) && (
              <>
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-xs font-medium text-left"
                  style={{ color: showDetails ? "#7c3aed" : "#9ca3af" }}
                >
                  {showDetails ? "▾" : "▸"} {t.originAndExample}
                </button>
                {showDetails && (
                  <div className="flex flex-col gap-2">
                    {primaryOrigin && (
                      <p className="text-xs" style={{ color: "#6b7280" }}>
                        <strong>{t.origin} :</strong> {primaryOrigin}
                      </p>
                    )}
                    {primaryExample && (
                      <p
                        className="text-xs italic border-l-2 pl-2"
                        style={{ color: "#6b7280", borderColor: "#ede9fe" }}
                      >
                        {primaryExample}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Tags */}
            {expr.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {expr.tags.map((tag) => {
                  const icon = tagIcon(tag);
                  return (
                    <Link
                      key={tag}
                      href={`/#q=${tag}`}
                      className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
                      style={{ background: "#f5f3ff", color: "#7c3aed" }}
                    >
                      {icon && <span>{icon}</span>}
                      {tagNames[tag] || tag}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Original version — secondary, opt-in, only when a translation is active */}
            {translationActive && (
              <div className="border-t pt-4" style={{ borderColor: "#f3f4f6" }}>
                <button
                  onClick={() => setShowOriginal((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: showOriginal ? "#7c3aed" : "#9ca3af" }}
                >
                  <span>{FLAG[expr.region]}</span>
                  <span>{t.original}</span>
                  <span>{showOriginal ? "▾" : "▸"}</span>
                </button>
                {showOriginal && (
                  <div className="flex flex-col gap-2 mt-3">
                    <p className="text-sm" style={{ color: "#374151" }}>{expr.meaning}</p>
                    {expr.origin && (
                      <p className="text-xs" style={{ color: "#6b7280" }}>
                        <strong>{t.origin} :</strong> {expr.origin}
                      </p>
                    )}
                    {expr.example && (
                      <p
                        className="text-xs italic border-l-2 pl-2"
                        style={{ color: "#6b7280", borderColor: "#ede9fe" }}
                      >
                        {expr.example}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Source */}
            <div
              className="border-t pt-4"
              style={{ borderColor: "#f3f4f6" }}
            >
              {expr.source ? (
                <>
                  <button
                    onClick={() => setShowSource((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: showSource ? "#7c3aed" : "#9ca3af" }}
                  >
                    <span>📎</span>
                    <span>{t.source}</span>
                    <span>{showSource ? "▾" : "▸"}</span>
                  </button>
                  {showSource && (
                    <a
                      href={expr.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-xs underline break-all"
                      style={{ color: "#7c3aed" }}
                    >
                      {expr.source} ↗
                    </a>
                  )}
                </>
              ) : (
                <p className="text-xs flex items-center gap-1.5" style={{ color: "#d1d5db" }}>
                  <span>📎</span>
                  <span>{t.noSource}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f3ff" }}>
          <div style={{ color: "#c4b5fd", fontSize: "2rem" }}>…</div>
        </div>
      }
    >
      <ExpressionPageContent id={id} />
    </Suspense>
  );
}

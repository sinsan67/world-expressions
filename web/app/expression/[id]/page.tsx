"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExpression,
  getAllTagNames,
  searchByConcept,
  getRandomExpression,
  Expression,
} from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME, COUNTRY_GRADIENT } from "@/lib/constants";

type UILang = "fr" | "en" | "es" | "tr" | "it";

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
  register: Record<string, string>;
}> = {
  fr: {
    wordForWord: "Mot à mot",
    equivalent: "Équivalent",
    original: "Version originale",
    origin: "Origine",
    example: "Exemple",
    meaning: "Signification",
    source: "Source",
    tags: "Thèmes",
    related: "Dans le même univers",
    randomBtn: "Expression au hasard",
    back: "Retour",
    register: { standard: "courant", informal: "familier", slang: "argot", vulgar: "vulgaire", formal: "soutenu" },
  },
  en: {
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
    register: { standard: "standard", informal: "informal", slang: "slang", vulgar: "vulgar", formal: "formal" },
  },
  es: {
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
    register: { standard: "estándar", informal: "informal", slang: "argot", vulgar: "vulgar", formal: "formal" },
  },
  tr: {
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
    register: { standard: "standart", informal: "günlük", slang: "argo", vulgar: "kaba", formal: "resmi" },
  },
  it: {
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
    register: { standard: "standard", informal: "informale", slang: "slang", vulgar: "volgare", formal: "formale" },
  },
};

const LANGUAGE_NAME: Record<string, string> = {
  fr: "Français", en: "English", es: "Español", it: "Italiano", tr: "Türkçe",
};

function MiniCard({ expr, lang }: { expr: Expression; lang: string }) {
  const gradient = COUNTRY_GRADIENT[expr.region] || "linear-gradient(90deg, #7c3aed, #a78bfa)";
  return (
    <Link
      href={`/expression/${expr.id}?lang=${lang}`}
      className="block rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: "#fff", border: "1px solid #ede9fe" }}
    >
      <div style={{ height: 4, background: gradient }} />
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug" style={{ color: "#1a0a2e" }}>
          {FLAG[expr.region] || ""} {expr.expression}
        </p>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: "#6b7280" }}>
          {expr.meaning}
        </p>
      </div>
    </Link>
  );
}

function ExpressionPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") || "fr") as UILang;

  const [expr, setExpr] = useState<Expression | null>(null);
  const [related, setRelated] = useState<Expression[]>([]);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);

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
        if (exprData.tags.length > 0) {
          searchByConcept(exprData.tags.slice(0, 3), [], 5)
            .then((data) => {
              setRelated(data.results.filter((r) => r.id !== id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setError(true));
  }, [id, lang]);

  async function goRandom() {
    setLoadingRandom(true);
    try {
      const random = await getRandomExpression(lang);
      router.push(`/expression/${random.id}?lang=${lang}`);
    } catch {
      // ignore
    } finally {
      setLoadingRandom(false);
    }
  }

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
  const translationActive = !!translation && lang !== expr.language;

  const primaryMeaning = translation?.meaning ?? expr.meaning;
  const primaryOrigin = translation?.origin ?? expr.origin;
  const primaryExample = translation?.example ?? expr.example;

  const accentGradient = COUNTRY_GRADIENT[expr.region] || "linear-gradient(90deg, #7c3aed, #a78bfa)";
  const flag = FLAG[expr.region] || "";
  const countryName = COUNTRY_NAME[expr.region] || expr.region.toUpperCase();
  const langName = LANGUAGE_NAME[expr.language] || expr.language.toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ff" }}>
      {/* Navbar */}
      <nav
        className="px-6 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "#fff", borderBottom: "1px solid #ede9fe" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            className="text-sm flex items-center gap-1"
            style={{ color: "#9ca3af" }}
          >
            ← {t.back}
          </button>
          <Link href="/" className="text-sm font-bold" style={{ color: "#7c3aed" }}>
            Expressions <em className="not-italic" style={{ color: "#c4b5fd" }}>du Monde</em>
          </Link>
        </div>
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

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Header — flag + expression title */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #ede9fe" }}>
          <div style={{ height: 6, background: accentGradient }} />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-2xl">{flag}</span>
              <span className="text-sm font-medium" style={{ color: "#7c3aed" }}>{countryName}</span>
              <span style={{ color: "#d1d5db" }}>·</span>
              <span className="text-sm" style={{ color: "#9ca3af" }}>{langName}</span>
              {expr.register && expr.register !== "standard" && (
                <>
                  <span style={{ color: "#d1d5db" }}>·</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "#f3f4f6", color: "#9ca3af" }}
                  >
                    {t.register[expr.register] || expr.register}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "#1a0a2e" }}>
              {expr.expression}
            </h1>
          </div>
        </div>

        {/* Content — all visible, no toggles */}
        <div className="rounded-2xl" style={{ background: "#fff", border: "1px solid #ede9fe" }}>
          <div className="p-6 flex flex-col gap-5">

            {/* Meaning */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#c4b5fd" }}>
                {t.meaning}
              </p>
              <p className="text-base" style={{ color: "#374151" }}>{primaryMeaning}</p>
            </div>

            {/* Word-for-word + equivalent */}
            {translationActive && translation?.literal && (
              <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm" style={{ background: "#f5f3ff" }}>
                <span style={{ color: "#6b21a8" }}>
                  <span className="font-medium" style={{ color: "#7c3aed" }}>{t.wordForWord} : </span>
                  <span className="italic">&ldquo;{translation.literal}&rdquo;</span>
                </span>
                {translation.idiomatic && (
                  <span style={{ color: "#6b21a8" }}>
                    <span className="font-medium" style={{ color: "#7c3aed" }}>→ {t.equivalent} : </span>
                    {translation.idiomatic}
                  </span>
                )}
              </div>
            )}

            {/* Example */}
            {primaryExample && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#c4b5fd" }}>
                  {t.example}
                </p>
                <p className="text-sm italic border-l-2 pl-3" style={{ color: "#6b7280", borderColor: "#ede9fe" }}>
                  {primaryExample}
                </p>
              </div>
            )}

            {/* Origin */}
            {primaryOrigin && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#c4b5fd" }}>
                  {t.origin}
                </p>
                <p className="text-sm" style={{ color: "#6b7280" }}>{primaryOrigin}</p>
              </div>
            )}

            {/* Original version (when translation active) */}
            {translationActive && (
              <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "#ede9fe" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#c4b5fd" }}>
                  {flag} {t.original}
                </p>
                <p className="text-sm" style={{ color: "#374151" }}>{expr.meaning}</p>
                {expr.example && (
                  <p className="text-xs italic mt-2 border-l-2 pl-2" style={{ color: "#6b7280", borderColor: "#ede9fe" }}>
                    {expr.example}
                  </p>
                )}
              </div>
            )}

            {/* Source */}
            {expr.source && (
              <a
                href={expr.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1"
                style={{ color: "#c4b5fd" }}
              >
                📎 {t.source} ↗
              </a>
            )}

          </div>
        </div>

        {/* Tags */}
        {expr.tags.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #ede9fe" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#c4b5fd" }}>
              {t.tags}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {expr.tags.map((tag) => {
                const icon = tagIcon(tag);
                return (
                  <Link
                    key={tag}
                    href={`/#q=${tag}`}
                    className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition-colors"
                    style={{ background: "#f5f3ff", color: "#7c3aed" }}
                  >
                    {icon && <span>{icon}</span>}
                    {tagNames[tag] || tag}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Related expressions */}
        {related.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: "#9ca3af" }}>
              {t.related}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {related.map((r) => (
                <MiniCard key={r.id} expr={r} lang={lang} />
              ))}
            </div>
          </div>
        )}

        {/* Random button */}
        <div className="flex justify-center py-4">
          <button
            onClick={goRandom}
            disabled={loadingRandom}
            className="px-6 py-3 rounded-full font-medium text-sm"
            style={{
              background: loadingRandom ? "#ede9fe" : "#7c3aed",
              color: loadingRandom ? "#9ca3af" : "#fff",
              cursor: loadingRandom ? "not-allowed" : "pointer",
            }}
          >
            🎲 {loadingRandom ? "…" : t.randomBtn}
          </button>
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

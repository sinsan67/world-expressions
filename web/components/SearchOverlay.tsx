"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { FLAG } from "@/lib/constants";
import { DOMAIN_DEFS } from "@/lib/domainDefs";
import EmojiKeyboard from "@/components/EmojiKeyboard";

const PLACEHOLDER: Record<string, string> = {
  fr: "Essaie : pied, argent, animal…",
  en: "Try: money, animal, fear…",
  es: "Prueba: dinero, animal, miedo…",
  tr: "Dene: para, hayvan, korku…",
  it: "Prova: soldi, animale, paura…",
  de: "Versuch: Geld, Tier, Angst…",
};

const SEARCH_LABEL: Record<string, string> = {
  fr: "Rechercher →", en: "Search →", es: "Buscar →", it: "Cerca →", tr: "Ara →", de: "Suchen →",
};

const FILTER_LABEL: Record<string, string> = {
  fr: "Pays", en: "Country", es: "País", it: "Paese", tr: "Ülke", de: "Land",
};

const EXPLORE_LABEL: Record<string, string> = {
  fr: "Explorer par domaine", en: "Explore by domain", es: "Explorar por dominio", it: "Esplora per dominio", tr: "Alana göre keşfet", de: "Nach Bereich erkunden",
};

const EMOJI_TAB_LABEL: Record<string, string> = {
  fr: "🎲 Par emoji", en: "🎲 By emoji", es: "🎲 Por emoji", it: "🎲 Per emoji", tr: "🎲 Emoji ile", de: "🎲 Per Emoji",
};

const ALL_LABEL: Record<string, string> = {
  fr: "Tous", en: "All", es: "Todos", it: "Tutti", tr: "Tümü", de: "Alle",
};

const LANG_REGIONS = [
  { code: "fr", flag: "🇫🇷" },
  { code: "uk", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
  { code: "it", flag: "🇮🇹" },
  { code: "tr", flag: "🇹🇷" },
  { code: "de", flag: "🇩🇪" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  fr: "Type", en: "Type", es: "Tipo", it: "Tipo", tr: "Tür", de: "Typ",
};

const TYPES: { value: string | null; labels: Record<string, string> }[] = [
  { value: null,       labels: { fr: "Tous",       en: "All",        es: "Todos",     it: "Tutti",      tr: "Tümü",    de: "Alle" } },
  { value: "idiom",    labels: { fr: "Expression",  en: "Expression", es: "Expresión", it: "Espressione",tr: "İfade",   de: "Redewendung" } },
  { value: "proverb",  labels: { fr: "Proverbe",    en: "Proverb",    es: "Proverbio", it: "Proverbio",  tr: "Atasözü", de: "Sprichwort" } },
  { value: "locution", labels: { fr: "Locution",    en: "Set phrase",  es: "Locución",  it: "Locuzione",  tr: "Deyim",   de: "feste Wendung" } },
];

type Props = { uiLang?: string; onClose: () => void };

export default function SearchOverlay({ uiLang = "en", onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [tappedDomain, setTappedDomain] = useState<string | null>(null);
  const [exploreTab, setExploreTab] = useState<"domains" | "emojis">("domains");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    return () => { if (tapTimerRef.current) clearTimeout(tapTimerRef.current); };
  }, []);

  const toggleRegion = (code: string) => {
    setSelectedRegions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams();
    params.set("q", q);
    if (selectedRegions.length) params.set("region", selectedRegions.join(","));
    if (selectedType) params.set("type_filter", selectedType);
    router.push(`/search?${params}`);
    onClose();
  }, [query, selectedRegions, selectedType, router, onClose]);

  const handleDomainClick = useCallback((slug: string) => {
    const params = new URLSearchParams();
    params.set("concept", slug);
    if (selectedRegions.length) params.set("region", selectedRegions.join(","));
    if (selectedType) params.set("type_filter", selectedType);
    router.push(`/search?${params}`);
    onClose();
  }, [selectedRegions, selectedType, router, onClose]);

  const handleEmojiTouch = (slug: string) => {
    if (tappedDomain === slug) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      setTappedDomain(null);
      handleDomainClick(slug);
      return;
    }
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    setTappedDomain(slug);
    tapTimerRef.current = setTimeout(() => {
      setTappedDomain(null);
      handleDomainClick(slug);
    }, 1000);
  };

  const canSearch = query.trim().length >= 2;

  const countryPillStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: "var(--r-pill)",
    border: "1.5px solid",
    borderColor: active ? "var(--plum)" : "var(--paper-edge)",
    background: active ? "var(--plum)" : "transparent",
    color: active ? "#fff" : "var(--ink-soft)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.12s",
    lineHeight: 1,
  });

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    color: "var(--ink-faint)",
    fontFamily: "var(--font-body)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(28,20,16,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "14vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "1rem 1.125rem",
          width: "100%",
          maxWidth: 540,
          margin: "0 1rem",
          border: "1px solid var(--paper-edge)",
          boxShadow: "var(--shadow-deep)",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={18} strokeWidth={1.5} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            data-testid="overlay-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={PLACEHOLDER[uiLang] ?? PLACEHOLDER.en}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 16, background: "transparent", color: "var(--ink)",
              fontFamily: "var(--font-body)", padding: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 2 }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "var(--paper-edge)", margin: "0 -1.125rem" }} />

        {/* Country filter */}
        <div>
          <div style={sectionLabel}>{FILTER_LABEL[uiLang] ?? FILTER_LABEL.en}</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedRegions([])}
              style={countryPillStyle(selectedRegions.length === 0)}
            >
              {ALL_LABEL[uiLang] ?? ALL_LABEL.en}
            </button>
            {LANG_REGIONS.map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => toggleRegion(code)}
                style={countryPillStyle(selectedRegions.includes(code))}
                title={FLAG[code]}
              >
                {flag} {code === "uk" ? "EN" : code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <div style={sectionLabel}>{TYPE_LABEL[uiLang] ?? TYPE_LABEL.en}</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {TYPES.map((t) => {
              const isActive = selectedType === t.value;
              return (
                <button
                  key={t.value ?? "all"}
                  onClick={() => setSelectedType(t.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    border: `1.5px solid ${isActive ? "var(--terra)" : "var(--paper-edge)"}`,
                    background: isActive ? "var(--terra)" : "transparent",
                    color: isActive ? "#fff" : "var(--ink-soft)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.12s",
                    lineHeight: 1,
                  }}
                >
                  {t.labels[uiLang] ?? t.labels.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explorer — tabs: domain grid | emoji keyboard */}
        <div>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.6rem" }}>
            {(["domains", "emojis"] as const).map((tab) => {
              const label = tab === "domains"
                ? (EXPLORE_LABEL[uiLang] ?? EXPLORE_LABEL.en)
                : (EMOJI_TAB_LABEL[uiLang] ?? EMOJI_TAB_LABEL.en);
              const isActive = exploreTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setExploreTab(tab)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    padding: "3px 10px",
                    borderRadius: "var(--r-pill)",
                    border: `1.5px solid ${isActive ? "var(--plum)" : "var(--paper-edge)"}`,
                    background: isActive ? "var(--plum-bg)" : "transparent",
                    color: isActive ? "var(--plum)" : "var(--ink-soft)",
                    cursor: "pointer",
                    transition: "all 0.12s",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {exploreTab === "domains" ? (
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {Object.entries(DOMAIN_DEFS).map(([slug, def]) => {
                const label = def.labels[uiLang] ?? def.labels.en;
                const isActive = tappedDomain === slug;
                return (
                  <div key={slug} style={{ position: "relative" }}>
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        bottom: "calc(100% + 4px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--ink)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "var(--r-pill)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        fontFamily: "var(--font-body)",
                        zIndex: 10,
                      }}>
                        {label}
                      </div>
                    )}
                    <button
                      data-testid="concept-chip"
                      title={label}
                      onClick={() => handleDomainClick(slug)}
                      onTouchStart={(e) => { e.preventDefault(); handleEmojiTouch(slug); }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: "none",
                        background: isActive ? "var(--paper-edge)" : "transparent",
                        cursor: "pointer",
                        fontSize: "1.375rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.1s",
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--paper-edge)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = isActive ? "var(--paper-edge)" : "transparent";
                      }}
                    >
                      {def.emoji}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmojiKeyboard
              size={38}
              onSelect={(slug) => { handleDomainClick(slug); }}
            />
          )}
        </div>

        {/* Submit button — only for text search */}
        {canSearch && (
          <button
            onClick={handleSearch}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--r-pill)",
              border: "none",
              background: "var(--plum)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              alignSelf: "flex-end",
              transition: "opacity 0.15s",
            }}
          >
            {SEARCH_LABEL[uiLang] ?? SEARCH_LABEL.en}
          </button>
        )}
      </div>
    </div>
  );
}

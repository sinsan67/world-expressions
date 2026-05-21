"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ExpressionCard from "@/components/ExpressionCard";
import WelcomeModal from "@/components/WelcomeModal";
import { searchExpressions, searchByConcept, browseByRegion, getTopTags, getRandomExpression, getAllTagNames, getRegions, Expression } from "@/lib/api";
import { tagIcon } from "@/lib/tagIcons";
import { FLAG, COUNTRY_NAME } from "@/lib/constants";

const LIMIT = 20;

function regionLabel(code: string): string {
  return `${FLAG[code] ?? "🌍"} ${COUNTRY_NAME[code] ?? code.toUpperCase()}`;
}

// Fallback gradient per region — flag colors, muted/pastel, shown when image is not yet placed
const REGION_GRADIENTS: Record<string, string> = {
  fr: "linear-gradient(135deg, #8da7c4 0%, #c5cfe8 40%, #d4a0a8 100%)",
  uk: "linear-gradient(135deg, #7a8fb5 0%, #b5c0d8 45%, #c49090 100%)",
  us: "linear-gradient(135deg, #7a90b8 0%, #aabbd8 45%, #c49898 100%)",
  au: "linear-gradient(135deg, #6e8ab5 0%, #9eb0d0 50%, #c09090 100%)",
  es: "linear-gradient(135deg, #c49090 0%, #d8b8a0 40%, #d4c070 100%)",
  tr: "linear-gradient(135deg, #c49090 0%, #d4a8a8 50%, #3a3a4a 100%)",
  it: "linear-gradient(135deg, #90b8a0 0%, #d8d8d8 45%, #c49090 100%)",
  ar: "linear-gradient(135deg, #74acdf 0%, #e8f0f8 50%, #74acdf 100%)",
  mx: "linear-gradient(135deg, #90b8a0 0%, #d8e8d8 45%, #c49090 100%)",
  co: "linear-gradient(135deg, #d4c070 0%, #7a90b8 50%, #c49090 100%)",
  cl: "linear-gradient(135deg, #7a90b8 0%, #d8d8d8 50%, #c49090 100%)",
  pe: "linear-gradient(135deg, #c49090 0%, #e8d8d8 50%, #c49090 100%)",
  cu: "linear-gradient(135deg, #7a8fb5 0%, #d8d8d8 50%, #c49090 100%)",
  ve: "linear-gradient(135deg, #c49090 0%, #7a90b8 50%, #d4c070 100%)",
  default: "linear-gradient(135deg, #9090b8 0%, #b0a0c8 50%, #c8b0d8 100%)",
};

const HINT_COUNT = 12;

type UILang = "fr" | "en" | "es" | "tr" | "it";

const T = {
  fr: {
    expressionOfMoment: "Expression du moment",
    exploreConcept: "Explorer ce concept",
    exploreCountry: "Explorer ce pays",
    country: "Pays",
    subtitle: "Tapez un mot, découvrez des expressions du monde entier — par le texte ou par le sens.",
    placeholder: "Essaie : pied, argent, animal, partir…",
    search: "Rechercher",
    filterByCountry: "Filtrer par pays",
    mixTitle: "Mélanger les pays",
    filterByConcept: "Filtrer par concept",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} pour « ${q} »`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} affichée${n > 1 ? "s" : ""}`,
    noResults: "Aucune expression trouvée",
    noResultsHint: "Essaie un autre mot ou une variante…",
    serverError: "Impossible de contacter le serveur. Vérifie que l'API tourne sur localhost:8000.",
    newsletterHeadline: "Une expression par jour dans ta boîte mail.",
    newsletterSub: "Reçois chaque matin une expression idiomatique du monde entier — dans ta langue.",
    newsletterPlaceholder: "ton@email.com",
    newsletterLangLabel: "Langue",
    newsletterCta: "S'abonner",
    newsletterSuccess: "C'est noté ! Une expression par jour arrive dans ta boîte.",
    newsletterAlready: "Tu es déjà abonné(e) !",
    newsletterError: "Une erreur s'est produite, réessaie.",
  },
  en: {
    expressionOfMoment: "Expression of the moment",
    exploreConcept: "Explore this concept",
    exploreCountry: "Explore this country",
    country: "Countries",
    subtitle: "Type a word, discover expressions from around the world — by text or meaning.",
    placeholder: "Try: money, animal, leave, fear…",
    search: "Search",
    filterByCountry: "Filter by country",
    mixTitle: "Mix countries",
    filterByConcept: "Filter by concept",
    results: (n: number, q: string) => `${n} expression${n > 1 ? "s" : ""} for "${q}"`,
    allDisplayed: (n: number) => `${n} expression${n > 1 ? "s" : ""} displayed`,
    noResults: "No expressions found",
    noResultsHint: "Try another word or a variant…",
    serverError: "Could not reach the server. Make sure the API is running on localhost:8000.",
    newsletterHeadline: "One expression a day, from the world to your inbox.",
    newsletterSub: "Get a new idiomatic expression every morning — in your language.",
    newsletterPlaceholder: "your@email.com",
    newsletterLangLabel: "Language",
    newsletterCta: "Subscribe",
    newsletterSuccess: "You're in! One expression a day is on its way.",
    newsletterAlready: "You're already subscribed!",
    newsletterError: "Something went wrong, please try again.",
  },
  es: {
    expressionOfMoment: "Expresión del momento",
    exploreConcept: "Explorar este concepto",
    exploreCountry: "Explorar este país",
    country: "Países",
    subtitle: "Escribe una palabra, descubre expresiones de todo el mundo — por texto o por sentido.",
    placeholder: "Prueba: dinero, animal, partir, miedo…",
    search: "Buscar",
    filterByCountry: "Filtrar por país",
    mixTitle: "Mezclar países",
    filterByConcept: "Filtrar por concepto",
    results: (n: number, q: string) => `${n} expresión${n > 1 ? "es" : ""} para « ${q} »`,
    allDisplayed: (n: number) => `${n} expresión${n > 1 ? "es" : ""} mostrada${n > 1 ? "s" : ""}`,
    noResults: "No se encontraron expresiones",
    noResultsHint: "Prueba otra palabra o una variante…",
    serverError: "No se pudo contactar el servidor. Verifica que la API esté en localhost:8000.",
    newsletterHeadline: "Una expresión al día, del mundo a tu bandeja.",
    newsletterSub: "Recibe cada mañana una expresión idiomática del mundo — en tu idioma.",
    newsletterPlaceholder: "tu@email.com",
    newsletterLangLabel: "Idioma",
    newsletterCta: "Suscribirse",
    newsletterSuccess: "¡Apuntado! Una expresión al día te espera en tu bandeja.",
    newsletterAlready: "¡Ya estás suscrito/a!",
    newsletterError: "Algo salió mal, inténtalo de nuevo.",
  },
  tr: {
    expressionOfMoment: "Günün deyimi",
    exploreConcept: "Bu kavramı keşfet",
    exploreCountry: "Bu ülkeyi keşfet",
    country: "Ülkeler",
    subtitle: "Bir kelime yazın, dünyanın dört bir yanından deyimleri keşfedin — metinle ya da anlamıyla.",
    placeholder: "Deneyin: para, hayvan, korku, ayrılmak…",
    search: "Ara",
    filterByCountry: "Ülkeye göre filtrele",
    mixTitle: "Ülkeleri karıştır",
    filterByConcept: "Kavrama göre filtrele",
    results: (n: number, q: string) => `"${q}" için ${n} deyim`,
    allDisplayed: (n: number) => `${n} deyim gösteriliyor`,
    noResults: "Deyim bulunamadı",
    noResultsHint: "Başka bir kelime veya varyant deneyin…",
    serverError: "Sunucuya bağlanılamıyor. API'nin localhost:8000 üzerinde çalıştığını kontrol edin.",
    newsletterHeadline: "Her gün bir deyim, dünyadan gelen kutuna.",
    newsletterSub: "Her sabah dünyadan bir deyim al — kendi dilinde.",
    newsletterPlaceholder: "sen@email.com",
    newsletterLangLabel: "Dil",
    newsletterCta: "Abone ol",
    newsletterSuccess: "Kaydoldun! Her gün bir deyim gelen kutuna gelecek.",
    newsletterAlready: "Zaten abonesin!",
    newsletterError: "Bir şeyler ters gitti, tekrar dene.",
  },
  it: {
    expressionOfMoment: "Espressione del momento",
    exploreConcept: "Esplora questo concetto",
    exploreCountry: "Esplora questo paese",
    country: "Paesi",
    subtitle: "Digita una parola, scopri espressioni da tutto il mondo — per testo o per significato.",
    placeholder: "Prova: soldi, animale, partire, paura…",
    search: "Cerca",
    filterByCountry: "Filtra per paese",
    mixTitle: "Mescola i paesi",
    filterByConcept: "Filtra per concetto",
    results: (n: number, q: string) => `${n} espression${n > 1 ? "i" : "e"} per "${q}"`,
    allDisplayed: (n: number) => `${n} espression${n > 1 ? "i" : "e"} visualizzat${n > 1 ? "e" : "a"}`,
    noResults: "Nessuna espressione trovata",
    noResultsHint: "Prova un'altra parola o una variante…",
    serverError: "Impossibile contattare il server. Verifica che l'API sia in esecuzione su localhost:8000.",
    newsletterHeadline: "Un'espressione al giorno, dal mondo alla tua casella.",
    newsletterSub: "Ricevi ogni mattina un'espressione idiomatica dal mondo — nella tua lingua.",
    newsletterPlaceholder: "tua@email.com",
    newsletterLangLabel: "Lingua",
    newsletterCta: "Iscriviti",
    newsletterSuccess: "Iscritto! Un'espressione al giorno ti aspetta in casella.",
    newsletterAlready: "Sei già iscritto/a!",
    newsletterError: "Qualcosa è andato storto, riprova.",
  },
};

// Round-robin interleaving by region/language — no re-fetch needed
function applyMix(items: Expression[]): Expression[] {
  const bucketMap = new Map<string, Expression[]>();
  for (const item of items) {
    const key = item.region || item.language || "other";
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key)!.push(item);
  }
  const groups = [...bucketMap.values()];
  const result: Expression[] = [];
  let i = 0;
  while (result.length < items.length) {
    let anyLeft = false;
    for (const group of groups) {
      if (i < group.length) {
        result.push(group[i]);
        anyLeft = true;
      }
    }
    if (!anyLeft) break;
    i++;
  }
  return result;
}

export default function Home() {
  const [uiLang, setUILang] = useState<UILang>("en");
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null); // null = not yet determined
  const [hintKey, setHintKey] = useState(0);
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<{ code: string; label: string }[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [rawResults, setRawResults] = useState<Expression[]>([]);
  const [mixActive, setMixActive] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "concept" | "browse">("text");
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [hintTags, setHintTags] = useState<{ slug: string; name: string }[]>([]);
  const [hintTagsError, setHintTagsError] = useState(false);
  const [tagNames, setTagNames] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState<(Expression & { meaning_locale: string }) | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const conceptDropdownRef = useRef<HTMLDivElement>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [conceptDropdownOpen, setConceptDropdownOpen] = useState(false);
  const featuredCountryRef = useRef<HTMLDivElement>(null);
  const featuredConceptRef = useRef<HTMLDivElement>(null);
  const [featuredCountryOpen, setFeaturedCountryOpen] = useState(false);
  const [featuredConceptOpen, setFeaturedConceptOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLang, setNewsletterLang] = useState<UILang>("en");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const t = T[uiLang];

  const handleNewsletterSubmit = useCallback(async () => {
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("loading");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim(), language: newsletterLang }),
      });
      if (!res.ok) { setNewsletterStatus("error"); return; }
      const data = await res.json();
      setNewsletterStatus(data.status === "already_subscribed" ? "already" : "success");
    } catch {
      setNewsletterStatus("error");
    }
  }, [newsletterEmail, newsletterLang]);

  const activeRegions = [...selectedRegions];
  const displayResults = useMemo(
    () => (mixActive ? applyMix(rawResults) : rawResults),
    [rawResults, mixActive]
  );

  const discoveryFlags = useMemo(() => {
    if (regions.length === 0) return [];
    return [...regions].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [regions, hintKey]);

  const discoveryConcepts = useMemo(
    () => [...hintTags].sort(() => Math.random() - 0.5).slice(0, 3),
    [hintTags]
  );

  const toggleRegion = (code: string) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size === 1) return prev;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleMixToggle = useCallback(async () => {
    setMixActive((v) => !v);
    // When activating Mix, fetch a larger batch so round-robin has multi-region data
    if (!mixActive && searched && query.trim().length >= 2) {
      try {
        const data =
          searchMode === "concept"
            ? await searchByConcept([query], activeRegions, 80, 0)
            : await searchExpressions(query, activeRegions, 80, 0);
        setRawResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        // keep existing results
      }
    }
  }, [mixActive, searched, query, searchMode, activeRegions]);

  const runConceptSearch = useCallback(
    async (tag: string, regions: string[]) => {
      setQuery(tag);
      setSearchMode("concept");
      setLoading(true);
      setHasError(false);
      setSearched(true);
      setRawResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(tag));
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        const data = await searchByConcept([tag], regions, LIMIT, 0);
        setRawResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setHasError(true);
        setRawResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) return;
      setSearchLabel("");
      setSearchMode("text");
      setLoading(true);
      setHasError(false);
      setSearched(true);
      setRawResults([]);
      window.history.replaceState(null, "", "#q=" + encodeURIComponent(q));
      try {
        const data = await searchExpressions(q, activeRegions, LIMIT, 0);
        setRawResults(data.results);
        setTotal(data.total);
        setHasMore(data.results.length < data.total);
      } catch {
        setHasError(true);
        setRawResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [activeRegions]
  );

  const handleBrowseRegion = useCallback(async (code: string) => {
    setSearchLabel(`${FLAG[code] ?? "🌍"} ${COUNTRY_NAME[code] ?? code.toUpperCase()}`);
    setSelectedRegions(new Set([code]));
    setSearchMode("browse");
    setLoading(true);
    setHasError(false);
    setSearched(true);
    setQuery("");
    setRawResults([]);
    window.history.replaceState(null, "", "#region=" + code);
    try {
      const data = await browseByRegion([code], LIMIT, 0);
      setRawResults(data.results);
      setTotal(data.total);
      setHasMore(data.results.length < data.total);
    } catch {
      setHasError(true);
      setRawResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
    setFeaturedCountryOpen(false);
    setTimeout(() => exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const currentOffset = rawResults.length;
    try {
      const data =
        searchMode === "browse"
          ? await browseByRegion(activeRegions, LIMIT, currentOffset)
          : searchMode === "concept"
          ? await searchByConcept([query], activeRegions, LIMIT, currentOffset)
          : await searchExpressions(query, activeRegions, LIMIT, currentOffset);
      setRawResults((prev) => [...prev, ...data.results]);
      setHasMore(currentOffset + data.results.length < data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, searchMode, query, activeRegions, rawResults.length]);

  useEffect(() => {
    getRegions().then((data) => {
      const built = data.map((r) => ({ code: r.code, label: regionLabel(r.code) }));
      setRegions(built);
      setSelectedRegions(new Set(built.map((r) => r.code)));
    });
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // Init language + welcome modal from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem("wex_lang") as UILang | null;
    const valid: UILang[] = ["fr", "en", "es", "it", "tr"];
    if (stored && valid.includes(stored)) {
      setUILang(stored);
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#q=")) {
      const initQ = decodeURIComponent(hash.slice(3));
      if (initQ.trim().length >= 2) handleSearch(initQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getRandomExpression(uiLang).then(setFeatured).catch(() => {});
  }, [uiLang]);

  useEffect(() => {
    getAllTagNames(uiLang).then(setTagNames);
  }, [uiLang]);

  useEffect(() => {
    setHintTagsError(false);
    getTopTags(uiLang, 40, uiLang).then((tags) => {
      const withEmoji = tags.filter((tag) => tagIcon(tag.slug));
      const shuffled = withEmoji.sort(() => Math.random() - 0.5);
      setHintTags(shuffled.slice(0, HINT_COUNT).map((tag) => ({ slug: tag.slug, name: tag.name })));
    }).catch(() => { setHintTagsError(true); });
  }, [uiLang, hintKey]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node))
        setCountryDropdownOpen(false);
      if (conceptDropdownRef.current && !conceptDropdownRef.current.contains(e.target as Node))
        setConceptDropdownOpen(false);
      if (featuredCountryRef.current && !featuredCountryRef.current.contains(e.target as Node))
        setFeaturedCountryOpen(false);
      if (featuredConceptRef.current && !featuredConceptRef.current.contains(e.target as Node))
        setFeaturedConceptOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#f5f3ff" }}>

      {showWelcome && (
        <WelcomeModal
          onSelect={(lang) => {
            setUILang(lang);
            setHintKey((k) => k + 1);
            setShowWelcome(false);
          }}
        />
      )}

      {/* ===== SECTION 1 : HERO — identité du site + expression du moment ===== */}
      <div
        className="relative"
        style={{ minHeight: 320, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Background — image pays + gradient fallback, crossfade au changement */}
        <div
          key={featured?.region || "default"}
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: featured?.region
              ? `url('/images/${featured.region}.jpg') center/cover, ${REGION_GRADIENTS[featured.region] || REGION_GRADIENTS.default}`
              : REGION_GRADIENTS.default,
            animation: "bgFadeIn 1.2s ease-out both",
          }}
        />
        {/* Gradient overlay pour lisibilité du texte */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(10,4,28,0.42) 0%, rgba(10,4,28,0.25) 45%, rgba(10,4,28,0.58) 100%)",
          }}
        />

        {/* Contenu hero */}
        <div style={{ position: "relative", zIndex: 2, padding: "1.75rem 2rem 2rem" }}>

          {/* Icônes contact — coin haut gauche */}
          <div style={{ position: "absolute", top: 18, left: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href="mailto:worldsexpressions@proton.me"
              title="Contact"
              style={{ color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="2,4 12,13 22,4"/>
              </svg>
            </a>
            <a
              href="/instagram"
              title="Instagram"
              style={{ color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>

          {/* Sélecteur de langue — coin haut droite */}
          <div style={{ position: "absolute", top: 16, right: 20, display: "flex", gap: 4 }}>
            {(["fr", "en", "es", "tr", "it"] as UILang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => { setUILang(lang); setHintKey((k) => k + 1); localStorage.setItem("wex_lang", lang); }}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: uiLang === lang ? "#a78bfa" : "rgba(255,255,255,0.25)",
                  background: uiLang === lang ? "#7c3aed" : "rgba(255,255,255,0.08)",
                  color: uiLang === lang ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Deux colonnes : titre à gauche — expression du moment à droite */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "2.5rem",
              maxWidth: 980, margin: "2.5rem auto 0",
              flexWrap: "wrap",
            }}
          >
            {/* Gauche : titre + sous-titre */}
            <div style={{ flex: "1 1 260px", textAlign: "left" }}>
              <h1
                className="text-4xl font-bold cursor-pointer"
                style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)", lineHeight: 1.15 }}
                onClick={() => {
                  setQuery("");
                  setSearched(false);
                  setRawResults([]);
                  setHasError(false);
                  window.history.replaceState(null, "", window.location.pathname);
                }}
              >
                World{" "}
                <em className="not-italic" style={{ color: "#c4b5fd" }}>Expressions</em>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.68)", marginTop: "0.75rem", fontSize: 15, lineHeight: 1.65, maxWidth: 340 }}>
                {t.subtitle}
              </p>
            </div>

            {/* Droite : expression du moment */}
            {!searched && featured && (
              <div
                style={{
                  flex: "1 1 300px", maxWidth: 480,
                  animation: "fadeSlideUp 0.5s ease-out both",
                }}
              >
                <div
                  style={{
                    background: "rgba(10,4,28,0.62)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 16,
                    padding: "1rem 1.25rem",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c4b5fd" }}>
                      ✨ {t.expressionOfMoment}
                    </span>
                    <button
                      onClick={() => getRandomExpression(uiLang).then(setFeatured).catch(() => {})}
                      title="Nouvelle expression"
                      style={{
                        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                    >
                      🔀
                    </button>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: "0.35rem", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    <span style={{ color: "#a78bfa", marginRight: 3 }}>"</span>
                    {featured.expression}
                    <span style={{ color: "#a78bfa", marginLeft: 3 }}>"</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <p style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                      {featured.meaning}
                    </p>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {FLAG[featured.region] ?? "🌍"}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {/* Country dropdown */}
                    <div ref={featuredCountryRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => { setFeaturedCountryOpen((v) => !v); setFeaturedConceptOpen(false); }}
                        style={{
                          fontSize: 11, fontWeight: 600, color: "#e9d5ff",
                          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 7,
                          padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
                      >
                        🌍 {t.exploreCountry}
                        <span style={{ fontSize: 8, opacity: 0.7 }}>{featuredCountryOpen ? "▴" : "▾"}</span>
                      </button>
                      {featuredCountryOpen && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
                          background: "rgba(15,8,36,0.97)", backdropFilter: "blur(12px)",
                          borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", padding: "0.35rem",
                          minWidth: 175,
                        }}>
                          {/* Pays de l'expression du moment — en tête, mis en avant */}
                          {(() => {
                            const featuredRegion = regions.find((r) => r.code === featured.region);
                            return featuredRegion ? (
                              <>
                                <button
                                  onClick={() => handleBrowseRegion(featuredRegion.code)}
                                  style={{
                                    display: "flex", width: "100%", textAlign: "left", alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "7px 10px", borderRadius: 7, fontSize: 12,
                                    color: "#fff", background: "rgba(167,139,250,0.18)",
                                    border: "none", cursor: "pointer", whiteSpace: "nowrap", gap: "0.5rem",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.32)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.18)"; }}
                                >
                                  <span>{FLAG[featuredRegion.code]} {featuredRegion.label}</span>
                                  <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 500 }}>ce pays</span>
                                </button>
                                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", margin: "0.3rem 0.25rem" }} />
                              </>
                            ) : null;
                          })()}
                          {/* Tous les autres pays */}
                          {regions.filter((r) => r.code !== featured.region).map((r) => (
                            <button
                              key={r.code}
                              onClick={() => handleBrowseRegion(r.code)}
                              style={{
                                display: "block", width: "100%", textAlign: "left",
                                padding: "6px 10px", borderRadius: 7, fontSize: 12, color: "#e9d5ff",
                                background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              {FLAG[r.code]} {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Concept dropdown */}
                    {featured.tags.length > 0 && (
                      <div ref={featuredConceptRef} style={{ position: "relative" }}>
                        <button
                          onClick={() => { setFeaturedConceptOpen((v) => !v); setFeaturedCountryOpen(false); }}
                          style={{
                            fontSize: 11, fontWeight: 600, color: "#e9d5ff",
                            background: "rgba(124,58,237,0.35)", border: "none", borderRadius: 7,
                            padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.55)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.35)"; }}
                        >
                          🔍 {t.exploreConcept}
                          <span style={{ fontSize: 8, opacity: 0.7 }}>{featuredConceptOpen ? "▴" : "▾"}</span>
                        </button>
                        {featuredConceptOpen && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
                            background: "rgba(15,8,36,0.97)", backdropFilter: "blur(12px)",
                            borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.4)", padding: "0.35rem",
                            minWidth: 165,
                          }}>
                            {featured.tags.slice(0, 4).map((tag) => {
                              const icon = tagIcon(tag) || "🔍";
                              const name = tagNames[tag] || tag;
                              return (
                                <button
                                  key={tag}
                                  onClick={() => { runConceptSearch(tag, activeRegions); setFeaturedConceptOpen(false); }}
                                  style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "6px 10px", borderRadius: 7, fontSize: 12, color: "#e9d5ff",
                                    background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                  {icon} {name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SECTION 2 : EXPLORER — barre de recherche + filtres + chips ===== */}
      <div ref={exploreRef} style={{ background: "#f5f3ff", padding: "2rem 1rem 1.5rem", borderBottom: "1px solid #ede9fe" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>

          {/* Barre de recherche */}
          <div className="flex gap-2 mb-4">
            <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
              {tagIcon(query.trim()) && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute", left: 12, fontSize: 16,
                    pointerEvents: "none", userSelect: "none",
                  }}
                >
                  {tagIcon(query.trim())}
                </span>
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                placeholder={t.placeholder}
                className="explore-input w-full rounded-xl py-3 text-sm focus:outline-none"
                style={{
                  paddingLeft: tagIcon(query.trim()) ? "2.5rem" : "1rem",
                  paddingRight: "1rem",
                  background: "white",
                  border: "1.5px solid #e5e7eb",
                  color: "#1f2937",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              />
            </div>
            <button
              onClick={() => handleSearch(query)}
              disabled={loading}
              className="rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: "#7c3aed", padding: "0.75rem 1.75rem", fontSize: 15, minWidth: 115 }}
            >
              {loading ? "…" : t.search}
            </button>
          </div>

          {/* Filtres pays + concept — côte à côte */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "0.5rem", flexWrap: "wrap" }}>

            {/* Gauche : pays + mix */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <div ref={countryDropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => { setCountryDropdownOpen((v) => !v); setConceptDropdownOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: "white", border: "1.5px solid #e5e7eb", color: "#374151",
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  🌍 {t.filterByCountry}
                  <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>
                    ({selectedRegions.size}/{regions.length})
                  </span>
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{countryDropdownOpen ? "▴" : "▾"}</span>
                </button>
                {countryDropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                    background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: "0.5rem",
                    minWidth: 200,
                  }}>
                    {/* Tout sélectionner / désélectionner */}
                    <label
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                        fontSize: 13, color: "#6b7280", fontWeight: 600,
                        borderBottom: "1px solid #f3f4f6", marginBottom: "0.25rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRegions.size === regions.length}
                        onChange={() => {
                          if (selectedRegions.size === regions.length) setSelectedRegions(new Set());
                          else setSelectedRegions(new Set(regions.map((r) => r.code)));
                        }}
                        style={{ accentColor: "#7c3aed", width: 14, height: 14, cursor: "pointer" }}
                      />
                      {selectedRegions.size === regions.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </label>
                    {regions.map((r) => (
                      <label
                        key={r.code}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, color: "#374151",
                          background: selectedRegions.has(r.code) ? "#f5f3ff" : "transparent",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = selectedRegions.has(r.code) ? "#ede9fe" : "#f9fafb"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selectedRegions.has(r.code) ? "#f5f3ff" : "transparent"; }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegions.has(r.code)}
                          onChange={() => toggleRegion(r.code)}
                          style={{ accentColor: "#7c3aed", width: 14, height: 14, cursor: "pointer" }}
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                )}
                {selectedRegions.size < regions.length && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                    {[...selectedRegions].map((code) => (
                      <span
                        key={code}
                        style={{
                          fontSize: 11, padding: "2px 6px", borderRadius: 20,
                          background: "#7c3aed", color: "#fff", fontWeight: 600,
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                        }}
                      >
                        {FLAG[code] ?? "🌍"}
                        <button
                          onClick={() => toggleRegion(code)}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 11, cursor: "pointer", padding: 0, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Discovery flags — emoji only, aléatoires à chaque visite */}
                {discoveryFlags.length > 0 && (
                  <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.4rem" }}>
                    {discoveryFlags.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => handleBrowseRegion(r.code)}
                        title={r.label}
                        style={{
                          padding: "3px 9px", borderRadius: 8, fontSize: 18, lineHeight: 1,
                          background: "white", border: "1.5px solid #e5e7eb",
                          cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        {FLAG[r.code]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleMixToggle}
                title={t.mixTitle}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: "1.5px solid",
                  borderColor: mixActive ? "#a78bfa" : "#e5e7eb",
                  background: mixActive ? "#7c3aed" : "white",
                  color: mixActive ? "#fff" : "#9ca3af",
                  fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                ⇄
              </button>
            </div>

            {/* Droite : concept */}
            <div ref={conceptDropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setConceptDropdownOpen((v) => !v); setCountryDropdownOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "white", border: "1.5px solid #e5e7eb", color: "#374151",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                🔍 {t.filterByConcept}
                <span style={{ fontSize: 9, color: "#9ca3af" }}>{conceptDropdownOpen ? "▴" : "▾"}</span>
              </button>
              {conceptDropdownOpen && !hintTagsError && hintTags.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
                  background: "white", borderRadius: 14, border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: "0.75rem",
                  width: 320, maxHeight: 260, overflowY: "auto",
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {hintTags.map((tag) => {
                      const icon = tagIcon(tag.slug) || "🔍";
                      return (
                        <button
                          key={tag.slug}
                          onClick={() => { runConceptSearch(tag.slug, activeRegions); setConceptDropdownOpen(false); setHintKey((k) => k + 1); }}
                          style={{
                            fontSize: 12, padding: "5px 12px", borderRadius: 20,
                            background: "#f5f3ff", border: "1px solid #e9d5ff", color: "#7c3aed",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
                            fontWeight: 500, whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#7c3aed"; (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f3ff"; (e.currentTarget as HTMLElement).style.color = "#7c3aed"; (e.currentTarget as HTMLElement).style.borderColor = "#e9d5ff"; }}
                        >
                          {icon} {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Discovery concepts — aléatoires à chaque visite */}
              {discoveryConcepts.length > 0 && (
                <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  {discoveryConcepts.map((tag) => (
                    <button
                      key={tag.slug}
                      onClick={() => { setSearchLabel(`${tagIcon(tag.slug) ? tagIcon(tag.slug) + " " : ""}${tag.name}`); runConceptSearch(tag.slug, activeRegions); setConceptDropdownOpen(false); }}
                      style={{
                        fontSize: 12, padding: "4px 11px", borderRadius: 20,
                        background: "#f5f3ff", border: "1px solid #e9d5ff", color: "#7c3aed",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
                        fontWeight: 500,
                      }}
                    >
                      {tagIcon(tag.slug) && <span>{tagIcon(tag.slug)}</span>}
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ===== Résultats ===== */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {hasError && (
          <p className="text-red-500 text-center mb-6 text-sm">{t.serverError}</p>
        )}

        {searched && !loading && !hasError && displayResults.length > 0 && (
          <p className="text-right text-sm mb-4" style={{ color: "#9ca3af" }}>
            {searchLabel
              ? `${total} expression${total > 1 ? "s" : ""} — ${searchLabel}`
              : t.results(total, query)}
          </p>
        )}


        {displayResults.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {displayResults.map((expr, i) => (
                <div
                  key={expr.id}
                  style={{
                    animation: "fadeSlideUp 0.35s ease-out both",
                    animationDelay: `${Math.min(i % LIMIT, 8) * 45}ms`,
                  }}
                >
                  <ExpressionCard
                    expression={expr}
                    onTagClick={(tag) => runConceptSearch(tag, activeRegions)}
                    uiLang={uiLang}
                    tagNames={tagNames}
                  />
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#ede9fe", borderTopColor: "#7c3aed" }}
                />
              </div>
            )}
            {!hasMore && displayResults.length > 0 && displayResults.length === total && total > LIMIT && (
              <p className="text-center text-xs py-4" style={{ color: "#9ca3af" }}>
                {t.allDisplayed(total)}
              </p>
            )}
          </>
        )}

        {searched && !loading && displayResults.length === 0 && !hasError && (
          <div className="text-center mt-16">
            <p className="text-lg font-medium" style={{ color: "#6b7280" }}>
              {t.noResults}
            </p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              {t.noResultsHint}
            </p>
          </div>
        )}
      </div>

      {/* ===== Newsletter ===== */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)", padding: "4rem 1rem" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: "#f5f3ff", marginBottom: "0.5rem", lineHeight: 1.3 }}>
            {t.newsletterHeadline}
          </p>
          <p style={{ fontSize: 15, color: "#c4b5fd", marginBottom: "2rem" }}>
            {t.newsletterSub}
          </p>

          {newsletterStatus === "success" || newsletterStatus === "already" ? (
            <p style={{ fontSize: 15, color: "#a7f3d0", fontWeight: 600, padding: "1rem", background: "rgba(16,185,129,0.15)", borderRadius: 12 }}>
              {newsletterStatus === "success" ? t.newsletterSuccess : t.newsletterAlready}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubmit()}
                placeholder={t.newsletterPlaceholder}
                style={{
                  width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid rgba(196,181,253,0.3)",
                  background: "rgba(255,255,255,0.08)", color: "#f5f3ff", fontSize: 15,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <select
                  value={newsletterLang}
                  onChange={(e) => setNewsletterLang(e.target.value as UILang)}
                  style={{
                    flex: "0 0 auto", padding: "0.75rem 0.75rem", borderRadius: 10,
                    border: "1px solid rgba(196,181,253,0.3)", background: "rgba(255,255,255,0.08)",
                    color: "#f5f3ff", fontSize: 14, cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="fr" style={{ background: "#1e1b4b" }}>🇫🇷 FR</option>
                  <option value="en" style={{ background: "#1e1b4b" }}>🇬🇧 EN</option>
                  <option value="es" style={{ background: "#1e1b4b" }}>🇪🇸 ES</option>
                  <option value="it" style={{ background: "#1e1b4b" }}>🇮🇹 IT</option>
                  <option value="tr" style={{ background: "#1e1b4b" }}>🇹🇷 TR</option>
                </select>
                <button
                  onClick={handleNewsletterSubmit}
                  disabled={newsletterStatus === "loading"}
                  style={{
                    flex: 1, padding: "0.75rem 1.5rem", borderRadius: 10, border: "none",
                    background: newsletterStatus === "loading" ? "rgba(124,58,237,0.5)" : "#7c3aed",
                    color: "#fff", fontWeight: 600, fontSize: 15, cursor: newsletterStatus === "loading" ? "default" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { if (newsletterStatus !== "loading") (e.currentTarget as HTMLElement).style.background = "#6d28d9"; }}
                  onMouseLeave={(e) => { if (newsletterStatus !== "loading") (e.currentTarget as HTMLElement).style.background = "#7c3aed"; }}
                >
                  {newsletterStatus === "loading" ? "…" : t.newsletterCta}
                </button>
              </div>
              {newsletterStatus === "error" && (
                <p style={{ fontSize: 13, color: "#fca5a5", marginTop: "0.25rem" }}>{t.newsletterError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

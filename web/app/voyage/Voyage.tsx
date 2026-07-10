"use client";

/**
 * Voyage — the "Découverte" game (pivot-lot0-contract §1/§5, mockup
 * docs/mockups/pivot-jeu-decouverte.html). Absorbs Random mode.
 *
 * Single client route holding all 3 phases in-component state (no separate
 * URLs per phase): setup (filters) → play (10 cards) → recap.
 * `?quick=1` (read server-side in page.tsx) skips setup entirely.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  postGameSession,
  patchGameSession,
  GameSession,
  GameSessionFilters,
} from "@/lib/api";
import { getCarnet } from "@/lib/carnet";
import { FLAG, COUNTRY_NAME, HERO_IMAGE_COUNTRIES } from "@/lib/constants";
import { getTypeLabel } from "@/lib/typeLabels";
import { EDITORIAL_DOMAINS } from "@/lib/editorialDomains";
import { useUILangContext } from "@/lib/UILangContext";
import { VOYAGE_SETUP, VOYAGE_PLAY } from "@/lib/voyageLabels";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import VoyageSetup, { VoyageFilters } from "@/components/voyage/VoyageSetup";
import VoyageCard from "@/components/voyage/VoyageCard";
import VoyageRecap from "@/components/voyage/VoyageRecap";

type Phase = "setup" | "loading" | "play" | "recap";

const EMPTY_FILTERS: VoyageFilters = { country: "", kind: "", domain: "" };

export default function Voyage({ quick }: { quick: boolean }) {
  const { uiLang } = useUILangContext();
  const { data: authSession } = useSession();
  const t = VOYAGE_SETUP[uiLang] ?? VOYAGE_SETUP.en;
  const playT = VOYAGE_PLAY[uiLang] ?? VOYAGE_PLAY.en;

  const [phase, setPhase] = useState<Phase>(quick ? "loading" : "setup");
  const [session, setSession] = useState<GameSession | null>(null);
  const [lastFilters, setLastFilters] = useState<VoyageFilters>(EMPTY_FILTERS);
  const [lastQuick, setLastQuick] = useState(quick);
  const [cardIndex, setCardIndex] = useState(0);
  const [keptIds, setKeptIds] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<"" | "empty" | "server">("");
  // Reentrancy guard for startGame, read via ref (not state) — a useCallback
  // whose deps include uiLang (itself flipped async by UILangContext right
  // after mount) can get re-memoized mid-flight and permanently freeze a
  // stale `starting` closure otherwise, silently no-op'ing every later call
  // (e.g. "Rejouer"). A ref is always current regardless of closure staleness.
  const startingRef = useRef(false);

  // TODO(Report lot): wire to POST /reports (expression_id, reason?, comment?, client_id?, ui_lang?)
  const handleReport = useCallback((expressionId: string) => {
    void expressionId;
  }, []);

  const startGame = useCallback(async (filters: VoyageFilters, isQuick: boolean) => {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setError("");
    try {
      const clientId = getCarnet().clientId as string;
      const userId = authSession?.user?.id;
      const apiFilters: GameSessionFilters = isQuick
        ? { locale: uiLang, quick: true }
        : {
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.kind ? { kind: filters.kind } : {}),
            ...(filters.domain ? { domain: filters.domain } : {}),
            locale: uiLang,
          };
      const s = await postGameSession("voyage", clientId, apiFilters, userId);
      if (s.cards.length === 0) {
        setError("empty");
        setPhase((p) => (p === "loading" ? "setup" : p));
        return;
      }
      setSession(s);
      setLastFilters(filters);
      setLastQuick(isQuick);
      setCardIndex(0);
      setKeptIds(new Set());
      setPhase("play");
    } catch {
      setError("server");
      setPhase((p) => (p === "loading" ? "setup" : p));
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [uiLang, authSession]);

  // Quick mode: fire the session request immediately on mount, no setup screen.
  useEffect(() => {
    if (quick) startGame(EMPTY_FILTERS, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeepToggle = useCallback((expressionId: string, kept: boolean) => {
    setKeptIds((prev) => {
      const next = new Set(prev);
      if (kept) next.add(expressionId); else next.delete(expressionId);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!session) return;
    if (cardIndex + 1 < session.cards.length) {
      setCardIndex((i) => i + 1);
      return;
    }
    // Last card: close the session (fire-and-forget) and show the recap
    // without waiting for the network round-trip.
    patchGameSession(session.id, Array.from(keptIds)).catch(() => {});
    setPhase("recap");
  }, [session, cardIndex, keptIds]);

  const handleReplay = useCallback(() => {
    startGame(lastFilters, lastQuick);
  }, [startGame, lastFilters, lastQuick]);

  const handleChangeFilters = useCallback(() => {
    setPhase("setup");
  }, []);

  const domainLabel = (slug: string) => {
    const d = EDITORIAL_DOMAINS.find((dm) => dm.slug === slug);
    return d ? `${d.emoji} ${d.labels[uiLang as keyof typeof d.labels] ?? d.labels.en}` : "";
  };

  const filtersChip = [
    lastFilters.country ? `${FLAG[lastFilters.country] ?? "🌍"} ${COUNTRY_NAME[lastFilters.country] ?? lastFilters.country}` : `🌍 ${t.allCountries}`,
    lastFilters.kind ? getTypeLabel(lastFilters.kind, uiLang) : `✨ ${t.allKinds}`,
    ...(lastFilters.domain ? [domainLabel(lastFilters.domain)] : []),
  ].join(" · ");

  const current = session?.cards[cardIndex];
  const countryCode = current ? (current.country || current.language) : "";
  const keptCards = session ? session.cards.filter((c) => keptIds.has(c.id)) : [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 76 }}>
        {(phase === "setup") && (
          <VoyageSetup
            uiLang={uiLang}
            initial={lastFilters}
            starting={starting}
            error={error}
            onStart={(filters) => startGame(filters, false)}
          />
        )}

        {phase === "loading" && (
          <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 44 }} className="wex-dice-idle" aria-hidden="true">🧳</span>
          </section>
        )}

        {phase === "play" && current && session && (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 118px 12px 14px",
              borderBottom: "1px solid var(--paper-edge)",
              background: "var(--paper)",
              zIndex: 3,
            }}>
              <Link
                href="/"
                aria-label={playT.quitAria}
                title={playT.quitAria}
                style={{ color: "var(--ink-softer)", fontSize: 17, textDecoration: "none" }}
              >
                ✕
              </Link>
              <button
                onClick={handleChangeFilters}
                style={{
                  background: "var(--plum-bg)",
                  color: "var(--plum-deep)",
                  border: "none",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {filtersChip}
                <span aria-hidden="true" style={{ marginLeft: 6, opacity: 0.75 }}>✎</span>
              </button>
              <span style={{ color: "var(--ink-faint)", fontSize: 12.5, flexShrink: 0, marginLeft: "auto" }}>
                {playT.cardCounter(cardIndex + 1, session.cards.length)}
              </span>
            </div>

            <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 16px" }}>
              {session.cards.map((c, i) => (
                <span
                  key={c.id}
                  aria-hidden="true"
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i === cardIndex
                      ? "var(--ochre)"
                      : i < cardIndex
                        ? (keptIds.has(c.id) ? "var(--terra)" : "var(--plum)")
                        : "var(--paper-edge)",
                    transform: i === cardIndex ? "scale(1.35)" : undefined,
                  }}
                />
              ))}
            </div>

            <div
              className={HERO_IMAGE_COUNTRIES.has(countryCode) ? "fade-bottom" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "4px 16px 16px",
                maxWidth: 460,
                margin: "0 auto",
                width: "100%",
              }}
            >
              <VoyageCard
                key={current.id}
                uiLang={uiLang}
                card={current}
                onNext={handleNext}
                onReport={handleReport}
                onKeepToggle={handleKeepToggle}
              />
            </div>
          </>
        )}

        {phase === "recap" && session && (
          <VoyageRecap
            uiLang={uiLang}
            cards={session.cards}
            keptCards={keptCards}
            onReplay={handleReplay}
            onChangeFilters={handleChangeFilters}
          />
        )}
      </main>

      <BottomNav uiLang={uiLang} />
    </div>
  );
}

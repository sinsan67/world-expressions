"use client";

/**
 * Voyage — the "Découverte" game (pivot-lot0-contract §1/§5, mockup
 * docs/mockups/pivot-jeu-decouverte.html). Absorbs Random mode.
 *
 * Single client route holding all 3 phases in-component state (no separate
 * URLs per phase, but the phase is mirrored into a `?screen=` query param —
 * see the history/persistence block below): setup (filters) → play (10
 * cards) → recap. `?quick=1` (read server-side in page.tsx) skips setup
 * entirely.
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
import { useScreenHistory } from "@/lib/useScreenHistory";
import {
  saveVoyageSession,
  loadVoyageSession,
  clearVoyageSession,
  saveLastFilters,
} from "@/lib/voyagePersistence";
import { HERO_IMAGE_COUNTRIES } from "@/lib/constants";
import { useUILangContext } from "@/lib/UILangContext";
import { VOYAGE_SETUP, VOYAGE_PLAY } from "@/lib/voyageLabels";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import VoyageSetup, { VoyageFilters, formatFiltersSummary } from "@/components/voyage/VoyageSetup";
import VoyageCard from "@/components/voyage/VoyageCard";
import VoyageRecap from "@/components/voyage/VoyageRecap";
import ReportReasonPicker from "@/components/ReportReasonPicker";

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
  // Guards the history/sessionStorage writes in startGame's success branch:
  // if the player navigates away while postGameSession is in flight, those
  // raw DOM/storage calls don't get silently dropped like a stale setState
  // would — without this they'd rewrite the address bar for a screen the
  // player already left.
  const mountedRef = useRef(true);
  useEffect(() => {
    // Must reset to true here, not just to false in the cleanup — React
    // Strict Mode's dev-mode mount→unmount→remount dance would otherwise
    // leave this stuck at false forever after the simulated unmount.
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // expression_id currently flagged, if the ReportReasonPicker is open.
  const [reportingId, setReportingId] = useState<string | null>(null);

  const handleReport = useCallback((expressionId: string) => {
    setReportingId(expressionId);
  }, []);

  // Mirrors the phase into a `?screen=` history entry (raw History API, not
  // router.push/replace — see useScreenHistory) so the Android/browser back
  // button steps back through the game instead of leaving /voyage entirely.
  const handleScreenPop = useCallback((value: string | null) => {
    if (value === "play" || value === "recap") {
      setPhase(value);
    } else {
      setPhase("setup");
      clearVoyageSession();
    }
  }, []);
  const { push: pushScreen, replace: replaceScreen, back: backScreen } = useScreenHistory("screen", handleScreenPop);

  const startGame = useCallback(async (filters: VoyageFilters, isQuick: boolean, historyAction: "push" | "replace" = "push") => {
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
      if (!mountedRef.current) return;
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
      if (!isQuick) saveLastFilters(filters);
      if (historyAction === "push") pushScreen("play"); else replaceScreen("play");
    } catch {
      if (!mountedRef.current) return;
      setError("server");
      setPhase((p) => (p === "loading" ? "setup" : p));
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [uiLang, authSession, pushScreen, replaceScreen]);

  // On mount: either resume a game in progress (Android killed the WebView
  // process and Next.js restarted fresh on /voyage?screen=play|recap — read
  // the persisted round back from sessionStorage) or, for a genuine fresh
  // quick-mode launch, fire the session request immediately (no setup
  // screen). Folded into one effect so the two cases can't race each other.
  useEffect(() => {
    const screenParam = new URLSearchParams(window.location.search).get("screen");
    if (screenParam !== "play" && screenParam !== "recap") {
      if (quick) startGame(EMPTY_FILTERS, true);
      return;
    }
    const persisted = loadVoyageSession();
    if (!persisted) {
      // Stale/direct link: no game to resume — clean the URL and fall back.
      replaceScreen(null);
      if (quick) startGame(EMPTY_FILTERS, true);
      return;
    }
    setSession(persisted.session);
    setCardIndex(persisted.cardIndex);
    setKeptIds(new Set(persisted.keptIds));
    setLastFilters(persisted.lastFilters);
    setLastQuick(persisted.lastQuick);
    setPhase(persisted.phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the in-progress round so it survives an Android process kill —
  // cleared as soon as the player is back at setup (handleScreenPop above).
  useEffect(() => {
    if ((phase !== "play" && phase !== "recap") || !session) return;
    saveVoyageSession({
      phase,
      session,
      cardIndex,
      keptIds: Array.from(keptIds),
      lastFilters,
      lastQuick,
    });
  }, [phase, session, cardIndex, keptIds, lastFilters, lastQuick]);

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
    replaceScreen("recap");
  }, [session, cardIndex, keptIds, replaceScreen]);

  const handleReplay = useCallback(() => {
    startGame(lastFilters, lastQuick, "replace");
  }, [startGame, lastFilters, lastQuick]);

  const handleChangeFilters = useCallback(() => {
    // Same mechanism as a real back-button press (handleScreenPop sets
    // phase to "setup" once the popstate fires), so both stay in sync.
    backScreen();
  }, [backScreen]);

  const filtersChip = formatFiltersSummary(lastFilters, uiLang, t);

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
            onStart={(filters, isQuick) => startGame(filters, !!isQuick)}
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
                onClick={() => clearVoyageSession()}
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

      {reportingId && (
        <ReportReasonPicker
          expressionId={reportingId}
          uiLang={uiLang}
          clientId={getCarnet().clientId}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
}

"use client";

/**
 * Révision — the flashcard game (pivot-lot0-contract §1/§5, mockups S195).
 * Draws ONLY from the player's favorites — no setup/filter screen (decision
 * #1: straight from the hub card into a mixed-language queue) and a lock
 * threshold of 5 favorites (decision #2) before it's playable.
 *
 * Phase shape mirrors app/voyage/Voyage.tsx but swaps "setup" for two
 * non-playable states (empty/locked) since there's nothing to configure.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  postGameSession,
  patchGameSession,
  getUserFavorites,
  reviewFavorite,
  GameSession,
} from "@/lib/api";
import { getCarnet, setFavoriteReview } from "@/lib/carnet";
import { useUILangContext } from "@/lib/UILangContext";
import { REVISION_LABELS } from "@/lib/revisionLabels";
import { buildRevisionQueue, FavoriteReviewState, REVISION_LOCK_THRESHOLD } from "@/lib/reviewQueue";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import RevisionCard from "@/components/revision/RevisionCard";
import RevisionRecap from "@/components/revision/RevisionRecap";
import RevisionEmpty from "@/components/revision/RevisionEmpty";
import ReportReasonPicker from "@/components/ReportReasonPicker";

type Phase = "loading" | "empty" | "locked" | "play" | "recap";

const QUEUE_LIMIT = 10;

export default function Revision() {
  const { uiLang } = useUILangContext();
  const { data: authSession, status } = useSession();
  const t = REVISION_LABELS[uiLang] ?? REVISION_LABELS.en;

  const [phase, setPhase] = useState<Phase>("loading");
  const [favorites, setFavorites] = useState<FavoriteReviewState[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, "knew" | "not_yet">>(new Map());
  const [reportingId, setReportingId] = useState<string | null>(null);
  // Reentrancy guard for startGame, read via ref (not state) — same rationale
  // as Voyage.tsx's startingRef: a useCallback whose deps include uiLang
  // (flipped async by UILangContext right after mount) can get re-memoized
  // mid-flight and permanently freeze a stale closure otherwise, silently
  // no-op'ing a later call (e.g. "Rejouer").
  const startingRef = useRef(false);

  const handleReport = useCallback((expressionId: string) => {
    setReportingId(expressionId);
  }, []);

  // Load favorites: server (logged-in, authoritative) or local carnet (anon)
  // — same dual path as app/collection/Collection.tsx.
  const loadFavorites = useCallback(async (): Promise<FavoriteReviewState[]> => {
    const userId = authSession?.user?.id;
    if (status === "authenticated" && userId) {
      try {
        const favs = await getUserFavorites(userId);
        return favs.map((f) => ({
          expressionId: f.expression_id,
          reviewBox: f.review_box,
          reviewedAt: f.reviewed_at,
        }));
      } catch {
        return [];
      }
    }
    const c = getCarnet();
    return c.favorites.map((f) => ({
      expressionId: f.expressionId,
      reviewBox: f.reviewBox,
      reviewedAt: f.reviewedAt,
    }));
  }, [status, authSession]);

  const startGame = useCallback(async (favs: FavoriteReviewState[]) => {
    if (startingRef.current) return;
    startingRef.current = true;
    setPhase("loading");
    try {
      const queueIds = buildRevisionQueue(favs, QUEUE_LIMIT);
      if (queueIds.length === 0) {
        setPhase("locked");
        return;
      }
      const clientId = getCarnet().clientId as string;
      const userId = authSession?.user?.id;
      const s = await postGameSession("revision", clientId, { locale: uiLang }, userId, queueIds);
      if (s.cards.length === 0) {
        // Edge case: favorites exist locally but the backend couldn't
        // hydrate any of them (e.g. deleted expressions) — fall back to
        // locked rather than a dead-end play screen with no cards.
        setPhase("locked");
        return;
      }
      setSession(s);
      setCardIndex(0);
      setAnswers(new Map());
      setPhase("play");
    } catch {
      setPhase("locked");
    } finally {
      startingRef.current = false;
    }
  }, [uiLang, authSession]);

  // On mount (once auth status resolves): load favorites, then route to
  // empty / locked / play depending on the count (decisions #1 and #2).
  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    loadFavorites().then((favs) => {
      if (cancelled) return;
      setFavorites(favs);
      if (favs.length === 0) {
        setPhase("empty");
      } else if (favs.length < REVISION_LOCK_THRESHOLD) {
        setPhase("locked");
      } else {
        startGame(favs);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleReplay = useCallback(async () => {
    const favs = await loadFavorites();
    setFavorites(favs);
    if (favs.length === 0) {
      setPhase("empty");
      return;
    }
    if (favs.length < REVISION_LOCK_THRESHOLD) {
      setPhase("locked");
      return;
    }
    startGame(favs);
  }, [loadFavorites, startGame]);

  const handleAnswer = useCallback((expressionId: string, result: "knew" | "not_yet") => {
    // Local carnet mirrors server state always (same "local mirrors server"
    // precedent as useFavorite.ts / CollectionToolbar's language-mode picker).
    setFavoriteReview(expressionId, result);
    const userId = authSession?.user?.id;
    if (userId) {
      // Fire-and-forget, not blocking navigation to the next card — same
      // keepalive pattern as useFavorite.ts's write.
      reviewFavorite(userId, expressionId, result).catch(() => {});
    }
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(expressionId, result);
      return next;
    });
  }, [authSession]);

  // Advance to the next card, or close the session and show the recap on
  // the last one. Split out of handleAnswer so it can read the latest
  // session/cardIndex without stale-closure risk.
  const advance = useCallback(() => {
    if (!session) return;
    if (cardIndex + 1 < session.cards.length) {
      setCardIndex((i) => i + 1);
    } else {
      // Revision never adds new favorites, so kept_ids is always empty.
      patchGameSession(session.id, []).catch(() => {});
      setPhase("recap");
    }
  }, [session, cardIndex]);

  const handleAnswerAndAdvance = useCallback((expressionId: string, result: "knew" | "not_yet") => {
    handleAnswer(expressionId, result);
    advance();
  }, [handleAnswer, advance]);

  const current = session?.cards[cardIndex];
  const knewCount = Array.from(answers.values()).filter((r) => r === "knew").length;
  // classifyFavorites partitions ALL favorites across its 3 buckets, so the
  // total due is simply favorites.length — if it's more than the queue cap,
  // there's more to review beyond this session.
  const hasMoreDue = !!session && session.cards.length >= QUEUE_LIMIT && favorites.length > QUEUE_LIMIT;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      <Sidebar uiLang={uiLang} />

      <main className="wex-main" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 76 }}>
        {phase === "loading" && (
          <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 44 }} className="wex-dice-idle" aria-hidden="true">🃏</span>
          </section>
        )}

        {(phase === "empty" || phase === "locked") && (
          <RevisionEmpty variant={phase} uiLang={uiLang} favoritesCount={favorites.length} />
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
                aria-label={t.quitAria}
                title={t.quitAria}
                style={{ color: "var(--ink-softer)", fontSize: 17, textDecoration: "none" }}
              >
                ✕
              </Link>
              <span style={{ color: "var(--ink-faint)", fontSize: 12.5, flexShrink: 0, marginLeft: "auto" }}>
                {cardIndex + 1}/{session.cards.length}
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
                        ? (answers.get(c.id) === "knew" ? "var(--terra)" : "var(--plum)")
                        : "var(--paper-edge)",
                    transform: i === cardIndex ? "scale(1.35)" : undefined,
                  }}
                />
              ))}
            </div>

            <div
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
              <RevisionCard
                key={current.id}
                uiLang={uiLang}
                card={current}
                onAnswer={handleAnswerAndAdvance}
                onReport={handleReport}
              />
            </div>
          </>
        )}

        {phase === "recap" && session && (
          <RevisionRecap
            uiLang={uiLang}
            knewCount={knewCount}
            total={session.cards.length}
            hasMoreDue={hasMoreDue}
            onReplay={handleReplay}
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

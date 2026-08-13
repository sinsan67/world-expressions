"use client";

/**
 * Jeu 3 — Constellation (docs/game3-constellation-lot0-contract.md).
 * Orchestration only: loads CONSTELLATION_LABELS[uiLang], fetches the graph
 * once via getConstellationGraph(uiLang) on mount, holds selectedTag/detail/
 * loading state, fetches tag detail on demand via getConstellationTag(tag,
 * uiLang) when a node is tapped — examples fade in automatically once that
 * resolves (S240, addendum §7.1 — no more "Révéler" click/reveal state).
 *
 * Renders a slim dark top bar (title + back-to-hub link, no Sidebar/
 * BottomNav) over a full-bleed 100dvh stage — deliberately different from
 * Voyage/Révision's chrome: the pan/zoom canvas needs the full viewport
 * without the mobile bottom bar or desktop sidebar colliding with the
 * wireframe's fixed hint/zoom-control corners. Like Voyage/Révision, this
 * route itself has no permanent nav-bar entry — the hub card is the only
 * way in.
 *
 * No `game_sessions` tracking for this game (contract §0.3) — free
 * exploration without a defined start/end, same status as Atlas/Explorer.
 * Only the ❤️ (inside ConstellationOverlay) is a tracked signal.
 *
 * `initialTag` (S240, addendum §7.3): set when arriving via the "Parcourir/
 * Filtrer" view's card-to-node link (`/constellation?tag=X`, read by
 * app/constellation/page.tsx). Once the graph has loaded, an effect opens
 * the overlay for that tag directly (reusing handleNodeTap as-is) and
 * ConstellationStage centers the camera on it at mount — no imperative ref,
 * this route change always remounts the component fresh.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConstellationGraph, getConstellationTag, type ConstellationGraph, type ConstellationTag } from "@/lib/api";
import { CONSTELLATION_LABELS } from "@/lib/constellationLabels";
import { useUILangContext } from "@/lib/UILangContext";
import ConstellationStage from "@/components/constellation/ConstellationStage";
import ConstellationOverlay from "@/components/constellation/ConstellationOverlay";

type Props = {
  initialTag?: string;
};

export default function Constellation({ initialTag }: Props) {
  const { uiLang } = useUILangContext();
  const t = CONSTELLATION_LABELS[uiLang] ?? CONSTELLATION_LABELS.en;

  const [graph, setGraph] = useState<ConstellationGraph | null>(null);
  const [graphError, setGraphError] = useState(false);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConstellationTag | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Graph loads once per uiLang change (labels are baked per-locale server-
  // side — see database.get_constellation_graph — so a language switch needs
  // a fresh fetch, unlike the tag detail which is fetched fresh per tap anyway).
  useEffect(() => {
    let cancelled = false;
    setGraphError(false);
    getConstellationGraph(uiLang)
      .then((g) => { if (!cancelled) setGraph(g); })
      .catch(() => { if (!cancelled) setGraphError(true); });
    return () => { cancelled = true; };
  }, [uiLang]);

  function handleNodeTap(tag: string) {
    setSelectedTag(tag);
    setDetail(null);
    setDetailLoading(true);
    getConstellationTag(tag, uiLang)
      .then((d) => setDetail(d))
      .catch(() => {
        // Defensive fallback — every tappable node comes straight from the
        // curated graph JSON, so a 404 here should never happen in
        // practice, but fall back to an empty-examples shape (using the
        // node's own emoji/label, already in hand from the graph) rather
        // than leaving the overlay stuck on a loading spinner.
        const node = graph?.nodes.find((n) => n.tag === tag);
        setDetail({ tag, emoji: node?.emoji ?? "✨", label: node?.label ?? tag, examples: [] });
      })
      .finally(() => setDetailLoading(false));
  }

  function handleClose() {
    setSelectedTag(null);
    setDetail(null);
  }

  // Deep-link entry from "Parcourir/Filtrer" (§7.3) — fires once the graph is
  // in hand so handleNodeTap can resolve the node's emoji/label immediately.
  useEffect(() => {
    if (initialTag && graph) handleNodeTap(initialTag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--ink)" }}>
      <header
        style={{
          padding: "0.85rem 1.1rem",
          background: "var(--ink)",
          borderBottom: "1.5px solid #3a2f28",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500, fontSize: "1.15rem", color: "var(--paper)" }}>
          ✨ {t.title}
        </div>
        <Link
          href="/"
          data-testid="constellation-back-to-hub"
          style={{
            color: "var(--paper)",
            textDecoration: "none",
            fontSize: "0.78rem",
            padding: "0.3rem 0.65rem",
            border: "1.5px solid var(--plum-soft)",
            borderRadius: 999,
          }}
        >
          ◂ {t.close}
        </Link>
      </header>

      {graphError && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)", padding: "1rem", textAlign: "center" }}>
          {t.placeholder}
        </div>
      )}

      {!graphError && !graph && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)" }}>
          …
        </div>
      )}

      {!graphError && graph && (
        <ConstellationStage
          graph={graph}
          hint={t.hint}
          browseLabel={t.browseEntryAria}
          onNodeTap={handleNodeTap}
          centerTag={initialTag}
        />
      )}

      <ConstellationOverlay
        open={!!selectedTag}
        loading={detailLoading}
        detail={detail}
        onClose={handleClose}
        labels={t}
      />
    </div>
  );
}

"use client";

/**
 * Pan/zoom engine for Jeu 3 — Constellation. Ports
 * scratchpad/wireframe-game3-constellation.html's engine essentially
 * verbatim (native pointerdown/pointermove/pointerup/wheel/gesturestart
 * listeners, world.style.transform = translate(...) scale(...) — same
 * mechanism validated by the S197 perf spike, contract game3-constellation-
 * lot0 §0/§6: "reprend tel quel le verdict du spike perf S197").
 *
 * REQUIRED adaptation for React, called out explicitly in the build plan:
 * pan/zoom state (scale, tx, ty, active pointers) lives in plain variables
 * captured by this effect's closure — NOT useState — and every gesture
 * handler mutates them directly and writes straight to the DOM via
 * world.style.transform, bypassing React's render cycle entirely for every
 * pointermove/wheel frame. A naive setState-per-frame port would re-render
 * the whole 150+-node list on every drag/pinch tick, silently defeating the
 * entire point of porting from the wireframe instead of just rebuilding it
 * "the React way".
 *
 * Node/edge DOM is rendered once from the static `graph` prop (a plain
 * React map over `graph.nodes`/`graph.edges` — since the graph never
 * changes after the initial fetch, this really does render once, same
 * spirit as the wireframe's one-time `NODES.forEach(...)` DOM injection).
 *
 * One deliberate spec deviation vs the wireframe, mandated by the contract:
 * no `backdrop-filter` on `.node` (mobile compositing cost at 150+
 * simultaneous nodes — the wireframe's blur is replaced by a plain
 * semi-transparent fill).
 */

import { useEffect, useRef } from "react";
import type { ConstellationGraph } from "@/lib/api";

type Props = {
  graph: ConstellationGraph;
  hint: string;
  onNodeTap: (tag: string) => void;
};

const MARGIN = 80;
const INITIAL_SCALE = 0.55;
const INITIAL_TX = 40;
const INITIAL_TY = 20;
const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
// Max movement (client px) between pointerdown and pointerup still counted
// as a tap rather than a drag — see the tap-detection note below.
const TAP_THRESHOLD = 8;

export default function ConstellationStage({ graph, hint, onNodeTap }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);
  const zoomResetRef = useRef<HTMLButtonElement>(null);
  // Read inside the pointer-event closure below (which is set up once on
  // mount) so it always calls the LATEST onNodeTap from props, not whatever
  // was passed in on the very first render.
  const onNodeTapRef = useRef(onNodeTap);
  useEffect(() => { onNodeTapRef.current = onNodeTap; }, [onNodeTap]);

  // Canvas bounds derived once from the static node positions — no hardcoded
  // 1600×1000 (the wireframe's reference size). The generator script scales
  // the layout by sqrt(n/41) relative to that reference (see
  // scripts/build_constellation_graph.py), so the real canvas grows/shrinks
  // with node count; computing it from the actual data keeps this component
  // correct regardless of how many nodes a future regeneration produces.
  const maxX = Math.max(...graph.nodes.map((n) => n.x), 0) + MARGIN;
  const maxY = Math.max(...graph.nodes.map((n) => n.y), 0) + MARGIN;

  useEffect(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;

    let scale = INITIAL_SCALE;
    let tx = INITIAL_TX;
    let ty = INITIAL_TY;
    const pointers = new Map<number, { x: number; y: number }>();
    // Down position per pointerId, kept separately from `pointers` (which
    // tracks the LATEST position) so tap detection can measure total
    // movement since pointerdown once pointerup arrives.
    const downPositions = new Map<number, { x: number; y: number }>();
    let lastDist: number | null = null;
    let dragStart: { x: number; y: number } | null = null;
    // True once a 2nd pointer has been down simultaneously with this one —
    // guards a pinch's final finger-lift from being misread as a tap.
    let wasMultiTouch = false;

    function apply() {
      world!.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    }
    function clampScale(s: number) {
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
    }
    apply();

    function onPointerDown(e: PointerEvent) {
      // Capturing keeps pointermove/pointerup firing on `viewport` even if
      // the finger/cursor drifts outside its bounds mid-drag — required for
      // a reliable pan. Side effect (Chromium, confirmed against both this
      // port and the original vanilla-JS wireframe): once a pointer is
      // captured, the browser retargets the resulting "click" compatibility
      // event to the CAPTURING element (viewport) instead of whatever was
      // actually under the pointer — so a node <button>'s own onClick never
      // fires for a mouse/touch tap once this line runs. That's why "tap"
      // is detected manually below (pointerup + elementFromPoint) instead
      // of relying on the native click event. onClick is kept on the
      // buttons purely for keyboard activation (Enter/Space), which never
      // goes through pointer capture at all.
      viewport!.setPointerCapture(e.pointerId);
      viewport!.style.cursor = "grabbing";
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      downPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragStart = { x: e.clientX - tx, y: e.clientY - ty };
      } else {
        wasMultiTouch = true;
      }
    }
    function onPointerMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && dragStart) {
        tx = e.clientX - dragStart.x;
        ty = e.clientY - dragStart.y;
        apply();
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastDist) {
          scale = clampScale(scale * (dist / lastDist));
          apply();
        }
        lastDist = dist;
      }
    }
    function endPointer(e: PointerEvent) {
      const down = downPositions.get(e.pointerId);
      const wasTap =
        !wasMultiTouch &&
        pointers.size === 1 && // this was the only active pointer (not the tail of a pinch)
        !!down &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_THRESHOLD;

      pointers.delete(e.pointerId);
      downPositions.delete(e.pointerId);
      viewport!.style.cursor = "grab";
      if (pointers.size < 2) lastDist = null;
      if (pointers.size === 0) {
        dragStart = null;
        wasMultiTouch = false;
      }

      if (wasTap) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const tag = (el as HTMLElement | null)?.closest<HTMLElement>("[data-tag]")?.dataset.tag;
        if (tag) onNodeTapRef.current(tag);
      }
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      scale = clampScale(scale - e.deltaY * 0.0012);
      apply();
    }
    // gesturestart is a non-standard Safari-only event (pinch on trackpad/
    // touch) — preventing it stops the browser's own page-zoom gesture from
    // fighting with our own pinch handling. Not in lib.dom's typed event map.
    function onGestureStart(e: Event) {
      e.preventDefault();
    }
    function zoomIn() { scale = clampScale(scale * 1.25); apply(); }
    function zoomOut() { scale = clampScale(scale / 1.25); apply(); }
    function zoomReset() { scale = INITIAL_SCALE; tx = INITIAL_TX; ty = INITIAL_TY; apply(); }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("pointerleave", endPointer);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("gesturestart", onGestureStart);

    const zoomInBtn = zoomInRef.current;
    const zoomOutBtn = zoomOutRef.current;
    const zoomResetBtn = zoomResetRef.current;
    zoomInBtn?.addEventListener("click", zoomIn);
    zoomOutBtn?.addEventListener("click", zoomOut);
    zoomResetBtn?.addEventListener("click", zoomReset);

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endPointer);
      viewport.removeEventListener("pointercancel", endPointer);
      viewport.removeEventListener("pointerleave", endPointer);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("gesturestart", onGestureStart);
      zoomInBtn?.removeEventListener("click", zoomIn);
      zoomOutBtn?.removeEventListener("click", zoomOut);
      zoomResetBtn?.removeEventListener("click", zoomReset);
    };
    // Runs once on mount only — `graph` is fetched once and never changes
    // for the component's lifetime (Constellation.tsx never re-fetches it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        overflow: "hidden",
        touchAction: "none",
        background: "radial-gradient(ellipse at 50% 40%, #241a15 0%, var(--ink) 70%)",
      }}
    >
      <div ref={viewportRef} style={{ position: "absolute", inset: 0, cursor: "grab" }}>
        <div
          ref={worldRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: maxX,
            height: maxY,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <svg
            width={maxX}
            height={maxY}
            viewBox={`0 0 ${maxX} ${maxY}`}
            style={{ position: "absolute", top: 0, left: 0 }}
            aria-hidden="true"
          >
            {graph.edges.map(([i, j], idx) => {
              const a = graph.nodes[i];
              const b = graph.nodes[j];
              if (!a || !b) return null;
              return (
                <line
                  key={idx}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#c9b8d9"
                  strokeWidth={1.2}
                  opacity={0.35}
                />
              );
            })}
          </svg>
          {graph.nodes.map((n) => (
            <button
              key={n.tag}
              type="button"
              data-testid={`constellation-node-${n.tag}`}
              data-tag={n.tag}
              aria-label={n.label}
              // Fires for keyboard activation (Enter/Space) only — real
              // pointer/mouse/touch taps are handled in the pointerup
              // handler above (see the long comment in onPointerDown for
              // why: pointer capture retargets the resulting click away
              // from this button before it ever reaches onClick).
              onClick={() => onNodeTap(n.tag)}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                margin: "-26px 0 0 -26px",
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "rgba(253,248,238,0.06)",
                border: "1.5px solid rgba(201,184,217,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {n.emoji}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: "1rem",
          bottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          zIndex: 15,
        }}
      >
        <button ref={zoomInRef} type="button" aria-label="Zoom in" style={zoomBtnStyle}>+</button>
        <button ref={zoomOutRef} type="button" aria-label="Zoom out" style={zoomBtnStyle}>−</button>
        <button ref={zoomResetRef} type="button" aria-label="Reset zoom" style={zoomBtnStyle}>⤾</button>
      </div>

      <div
        style={{
          position: "absolute",
          left: "1rem",
          bottom: "1rem",
          fontSize: "0.75rem",
          color: "var(--plum-soft)",
          background: "rgba(28,20,16,0.6)",
          padding: "0.35rem 0.6rem",
          borderRadius: 8,
          maxWidth: 240,
          zIndex: 15,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1.5px solid rgba(201,184,217,0.45)",
  background: "rgba(253,248,238,0.08)",
  color: "var(--paper)",
  fontSize: "1.1rem",
  cursor: "pointer",
};

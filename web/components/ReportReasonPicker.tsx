"use client";

/**
 * Report 🚩 — small centered card (not a big multi-step flow) to flag a
 * wrong/fabricated expression. Backend already live (POST /reports,
 * models.py ExpressionReport). Overlay/backdrop conventions copied from
 * AuthModal.tsx (position fixed, backdrop click closes, stopPropagation on
 * the card) — kept much simpler: no multi-view state machine, just
 * picker → (posting) → thanks, auto-closing after ~1.5s.
 */

import { useEffect, useState } from "react";
import { reportExpression } from "@/lib/api";
import { REPORT_LABELS } from "@/lib/reportLabels";

type Reason = "fabricated" | "wrong-translation" | "duplicate" | "other";

type Props = {
  expressionId: string;
  uiLang: string;
  clientId?: string;
  onClose: () => void;
};

export default function ReportReasonPicker({ expressionId, uiLang, clientId, onClose }: Props) {
  const t = REPORT_LABELS[uiLang] ?? REPORT_LABELS.en;
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Escape key closes, same as other overlays in this app.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-close ~1.5s after the thanks confirmation shows.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(onClose, 1500);
    return () => clearTimeout(id);
  }, [done, onClose]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportExpression({
        expression_id: expressionId,
        reason: reason ?? undefined,
        comment: comment.trim() || undefined,
        client_id: clientId,
        ui_lang: uiLang,
      });
    } catch {
      // Best-effort — the report is non-critical, don't block the user with
      // an error state; just show the same thanks confirmation.
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  }

  const reasonOptions: { key: Reason; label: string }[] = [
    { key: "fabricated", label: t.reasons.fabricated },
    { key: "wrong-translation", label: t.reasons.wrongTranslation },
    { key: "duplicate", label: t.reasons.duplicate },
    { key: "other", label: t.reasons.other },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,20,16,0.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg)",
          padding: "1.5rem",
          maxWidth: 340,
          width: "100%",
          boxShadow: "var(--shadow-deep, 0 8px 40px rgba(28,20,16,0.18))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", textAlign: "center", margin: "1rem 0" }}>
            {t.thanks}
          </p>
        ) : (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: "0.9rem", fontFamily: "var(--font-body)" }}>
              {t.title}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.9rem" }}>
              {reasonOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setReason(opt.key)}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "var(--r-md)",
                    border: `1.5px solid ${reason === opt.key ? "var(--terra)" : "var(--paper-edge)"}`,
                    background: reason === opt.key ? "var(--terra-bg, rgba(180,80,40,0.08))" : "var(--paper)",
                    color: "var(--ink)",
                    fontSize: 13.5,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              rows={2}
              style={{
                width: "100%",
                padding: "0.5rem 0.65rem",
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--paper-edge)",
                background: "var(--paper)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                marginBottom: "0.9rem",
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "var(--r-pill)",
                border: "none",
                background: "var(--terra)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {t.submit}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

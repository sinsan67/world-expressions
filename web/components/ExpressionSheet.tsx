"use client";

/**
 * Expression bottom-sheet (lot N2, atelier S208 décision 2, mockup
 * mockup-nav-globale-A): on /search, opening a result card slides this
 * sheet OVER the list — back (or the veil, or ✕) closes the sheet and the
 * list is still there, scroll intact. Deliberately a light card — the
 * "full card" link hands over to /expression/[id] for origin stories,
 * equivalents and neighbors. This keeps app/expression/[id]/page.tsx
 * untouched (a parallel worktree is modifying it).
 *
 * `expression` is the in-memory object from the results list (instant
 * open, no fetch); it's absent on a deep link / reload (?sheet=<id> in the
 * URL), in which case the sheet fetches by id.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExpression, Expression } from "@/lib/api";
import { FLAG } from "@/lib/constants";
import { cap } from "@/lib/utils";
import { getTypeLabel } from "@/lib/typeLabels";
import { useAudio } from "@/lib/useAudio";
import { useFavorite } from "@/lib/useFavorite";
import { FAV_LABEL, LISTEN_LABEL } from "@/lib/uiLabels";
import { Heart, Volume2, VolumeX } from "lucide-react";

const LABELS: Record<string, { origin: string; example: string; fullCard: string; closeAria: string }> = {
  fr: { origin: "Origine",   example: "Exemple",  fullCard: "Voir la fiche complète →",  closeAria: "Retour aux résultats" },
  en: { origin: "Origin",    example: "Example",  fullCard: "See the full card →",       closeAria: "Back to results" },
  es: { origin: "Origen",    example: "Ejemplo",  fullCard: "Ver la ficha completa →",   closeAria: "Volver a los resultados" },
  it: { origin: "Origine",   example: "Esempio",  fullCard: "Vedi la scheda completa →", closeAria: "Torna ai risultati" },
  tr: { origin: "Köken",     example: "Örnek",    fullCard: "Tam kartı gör →",           closeAria: "Sonuçlara dön" },
  de: { origin: "Herkunft",  example: "Beispiel", fullCard: "Ganze Karte ansehen →",     closeAria: "Zurück zu den Ergebnissen" },
  ja: { origin: "由来",      example: "例文",     fullCard: "カード全体を見る →",         closeAria: "検索結果に戻る" },
};

type Props = {
  id: string;
  expression?: Expression;
  uiLang: string;
  onClose: () => void;
  fromSearch?: string;
};

export default function ExpressionSheet({ id, expression, uiLang, onClose, fromSearch }: Props) {
  const [expr, setExpr] = useState<Expression | null>(expression ?? null);
  const t = LABELS[uiLang] ?? LABELS.en;
  const favLabel = FAV_LABEL[uiLang] ?? FAV_LABEL.en;
  const listenLabel = LISTEN_LABEL[uiLang] ?? LISTEN_LABEL.en;

  const [fav, handleFav] = useFavorite(id);
  const { speaking, voiceAvailable, handleListen } = useAudio(expr?.expression ?? "", expr?.language ?? "");

  // Deep link / reload: the results list can't hand us the object, fetch it.
  useEffect(() => {
    if (expression) { setExpr(expression); return; }
    let cancelled = false;
    setExpr(null);
    getExpression(id, uiLang)
      .then((e) => { if (!cancelled) setExpr(e); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, expression, uiLang]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const flag = expr ? (FLAG[expr.country] || FLAG[expr.region] || "🌍") : "";
  const typeLabel = expr ? getTypeLabel(expr.type ?? "expression", uiLang) : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,20,16,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="expression-sheet"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderRadius: "var(--r-lg) var(--r-lg) 0 0",
          boxShadow: "0 -8px 30px rgba(28,20,16,0.25)",
          width: "100%",
          maxWidth: 680,
          maxHeight: "78vh",
          overflowY: "auto",
          padding: "0.75rem 1.5rem 1.5rem",
          position: "relative",
          animation: "sheetSlideUp 0.25s ease-out",
        }}
      >
        {/* Grip */}
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: 2, background: "var(--ink-faint)", margin: "0 auto 0.9rem" }} />

        <button
          onClick={onClose}
          aria-label={t.closeAria}
          title={t.closeAria}
          style={{
            position: "absolute",
            top: "0.85rem",
            right: "1rem",
            background: "none",
            border: "none",
            fontSize: 16,
            color: "var(--ink-softer)",
            cursor: "pointer",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {!expr ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem 0" }}>
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--paper-edge)", borderTopColor: "var(--plum)" }} />
          </div>
        ) : (
          <>
            {/* Header: flag + badges + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }} title={(expr.country || expr.region || "").toUpperCase()}>{flag}</span>
              {typeLabel && (
                <span style={{
                  fontSize: 10.5,
                  background: "var(--terra-bg)",
                  color: "var(--terra)",
                  border: "1px solid var(--terra-soft)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}>
                  {typeLabel}
                </span>
              )}
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, paddingRight: 30 }}>
                <button
                  onClick={voiceAvailable === false ? undefined : handleListen}
                  title={speaking ? listenLabel.stop : listenLabel.listen}
                  disabled={voiceAvailable === false}
                  style={{
                    background: "none", border: "none", padding: 0, lineHeight: 1,
                    cursor: voiceAvailable === false ? "not-allowed" : "pointer",
                    opacity: voiceAvailable === false ? 0.3 : 1,
                    color: speaking ? "var(--plum)" : "var(--ink-faint)",
                  }}
                >
                  {speaking ? <VolumeX size={17} strokeWidth={1.5} /> : <Volume2 size={17} strokeWidth={1.5} />}
                </button>
                <button
                  onClick={handleFav}
                  title={fav ? favLabel.remove : favLabel.add}
                  style={{ background: "none", border: "none", padding: 0, lineHeight: 1, cursor: "pointer", color: fav ? "var(--terra)" : "var(--ink-faint)" }}
                >
                  <Heart size={17} strokeWidth={1.5} fill={fav ? "var(--terra)" : "none"} />
                </button>
              </span>
            </div>

            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, color: "var(--ink)", margin: "0 0 2px", lineHeight: 1.25 }}>
              {cap(expr.expression)}
            </h2>
            {expr.literal && expr.language !== uiLang && (
              <p style={{ fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic", margin: "0 0 10px" }}>{expr.literal}</p>
            )}

            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5, margin: "8px 0 0" }}>{expr.meaning}</p>

            {expr.example && (
              <p style={{
                fontSize: 13,
                color: "var(--ink-softer)",
                fontStyle: "italic",
                borderLeft: "2px solid var(--paper-fold)",
                paddingLeft: 10,
                margin: "12px 0 0",
              }}>
                {expr.example}
              </p>
            )}

            {expr.origin && (
              <p style={{ fontSize: 13, color: "var(--ink-softer)", lineHeight: 1.5, margin: "12px 0 0" }}>
                <strong>{t.origin} :</strong> {expr.origin}
              </p>
            )}

            <Link
              href={`/expression/${id}?lang=${uiLang}${fromSearch ? `&from_search=${encodeURIComponent(fromSearch)}` : ""}`}
              style={{
                display: "inline-block",
                marginTop: 16,
                fontSize: 13.5,
                fontWeight: 700,
                color: "var(--plum)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {t.fullCard}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

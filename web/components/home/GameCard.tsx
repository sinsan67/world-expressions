"use client";

import Link from "next/link";

// Hub game card — three visual variants matching docs/mockups/pivot-hub.html
// (.game-card.discover / .game-card.review). "discover" = Voyage (plum),
// "review" = Révision (terra), "constellation" = Jeu 3 (ochre — see
// docs/game3-constellation-lot0-contract.md). See docs/pivot-lot0-contract.md
// §1/§5 (lot A) for discover/review's original spec.

type Variant = "discover" | "review" | "constellation";

type Chip = { label: string; tone?: "default" | "warn" };

type Props = {
  variant: Variant;
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  testId?: string;
  // Optional small pill row between the subtitle and the CTA button — used
  // by Révision (lot D) to surface favorites/to-review counts on the hub.
  // Purely additive: Voyage's card doesn't pass this, so nothing renders.
  chips?: Chip[];
};

const VARIANT_STYLES: Record<Variant, { background: string; border: string; cta: string }> = {
  discover: {
    background: "linear-gradient(135deg, var(--plum-bg), #f7f2fa 70%)",
    border: "var(--plum-soft)",
    cta: "var(--plum)",
  },
  review: {
    background: "linear-gradient(135deg, var(--terra-bg), #fbf1ea 70%)",
    border: "var(--terra-soft)",
    cta: "var(--terra)",
  },
  constellation: {
    background: "linear-gradient(135deg, var(--ochre-bg), #fbf6e2 70%)",
    border: "var(--ochre-soft)",
    cta: "var(--ochre-deep)",
  },
};

export default function GameCard({ variant, emoji, title, subtitle, ctaLabel, href, testId, chips }: Props) {
  const styles = VARIANT_STYLES[variant];

  return (
    <Link
      href={href}
      data-testid={testId}
      style={{
        display: "block",
        position: "relative",
        borderRadius: "var(--r-lg)",
        padding: "1.15rem 1.15rem 1rem",
        boxShadow: "var(--shadow-card)",
        background: styles.background,
        border: `1px solid ${styles.border}`,
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 150ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) rotate(-0.3deg)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      <div style={{ fontSize: 34, lineHeight: 1 }} aria-hidden="true">{emoji}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: "0.5rem", color: "var(--ink)" }}>
        {title}
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.4, maxWidth: "78%" }}>
        {subtitle}
      </p>
      {chips && chips.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, maxWidth: "78%" }}>
          {chips.map((chip, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                background: chip.tone === "warn" ? "var(--ochre-bg)" : "rgba(255,255,255,0.55)",
                color: chip.tone === "warn" ? "var(--ochre-deep)" : "var(--ink-soft)",
                border: chip.tone === "warn" ? "1px solid var(--ochre)" : "1px solid var(--paper-edge)",
              }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}
      <span
        style={{
          position: "absolute",
          right: 16,
          bottom: 14,
          fontSize: 14,
          fontWeight: 700,
          padding: "8px 16px",
          borderRadius: "var(--r-pill)",
          background: styles.cta,
          color: "#fff",
          fontFamily: "var(--font-body)",
        }}
      >
        {ctaLabel}
      </span>
    </Link>
  );
}

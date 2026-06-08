"use client";

import { EMOJI_KEYBOARD } from "@/lib/tagIcons";

type Props = {
  onSelect: (slug: string) => void;
  size?: number;
};

export default function EmojiKeyboard({ onSelect, size = 44 }: Props) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`,
      gap: "0.2rem",
    }}>
      {EMOJI_KEYBOARD.map(({ emoji, slug }) => (
        <button
          key={slug}
          title={slug}
          onClick={() => onSelect(slug)}
          style={{
            width: size,
            height: size,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: size >= 44 ? "1.5rem" : "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.1s, transform 0.1s",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "var(--paper-edge)";
            el.style.transform = "scale(1.18)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "transparent";
            el.style.transform = "scale(1)";
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

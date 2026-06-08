import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emoji & Themes — World Expressions",
  description: "Browse all idiomatic expression concepts by emoji and theme: emotions, relations, wisdom, humor, nature, and more across 20 domains.",
  openGraph: {
    title: "Emoji & Themes — World Expressions",
    description: "Browse all idiomatic expression concepts by emoji and theme across 20 domains.",
    url: "https://world-expressions.vercel.app/emojis",
    type: "website",
  },
};

export default function EmojisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

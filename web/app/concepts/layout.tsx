import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concepts — World Expressions",
  description: "Browse idiomatic expressions by theme and concept across languages: love, money, animals, travel, and more.",
  openGraph: {
    title: "Concepts — World Expressions",
    description: "Browse idiomatic expressions by theme and concept across languages: love, money, animals, travel, and more.",
    url: "https://world-expressions.vercel.app/concepts",
    type: "website",
  },
};

export default function ConceptsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

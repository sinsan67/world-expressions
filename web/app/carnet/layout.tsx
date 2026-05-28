import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Carnet — World Expressions",
  description: "Your personal travel journal. Track your favourite expressions, browsing history, and explore your linguistic journey.",
  openGraph: {
    title: "Mon Carnet — World Expressions",
    description: "Your personal travel journal. Track your favourite expressions, browsing history, and explore your linguistic journey.",
    url: "https://world-expressions.vercel.app/carnet",
    type: "website",
  },
};

export default function CarnetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

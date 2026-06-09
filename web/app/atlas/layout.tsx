import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atlas — World Expressions",
  description: "Explore idiomatic expressions from every country. Browse France, UK, USA, Spain, Turkey, Italy and more.",
  openGraph: {
    title: "Atlas — World Expressions",
    description: "Explore idiomatic expressions from every country. Browse France, UK, USA, Spain, Turkey, Italy and more.",
    url: "https://worldexpressions.app/atlas",
    type: "website",
  },
};

export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

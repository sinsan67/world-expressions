import type { Metadata } from "next";

const SITE = "https://worldexpressions.app";

const COUNTRY_NAME: Record<string, string> = {
  fr: "France", uk: "United Kingdom", us: "United States", au: "Australia",
  es: "Spain", tr: "Turkey", it: "Italy",
  ar: "Argentina", mx: "Mexico", co: "Colombia", cl: "Chile",
  pe: "Peru", cu: "Cuba", ve: "Venezuela",
};

type Props = {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRY_NAME[code] ?? code.toUpperCase();
  const title = `${country} — World Expressions`;
  const description = `Explore idiomatic expressions from ${country}. Discover the language, culture, and sayings of ${country}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/country/${code}`,
      type: "website",
    },
  };
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

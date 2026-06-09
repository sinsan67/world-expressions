import type { Metadata } from "next";

const SITE = "https://worldexpressions.app";

const REGION_NAME: Record<string, string> = {
  alsace: "Alsace",
  bretagne: "Bretagne",
};

type Props = {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const region = REGION_NAME[code] ?? code;
  const title = `${region} — World Expressions`;
  const regionDescriptions: Record<string, string> = {
    alsace: `Explorez les expressions et régionalismes de ${region}. Mots, locutions et calques du parler alsacien.`,
    bretagne: `Explorez les expressions et régionalismes de ${region}. Mots bretons, termes marins et expressions du terroir breton.`,
  };
  const description = regionDescriptions[code] ?? `Explorez les expressions et régionalismes de ${region}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/regions/${code}`,
      type: "website",
    },
  };
}

export default function RegionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

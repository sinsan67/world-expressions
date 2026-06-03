import type { Metadata } from "next";

const SITE = "https://world-expressions.vercel.app";

const REGION_NAME: Record<string, string> = {
  alsace: "Alsace",
};

type Props = {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const region = REGION_NAME[code] ?? code;
  const title = `${region} — World Expressions`;
  const description = `Explorez les expressions et régionalismes de ${region}. Mots, locutions et calques du parler alsacien.`;
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

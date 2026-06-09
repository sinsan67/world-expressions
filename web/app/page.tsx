import type { Metadata } from "next";
import HomePage from "./HomePage";

const SITE = "https://worldexpressions.app";

const OG_DESCRIPTIONS: Record<string, string> = {
  fr: "Chaque langue a sa propre folie.",
  en: "Every language has its own madness.",
  es: "Cada idioma tiene su propia locura.",
  it: "Ogni lingua ha la sua follia.",
  tr: "Her dilin kendine özgü çılgınlığı vardır.",
};

type Props = { searchParams: Promise<{ og_lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { og_lang } = await searchParams;
  const lang = og_lang && OG_DESCRIPTIONS[og_lang] ? og_lang : "en";
  const description = OG_DESCRIPTIONS[lang];
  return {
    description,
    openGraph: {
      title: "World Expressions",
      description,
      url: SITE,
      siteName: "World Expressions",
      type: "website",
    },
  };
}

export default function Page() {
  return <HomePage />;
}

import type { Metadata } from "next";
import Hub from "./Hub";

const SITE = "https://worldexpressions.app";

const OG_DESCRIPTIONS: Record<string, string> = {
  fr: "Chaque langue a sa propre folie.",
  en: "Every language has its own madness.",
  es: "Cada idioma tiene su propia locura.",
  it: "Ogni lingua ha la sua follia.",
  tr: "Her dilin kendine özgü çılgınlığı vardır.",
  de: "Jede Sprache hat ihren eigenen Wahnsinn.",
  ja: "すべての言語には、固有の狂気がある。",
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
  return <Hub />;
}

import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE = "https://worldexpressions.app";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/expression/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};
    const expr = await res.json();
    const title = `${expr.expression} — World Expressions`;
    const description = (expr.meaning as string)?.slice(0, 160) ?? "Discover idiomatic expressions from around the world.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE}/expression/${id}`,
        type: "article",
      },
    };
  } catch {
    return {};
  }
}

export default function ExpressionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

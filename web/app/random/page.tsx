import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function RandomPage({
  searchParams,
}: {
  searchParams: Promise<{ prev?: string; lang?: string }>;
}) {
  await connection();
  const { prev, lang } = await searchParams;
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  let id: string | null = null;
  try {
    const res = await fetch(`${API}/random`, { cache: "no-store" });
    if (res.ok) {
      const expr = await res.json();
      if (expr?.id) id = expr.id;
    }
  } catch {
    // API unavailable, fall through to home
  }
  if (!id) redirect("/");
  const params = new URLSearchParams();
  if (lang) params.set("lang", lang);
  if (prev) params.set("prev", prev);
  const qs = params.toString();
  redirect(`/expression/${id}${qs ? "?" + qs : ""}`);
}

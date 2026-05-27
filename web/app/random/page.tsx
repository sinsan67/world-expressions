import { redirect } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function RandomPage() {
  try {
    const res = await fetch(`${API}/random`, { cache: "no-store" });
    if (res.ok) {
      const expr = await res.json();
      if (expr?.id) redirect(`/expression/${expr.id}`);
    }
  } catch {
    // API unavailable, fall through to home
  }
  redirect("/");
}

import type { MetadataRoute } from "next";
import { API_URL as API } from "@/lib/constants";

const SITE = "https://worldexpressions.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().slice(0, 10);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: today, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/atlas`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/emoji`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/carnet`, lastModified: today, changeFrequency: "never", priority: 0.3 },
    { url: `${SITE}/random`, lastModified: today, changeFrequency: "always", priority: 0.5 },
  ];

  let expressionRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugsRes = await fetch(`${API}/slugs`, { next: { revalidate: 86400 } });
    if (slugsRes.ok) {
      const data = await slugsRes.json();
      const slugs: string[] = data.slugs ?? [];
      expressionRoutes = slugs.map((slug) => ({
        url: `${SITE}/expression/${slug}`,
        lastModified: today,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // silently skip — sitemap still valid without expressions
  }

  let countryRoutes: MetadataRoute.Sitemap = [];
  try {
    const regionsRes = await fetch(`${API}/regions`, { next: { revalidate: 86400 } });
    if (regionsRes.ok) {
      const regions: { code: string }[] = await regionsRes.json();
      countryRoutes = regions.map(({ code }) => ({
        url: `${SITE}/country/${code}`,
        lastModified: today,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // silently skip
  }

  return [...staticRoutes, ...countryRoutes, ...expressionRoutes];
}

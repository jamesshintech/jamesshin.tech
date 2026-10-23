import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/data/config";
import { getAllPosts } from "@/lib/writing";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/writing"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/log"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  for (const p of getAllPosts()) {
    entries.push({
      url: absoluteUrl(`/writing/${p.slug}`),
      lastModified: new Date(p.date),
      changeFrequency: "yearly",
      priority: 0.8,
    });
  }

  return entries;
}

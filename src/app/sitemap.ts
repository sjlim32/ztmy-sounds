import type { MetadataRoute } from "next";
import { songList } from "@/features/guide/data/songs";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/info": 0.8,
  "/guide": 0.8,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = ["/", "/guide", "/info"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: PRIORITY[path],
  }));

  const songRoutes = songList.map((song) => ({
    url: `${SITE_URL}/guide/${song.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...songRoutes];
}

import type { MetadataRoute } from "next";
import { songList } from "@/data/songs";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/guide", "/info"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  const songRoutes = songList.map((song) => ({
    url: `${SITE_URL}/guide/${song.id}`,
  }));

  return [...staticRoutes, ...songRoutes];
}

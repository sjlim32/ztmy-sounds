import type { MetadataRoute } from "next";
import { songList } from "@/features/guide/data/songs";
import { getSongsWithTag } from "@/features/guide/lib/song-call-tags";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/info": 0.8,
  "/guide": 0.8,
  "/slam": 0.6,
  "/zutopia": 0.5,
  "/credits": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const slamSongList = getSongsWithTag("slam", songList);

  const staticRoutes = ["/", "/guide", "/info", "/slam", "/zutopia", "/credits"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: PRIORITY[path],
    }),
  );

  const songRoutes = songList.map((song) => ({
    url: `${SITE_URL}/guide/${song.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const slamSongRoutes = slamSongList.map((song) => ({
    url: `${SITE_URL}/slam/${song.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const zutopiaCategoryRoutes = ZUTOPIA_CATEGORIES.map((category) => ({
    url: `${SITE_URL}/zutopia/${category.slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const zutopiaEntryRoutes = ZUTOPIA_CATEGORIES.flatMap((category) =>
    category.entries.map((entry) => ({
      url: `${SITE_URL}/zutopia/${category.slug}/${entry.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  );

  return [
    ...staticRoutes,
    ...songRoutes,
    ...slamSongRoutes,
    ...zutopiaCategoryRoutes,
    ...zutopiaEntryRoutes,
  ];
}

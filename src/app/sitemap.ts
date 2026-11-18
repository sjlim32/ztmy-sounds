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
  "/zutopia/songs": 0.4,
  "/zutopia/albums": 0.4,
  "/credits": 0.3,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const slamSongList = getSongsWithTag("slam", songList);

  const staticRoutes = [
    "/",
    "/guide",
    "/info",
    "/slam",
    "/zutopia",
    "/zutopia/songs",
    "/zutopia/albums",
    "/credits",
  ].map((path) => ({
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

  const slamSongRoutes = slamSongList.map((song) => ({
    url: `${SITE_URL}/slam/${song.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 즛토피아 항목은 DB의 실제 수정 시각(category.getLastModified)을 lastmod로 —
  // 빌드 시각을 쓰면 배포마다 전부 바뀐 것처럼 보여 검색 엔진이 lastmod를 믿지 않는다.
  // 카테고리 목록 페이지는 그 안 항목 중 가장 늦은 시각.
  const zutopiaRoutes = await Promise.all(
    ZUTOPIA_CATEGORIES.map(async (category) => {
      const [entries, modified] = await Promise.all([
        category.getEntries(),
        category.getLastModified?.() ?? new Map<string, string>(),
      ]);
      const entryRoutes = entries.map((entry) => {
        const updatedAt = modified.get(entry.slug);
        return {
          url: `${SITE_URL}/zutopia/${category.slug}/${entry.slug}`,
          lastModified: updatedAt ? new Date(updatedAt) : lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        };
      });
      const latestEntry = entryRoutes.reduce<Date | null>(
        (max, route) =>
          !max || route.lastModified > max ? route.lastModified : max,
        null,
      );
      return {
        categoryRoute: {
          url: `${SITE_URL}/zutopia/${category.slug}`,
          lastModified: latestEntry ?? lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.4,
        },
        entryRoutes,
      };
    }),
  );
  const zutopiaCategoryRoutes = zutopiaRoutes.map((r) => r.categoryRoute);
  const zutopiaEntryRoutes = zutopiaRoutes.flatMap((r) => r.entryRoutes);

  return [
    ...staticRoutes,
    ...songRoutes,
    ...slamSongRoutes,
    ...zutopiaCategoryRoutes,
    ...zutopiaEntryRoutes,
  ];
}

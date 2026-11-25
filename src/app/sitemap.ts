import type { MetadataRoute } from "next";
import { songList } from "@/features/guide/data/songs";
import { getSongsWithTag } from "@/features/guide/lib/song-call-tags";
import { getSongGitDates } from "@/features/guide/lib/song-history-git";
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
  "/zutopia/timeline": 0.4,
  "/zutopia/stats": 0.3,
  "/zutopia/quiz": 0.3,
  "/credits": 0.3,
};

function latest(dates: readonly (Date | undefined)[]): Date | undefined {
  return dates.reduce<Date | undefined>(
    (max, date) => (date && (!max || date > max) ? date : max),
    undefined,
  );
}

/**
 * lastmod는 실제로 바뀐 날짜를 아는 주소에만 넣는다 — 빌드 시각을 넣으면 배포마다
 * 전부 바뀐 것처럼 보여 검색 엔진이 사이트맵의 lastmod 전체를 믿지 않게 된다
 * (Google: "consistently and verifiably accurate"일 때만 쓴다).
 * - 곡 페이지: 곡 데이터 파일의 마지막 git 커밋(guide/lib/song-history-git.ts)
 * - 즛토피아 항목: DB updated_at(category.getLastModified), 목록 페이지는 그 최댓값
 * - 그 밖의 고정 페이지: 넣지 않는다
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slamSongList = getSongsWithTag("slam", songList);
  const songDates = getSongGitDates();
  const songModified = (id: string) => songDates.get(id)?.modified;

  const songRoutes = songList.map((song) => ({
    url: `${SITE_URL}/guide/${song.id}`,
    lastModified: songModified(song.id),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const slamSongRoutes = slamSongList.map((song) => ({
    url: `${SITE_URL}/slam/${song.id}`,
    lastModified: songModified(song.id),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const listModified: Record<string, Date | undefined> = {
    "/guide": latest(songRoutes.map((route) => route.lastModified)),
    "/slam": latest(slamSongRoutes.map((route) => route.lastModified)),
  };
  const staticRoutes = [
    "/",
    "/guide",
    "/info",
    "/slam",
    "/zutopia",
    "/zutopia/songs",
    "/zutopia/albums",
    "/zutopia/timeline",
    "/zutopia/stats",
    "/zutopia/quiz",
    // /zutopia/attendance는 넣지 않는다 — 기록이 브라우저(localStorage)에만 있어 정적
    // HTML이 거의 비어 있다(개인용 도구, 링크로만 찾게 둔다).
    "/credits",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: listModified[path],
    changeFrequency: "weekly" as const,
    priority: PRIORITY[path],
  }));

  const zutopiaRoutes = await Promise.all(
    ZUTOPIA_CATEGORIES.map(async (category) => {
      const [entries, modified] = await Promise.all([
        category.getEntries(),
        category.getLastModified?.() ?? new Map<string, string>(),
      ]);
      const toDate = (iso: string | undefined) =>
        iso ? new Date(iso) : undefined;
      return {
        categoryRoute: {
          url: `${SITE_URL}/zutopia/${category.slug}`,
          // 목록엔 취소된 공연도 보이므로(상세가 없어 entries엔 없음) 항목만이 아니라
          // getLastModified가 준 값 전체의 최댓값.
          lastModified: latest([...modified.values()].map(toDate)),
          changeFrequency: "weekly" as const,
          priority: 0.4,
        },
        entryRoutes: entries.map((entry) => ({
          url: `${SITE_URL}/zutopia/${category.slug}/${entry.slug}`,
          lastModified: toDate(modified.get(entry.slug)),
          changeFrequency: "monthly" as const,
          priority: 0.4,
        })),
      };
    }),
  );

  return [
    ...staticRoutes,
    ...songRoutes,
    ...slamSongRoutes,
    ...zutopiaRoutes.map((r) => r.categoryRoute),
    ...zutopiaRoutes.flatMap((r) => r.entryRoutes),
  ];
}

import { songList } from "@/features/guide/data/songs";
import { buildRssXml } from "@/features/guide/lib/rss";
import { getSongAddedDates } from "@/features/guide/lib/song-added-dates";
import { FEED_TITLE, FEED_URL, SITE_URL } from "@/lib/seo";

// output: "export"에선 빌드할 때 out/feed.xml 파일로 만들어진다.
export const dynamic = "force-static";

export function GET() {
  const addedDates = getSongAddedDates();
  const buildTime = new Date(Number(process.env.NEXT_PUBLIC_BUILD_TIME));

  const xml = buildRssXml({
    title: FEED_TITLE,
    link: `${SITE_URL}/guide`,
    feedUrl: `${SITE_URL}${FEED_URL}`,
    description: "새로 추가된 곡의 샤모지 응원 가이드를 알려 드립니다.",
    language: "ko",
    items: songList.map((song) => ({
      // 곡 페이지 generateMetadata와 같은 제목·설명
      title: `${song.title.jp} (${song.title.kr})`,
      link: `${SITE_URL}/guide/${song.id}`,
      description:
        song.description?.summary ??
        `${song.title.kr} (${song.title.en}) 샤모지 응원 가이드`,
      pubDate: addedDates.get(song.id) ?? buildTime,
    })),
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

import type { Song } from "@/features/guide/lib/types";
import { buildRssXml } from "@/features/guide/lib/rss";
import {
  cheerGuideDescription,
  songPageTitle,
} from "@/features/guide/lib/song-meta";
import { FEED_TITLE, FEED_URL, SITE_URL } from "@/lib/seo";

/**
 * 응원 가이드 RSS(/feed.xml) — 곡마다 응원 가이드에 추가된 날짜(addedDates, 곡 id →
 * 날짜)로 최신순. 날짜가 없는 곡(아직 커밋 안 된 새 곡)은 fallbackDate(빌드 시각).
 */
export function buildGuideFeedXml(
  songs: readonly Song[],
  addedDates: ReadonlyMap<string, Date>,
  fallbackDate: Date,
): string {
  return buildRssXml({
    title: FEED_TITLE,
    link: `${SITE_URL}/guide`,
    feedUrl: `${SITE_URL}${FEED_URL}`,
    description: "새로 추가된 곡의 샤모지 응원 가이드를 알려 드립니다.",
    language: "ko",
    items: songs.map((song) => ({
      title: songPageTitle(song),
      link: `${SITE_URL}/guide/${song.id}`,
      description: cheerGuideDescription(song),
      pubDate: addedDates.get(song.id) ?? fallbackDate,
    })),
  });
}

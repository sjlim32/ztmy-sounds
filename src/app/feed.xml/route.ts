import { songList } from "@/features/guide/data/songs";
import { buildGuideFeedXml } from "@/features/guide/lib/feed";
import { getSongGitDates } from "@/features/guide/lib/song-history-git";

// output: "export"에선 빌드할 때 out/feed.xml 파일로 만들어진다(정적 파일이라 아래
// Content-Type은 dev 서버에서만 쓰이고, 배포에선 호스트가 .xml 확장자로 정한다).
export const dynamic = "force-static";

export function GET() {
  const addedDates = new Map(
    [...getSongGitDates()].map(([id, dates]) => [id, dates.added]),
  );
  const xml = buildGuideFeedXml(
    songList,
    addedDates,
    new Date(Number(process.env.NEXT_PUBLIC_BUILD_TIME) || Date.now()),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

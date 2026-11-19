import { getMyStatsData } from "@/features/zutopia/stats/data";

// 정적 빌드에서 /zutopia/stats-me.json 파일로 내보낸다 — 통계 페이지의 "내 기록"이
// 참전 기록(체크한 공연)이 있을 때만 받아 브라우저에서 센다(stats/my-stats.ts).
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getMyStatsData());
}

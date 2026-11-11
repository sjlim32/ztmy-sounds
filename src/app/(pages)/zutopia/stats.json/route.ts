import { getStatSections } from "@/features/zutopia/stats/data";
import { fullTables } from "@/features/zutopia/stats/compute";

// 정적 빌드에서 /zutopia/stats.json 파일로 내보낸다 — 통계 페이지에는 기록마다 앞
// 몇 줄만 싣고, "자세히 보기"를 누를 때 전체 순위표를 여기서 받는다.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(fullTables(await getStatSections()));
}

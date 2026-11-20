import { getStatInput } from "@/features/zutopia/stats/data";
import {
  buildStatSections,
  buildStatSummary,
  fullTables,
} from "@/features/zutopia/stats/compute";

// 정적 빌드에서 /zutopia/stats.json 파일로 내보낸다 — 통계 페이지에는 기록마다 앞
// 몇 줄만 싣고, "전체 순위 보기"를 누를 때 전체 순위표를 여기서 받는다. 맨 위 요약의
// "세트리스트가 아직 없는 공연" 목록도 같은 모양(기록 id → 줄)으로 싣는다.
export const dynamic = "force-static";

export async function GET() {
  // Route Handler에선 React cache가 묶이지 않아 입력을 한 번만 받아 두 계산에 넘긴다.
  const input = await getStatInput();
  const [sections, summary] = [
    buildStatSections(input),
    buildStatSummary(input),
  ];
  return Response.json({
    ...fullTables(sections),
    [summary.missing.id]: summary.missing.rows,
  });
}

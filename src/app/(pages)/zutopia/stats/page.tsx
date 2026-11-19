import type { Metadata } from "next";
import { getStatSections, getStatSummary } from "@/features/zutopia/stats/data";
import { previewSections } from "@/features/zutopia/stats/compute";
import { StatsView } from "@/features/zutopia/stats/components/StatsView";
import { DataInProgressNotice } from "@/features/zutopia/components/DataInProgressNotice";

export const metadata: Metadata = {
  title: "통계",
  description:
    "즛토마요 라이브에서 가장 많이 불린 곡, 가장 긴 투어, 가장 자주 선 공연장 등 곡·앨범·공연·장소별 기록을 모았습니다.",
};

export default async function ZutopiaStatsPage() {
  const [sections, summary] = await Promise.all([
    getStatSections(),
    getStatSummary(),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">통계</h1>
      <DataInProgressNotice />
      <StatsView
        sections={previewSections(sections)}
        // 세트리스트가 없는 공연 목록은 옆 창을 열 때 stats.json에서 받는다.
        summary={{ ...summary, missing: { ...summary.missing, rows: [] } }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { getStatSections } from "@/features/zutopia/stats/data";
import { StatsView } from "@/features/zutopia/stats/components/StatsView";

export const metadata: Metadata = {
  title: "통계",
  description:
    "즛토마요 라이브에서 가장 많이 불린 곡, 가장 긴 투어, 가장 자주 선 공연장 등 곡·앨범·공연·장소별 기록을 모았습니다.",
};

export default async function ZutopiaStatsPage() {
  const sections = await getStatSections();
  return (
    <div>
      <h1 className="sr-only">통계</h1>
      <StatsView sections={sections} />
    </div>
  );
}

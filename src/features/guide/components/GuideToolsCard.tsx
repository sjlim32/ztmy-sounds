import type { Song } from "@/features/guide/lib/types";
import { AutoScrollToggle } from "@/features/guide/components/AutoScrollToggle";
import { SongReportLink } from "@/features/guide/components/SongReportLink";

/**
 * tablet 이상: 영상 아래 응원 표시 안내(CallLegend) 오른쪽의 가사 도구 카드 —
 * 자동 스크롤 토글 + 곡별 오류 제보. 모바일은 둘 다 가사 영역 안에 있다.
 */
export function GuideToolsCard({ song }: { song: Song }) {
  return (
    <section
      aria-label="가사 도구"
      className="flex shrink-0 flex-col items-stretch justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm"
    >
      <AutoScrollToggle className="justify-between" />
      <SongReportLink song={song} className="justify-center" />
    </section>
  );
}

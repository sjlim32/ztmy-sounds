import { cn } from "@/lib/utils";
import type { SetlistChangeNote } from "@/features/zutopia/lives/setlist-diff";

// 잉크 색 — DAY·선택곡·ENCORE가 쓰는 분홍·보라·하늘·노랑과 겹치지 않게.
const STAMP_TONE: Record<SetlistChangeNote["label"], string> = {
  추가: "text-emerald-400",
  제거: "text-red-400",
  "순서 변경": "text-white/80",
};

/**
 * 판 사이에 달라진 곡의 도장 — 곡 제목 아래 메타 줄 자리에, 공연 티켓 검표 도장처럼
 * 테두리만 있는 사각 도장("추가"·"제거"·"순서 변경")을 살짝 기울여 찍고
 * 옆에 시기·상세("후반기부터", "전반기 5번 → 후반기 8번")를 흐린 글자로. 처음 보일 때(판을 바꿔 새로 붙을 때) 찍히는
 * 움직임(animate-stamp-in, 동작 줄이기 설정이면 없음). 좁은 화면에선 상세가 다음 줄로.
 */
export function SetlistChangeLine({ change }: { change: SetlistChangeNote }) {
  return (
    <span className="mt-1.5 mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        key={change.label}
        className={cn(
          "animate-stamp-in inline-flex -rotate-2 items-center rounded-tag border-2 border-current px-1.5 text-sm leading-5 font-bold tracking-wide whitespace-nowrap",
          STAMP_TONE[change.label],
        )}
      >
        {change.label}
      </span>
      <span className="text-sm break-keep text-white/65">{change.detail}</span>
    </span>
  );
}

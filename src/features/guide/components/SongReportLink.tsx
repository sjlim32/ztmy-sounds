import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getFeedbackUrl } from "@/lib/feedback";
import { FOCUS_RING } from "@/components/button-styles";
import { SirenIcon } from "@/components/icons/SirenIcon";

/**
 * 곡별 싱크·가사 오류 제보 — 건의 폼의 숨김 필드(title, mode)에 이 곡이
 * 미리 채워진다. 자리마다 모양이 다르다:
 * - floating(태블릿 이상): 가사 영역 왼쪽 아래에 늘 떠 있는 버튼 — 오른쪽 아래
 *   자동 스크롤 토글과 같은 높이·어두운 면(LyricsView).
 * - inline(모바일): 영상 바로 아래 오른쪽의 사이렌 아이콘 버튼(GuidePlayerArea) —
 *   음원/라이브 토글과 한 줄에 들어가도록 글자 없이(이름은 aria-label·title).
 * 사이렌 아이콘은 "문제를 알린다"는 뜻.
 */
export function SongReportLink({
  song,
  variant,
  className,
}: {
  song: Song;
  variant: "floating" | "inline";
  className?: string;
}) {
  const { mode } = useGuideMode();

  return (
    <a
      href={getFeedbackUrl({ title: song.title.kr, mode })}
      target="_blank"
      rel="noopener noreferrer"
      title="이 곡 싱크·가사 오류 제보"
      aria-label="이 곡 싱크·가사 오류 제보"
      className={cn(
        "inline-flex items-center transition-colors",
        FOCUS_RING,
        variant === "floating"
          ? "h-8 gap-1.5 rounded-lg bg-black/40 px-3 text-sm font-medium text-white/80 backdrop-blur-sm hover:bg-black/60 hover:text-white"
          : "h-8 w-8 justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <SirenIcon
        className={cn(
          "shrink-0",
          variant === "floating" ? "text-ztmy-sun h-4 w-4" : "h-4.5 w-4.5",
        )}
      />
      {variant === "floating" && "싱크·가사 오류 제보"}
    </a>
  );
}

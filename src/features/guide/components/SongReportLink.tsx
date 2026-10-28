import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getFeedbackUrl } from "@/lib/feedback";
import { FOCUS_RING } from "@/components/button-styles";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

/**
 * 곡별 싱크·가사 오류 제보 — 건의 폼의 숨김 필드(title, mode)에 이 곡이
 * 미리 채워진다. 자리마다 모양이 다르다:
 * - floating(태블릿 이상): 가사 영역 왼쪽 아래에 늘 떠 있는 버튼 — 오른쪽 아래
 *   자동 스크롤 토글과 같은 높이·어두운 면(LyricsView).
 * - inline(모바일): 영상 바로 아래 오른쪽의 작은 글자 링크(GuidePlayerArea).
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
      className={cn(
        "inline-flex items-center transition-colors",
        FOCUS_RING,
        variant === "floating"
          ? "h-8 gap-1.5 rounded-lg bg-black/40 px-3 text-sm font-medium text-white/80 backdrop-blur-sm hover:bg-black/60 hover:text-white"
          : "h-7 gap-1 rounded-md px-1 text-sm text-white/55 hover:text-white",
        className,
      )}
    >
      {variant === "floating" ? "싱크·가사 오류 제보" : "오류 제보"}
      <ExternalLinkIcon className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
}

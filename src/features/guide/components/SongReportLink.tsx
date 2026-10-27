import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getFeedbackUrl } from "@/lib/feedback";
import { LINK_BUTTON_CLASS } from "@/components/button-styles";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

/**
 * 곡별 싱크·가사 오류 제보 — 건의 폼의 숨김 필드(title, mode)에 이 곡이
 * 미리 채워진다. 모바일은 가사 맨 끝, 태블릿 이상은 영상 아래 도구 카드.
 */
export function SongReportLink({
  song,
  className,
}: {
  song: Song;
  className?: string;
}) {
  const { mode } = useGuideMode();

  return (
    <a
      href={getFeedbackUrl({ title: song.title.kr, mode })}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(LINK_BUTTON_CLASS, "text-white/70", className)}
    >
      이 곡 싱크·가사 오류 제보
      <ExternalLinkIcon className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
}

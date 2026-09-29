import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MicIcon } from "@/components/icons/MicIcon";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";

const indexBadgeClass = "w-6 shrink-0 font-mono text-xs tabular-nums";

const rowClass = cn(
  "flex w-full items-center gap-3 px-4 py-2.5",
  "text-sm",
  "tablet:text-base",
);

export function formatDayNumber(dayNumber: number): string {
  if (dayNumber === 1) return "첫째날";
  if (dayNumber === 2) return "둘째날";
  if (dayNumber === 3) return "셋째날";
  if (dayNumber === 4) return "넷째날";
  return `${dayNumber}일차`;
}

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목 + (응원 가이드가 있으면) 우측 끝
 * 마이크 아이콘. song-db의 SongListView와 동일하게 행 자체는 텍스트이고,
 * 가이드 이동은 별도 아이콘 버튼으로 분리한다(Supabase setlists 스키마에
 * 곡별 영상 링크가 없어서, 가이드 링크가 유일한 후보다).
 * 앙코르 곡은 번호 흐름은 그대로 두고 ztmy-sun 톤 + ENCORE 태그로만 강조한다.
 * 선택곡(투어 공연일에만 있는 곡)은 앙코르와 겹쳐도 구분되도록 배경 대신
 * ztmy-sky 왼쪽 띠 + "선택곡" 태그로 강조한다.
 * 일차(dayNumber)가 지정된 곡은 ztmy-pink "첫째날", "둘째날" 태그로 강조한다.
 * 편곡 정보(arrange)가 있으면 곡 제목 아래에 흐리고 작은 글씨로 표시한다.
 */
export function SongLink({
  href,
  index,
  dayNumber,
  arrange,
  encore = false,
  selected = false,
  children,
}: {
  href?: string | null;
  index: number;
  dayNumber?: number | null;
  arrange?: string | null;
  encore?: boolean;
  selected?: boolean;
  children: ReactNode;
}) {
  const number = String(index).padStart(2, "0");
  const dayLabel = dayNumber != null ? formatDayNumber(dayNumber) : null;

  return (
    <div
      className={cn(
        rowClass,
        "border-l-2",
        encore || selected ? "text-white" : "text-white/80",
        encore && "bg-ztmy-sun/5",
        selected ? "border-ztmy-sky" : "border-transparent",
      )}
    >
      <span
        className={cn(
          indexBadgeClass,
          encore && "text-ztmy-sun font-bold",
          selected && !encore && "text-ztmy-sky font-bold",
          !encore && !selected && "text-white/30",
        )}
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate">{children}</span>
        {arrange && (
          <span
            className={cn("truncate text-xs text-white/50", "tablet:text-sm")}
          >
            {arrange}
          </span>
        )}
      </div>
      {dayLabel && (
        <span
          className={cn(
            "border-ztmy-pink/60 text-ztmy-pink shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
            "tablet:text-xs",
          )}
        >
          {dayLabel}
        </span>
      )}
      {selected && (
        <span
          className={cn(
            "border-ztmy-sky/60 text-ztmy-sky shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
            "tablet:text-xs",
          )}
        >
          선택곡
        </span>
      )}
      {encore && (
        <span
          className={cn(
            "text-ztmy-sun shrink-0 font-mono text-[10px] tracking-[0.2em] uppercase",
            "tablet:text-xs",
          )}
        >
          Encore
        </span>
      )}
      {href && (
        <IconLinkButton
          href={href}
          icon={MicIcon}
          label="샤모지 호응 가이드 이동"
          tone="guide"
        />
      )}
    </div>
  );
}

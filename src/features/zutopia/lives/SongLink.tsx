import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MicIcon } from "@/components/icons/MicIcon";
import { IconLinkButton } from "@/features/zutopia/song-db/components/IconLinkButton";

const indexBadgeClass = cn(
  "w-6 shrink-0 font-mono text-xs tabular-nums",
  "text-white/30",
);

const rowClass = cn(
  "flex w-full items-center gap-3 px-4 py-2.5",
  "text-sm text-white/80",
  "tablet:text-base",
);

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목 + (응원 가이드가 있으면) 우측 끝
 * 마이크 아이콘. song-db의 SongListView와 동일하게 행 자체는 텍스트이고,
 * 가이드 이동은 별도 아이콘 버튼으로 분리한다(Supabase setlists 스키마에
 * 곡별 영상 링크가 없어서, 가이드 링크가 유일한 후보다).
 */
export function SongLink({
  href,
  index,
  children,
}: {
  href?: string | null;
  index: number;
  children: ReactNode;
}) {
  const number = String(index).padStart(2, "0");

  return (
    <div className={rowClass}>
      <span className={indexBadgeClass}>{number}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
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

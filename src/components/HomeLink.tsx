import Link from "next/link";
import { cn } from "@/lib/utils";
import { HomeIcon } from "@/components/icons/HomeIcon";

interface HomeLinkProps {
  label?: string;
  // false면 아이콘만 보이고 label은 aria-label로만 쓰인다(모바일 헤더처럼
  // 좁은 아이콘 전용 자리에 쓸 때).
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

// ZutopiaTopNav에서 쓰던 "떠 있는 필(pill)" 스타일을 기본값으로 채택해
// BackLink와 함께 사이트 전역 뒤로가기/홈 버튼 모양을 통일한다. 원래
// info/credits/SongList는 각자 다른(텍스트 전용, 회색 등) 스타일이었는데
// 여기로 흡수한다. 호출부는 className으로 위치·노출 조건만 얹는다.
const BASE_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:border-ztmy-magenta/60 hover:text-white";

export function HomeLink({
  label = "홈으로",
  showLabel = true,
  className,
  iconClassName,
}: HomeLinkProps) {
  return (
    <Link
      href="/"
      aria-label={label}
      className={cn(
        BASE_CLASS,
        showLabel ? "px-3 py-1.5 text-sm" : "h-9 w-9",
        className,
      )}
    >
      <HomeIcon className={cn("h-4 w-4", iconClassName)} />
      {showLabel && label}
    </Link>
  );
}

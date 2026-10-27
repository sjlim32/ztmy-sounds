import Link from "next/link";
import { cn } from "@/lib/utils";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";

interface HomeLinkProps {
  label?: string;
  // false면 아이콘만 보이고 label은 aria-label로만 쓰인다(모바일 헤더처럼
  // 좁은 아이콘 전용 자리에 쓸 때).
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

// BackLink와 함께 사이트 전역 뒤로가기/홈 버튼 모양을 이동 버튼 스타일
// (button-styles.ts NAV_BUTTON_CLASS)로 통일한다. 호출부는 className으로
// 위치·노출 조건만 얹는다.
const BASE_CLASS = NAV_BUTTON_CLASS;

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
        showLabel ? "px-3.5 py-2 text-sm" : "h-9 w-9",
        className,
      )}
    >
      <HomeIcon className={cn("h-4 w-4", iconClassName)} />
      {showLabel && label}
    </Link>
  );
}

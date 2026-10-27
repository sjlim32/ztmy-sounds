"use client";

import { cn } from "@/lib/utils";
import { useShare } from "@/lib/use-share";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";
import { ShareIcon } from "@/components/icons/ShareIcon";

/**
 * 지금 페이지 주소를 공유하는 아이콘 버튼. 크기는 className으로,
 * 복사 안내 말풍선 위치는 tooltipClassName으로 호출부가 정한다.
 */
export function ShareButton({
  className,
  iconClassName,
  tooltipClassName,
}: {
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
}) {
  const { share, copied } = useShare();

  return (
    <button
      type="button"
      onClick={share}
      aria-label="공유하기"
      title="공유하기"
      className={cn(NAV_BUTTON_CLASS, "relative h-9 w-9", className)}
    >
      <ShareIcon className={cn("h-4 w-4", iconClassName)} />
      {copied && (
        <span
          role="status"
          className={cn(
            "absolute right-0 bottom-full z-50 mb-2 rounded-lg bg-black/85 px-3 py-1 text-sm whitespace-nowrap text-white",
            tooltipClassName,
          )}
        >
          링크가 복사되었습니다
        </span>
      )}
    </button>
  );
}

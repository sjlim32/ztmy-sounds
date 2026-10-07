import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * "라벨: 값" 한 줄. 원래 EventDetails 전용 내부 컴포넌트였는데, 티켓/굿즈
 * 안내처럼 같은 모양의 목록이 페이지 곳곳에 반복돼 공용으로 뺐다.
 *
 * 태블릿 이상은 "- 라벨 : 값" 한 줄. 모바일은 폭이 좁아 한 줄에 못 넣으므로
 * 작고 옅은 라벨 아래에 값을 두고, 항목 사이를 가는 선으로 나눠서 어디까지가
 * 한 항목인지 보이게 한다. 시각처럼 값이 짧은 항목은 inline으로 라벨 왼쪽·
 * 값 오른쪽 한 줄에 놓는다.
 */
export function DetailField({
  label,
  children,
  inline = false,
  className,
}: {
  label: string;
  children: ReactNode;
  /** 모바일에서도 라벨과 값을 한 줄에 (값이 짧을 때) */
  inline?: boolean;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "border-t border-white/10 py-2 first:border-t-0 first:pt-0 last:pb-0",
        "tablet:flex tablet:gap-2 tablet:border-t-0 tablet:py-0 tablet:before:text-white/30 tablet:before:content-['-']",
      )}
    >
      <div
        className={cn(
          inline
            ? "flex flex-row items-baseline justify-between gap-4"
            : "flex flex-col gap-0.5",
          "tablet:flex-row tablet:items-baseline tablet:justify-start tablet:gap-2",
          className,
        )}
      >
        <span
          className={cn(
            "shrink-0 font-medium text-white/60",
            inline ? "text-sm" : "text-xs",
            "tablet:min-w-20 tablet:text-base tablet:font-normal tablet:text-white",
          )}
        >
          {label}
          <span className={cn("hidden", "tablet:inline")}> :</span>
        </span>
        {/* items-start: 링크(SiteLink)처럼 블록으로 퍼지는 값도 글자 폭만 차지하게 */}
        <div
          className={cn(
            "flex min-w-0 flex-col",
            inline ? "items-end text-right font-semibold" : "items-start",
            "tablet:items-start tablet:text-left tablet:font-normal",
          )}
        >
          {children}
        </div>
      </div>
    </li>
  );
}

import type { ReactNode } from "react";

/**
 * "라벨: 값" 한 줄. 원래 EventDetails 전용 내부 컴포넌트였는데, 티켓/굿즈
 * 안내처럼 같은 모양의 목록이 페이지 곳곳에 반복돼 공용으로 뺐다. 모바일은
 * 라벨/값을 세로로, 태블릿 이상은 한 줄로 배치해 값이 길어도 라벨과
 * 겹치지 않는다.
 */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-2 before:text-white/30 before:content-['-']">
      <div className="tablet:flex-row tablet:items-baseline tablet:gap-2 flex flex-col gap-1">
        <span className="tablet:w-24 shrink-0">{label}:</span>
        {children}
      </div>
    </li>
  );
}

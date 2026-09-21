import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * DetailField 여러 줄을 카드 하나로 묶는다 — 제목(선택, 예: 티켓 판매
 * 회차명)과 유의사항(선택, 작고 옅은 보조 텍스트)을 함께 둘 수 있어
 * "제목 + 세부 항목들 + 유의사항" 형태가 반복되는 티켓/굿즈 안내 블록에
 * 공용으로 쓴다. 이전엔 이 항목들이 카드 없이 <span>을 그냥 나열해서
 * 한 줄로 뭉개져 읽혔는데, 카드로 묶고 각 줄을 DetailField로 분리해
 * 가독성을 개선했다.
 */
export function DetailList({
  title,
  titleClassName,
  note,
  children,
}: {
  title?: ReactNode;
  titleClassName?: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/30 p-3">
      {title && <h3 className={cn("font-bold", titleClassName)}>{title}</h3>}
      <ul className="space-y-2.5 text-white">{children}</ul>
      {note && <p className="text-sm text-white/60">{note}</p>}
    </div>
  );
}

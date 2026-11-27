import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const DASHED = "border-ztmy-purple/40 border-dashed";

export type TicketCell = {
  label: string;
  value: ReactNode;
  /** 값 아래 흐린 한 줄 */
  sub?: ReactNode;
  /** 말줄임될 때 마우스를 올리면 보이는 전체 글자 */
  title?: string;
};

/**
 * 보딩 티켓 띠 — 공연 상세 티켓(LiveTicket)과 같은 모티프(위 색 띠, 점선으로 나뉜 칸, 아래
 * 가로 점선 절취선). 카드(surface) 맨 위에 둔다(투어 상세 세트리스트, 공연 정보 머리).
 * 칸들을 한 줄에: 마지막 칸 앞은 글자 폭만큼, 마지막 칸이 남는 폭을 쓰고 넘치면 말줄임 —
 * 칸마다 최소 100px. 글자는 줄바꿈 없이, 라벨은 한국어.
 */
export function TicketStrip({ cells }: { cells: TicketCell[] }) {
  const cellClass = cn("min-w-0 px-3 py-2.5 whitespace-nowrap", "tablet:px-5");
  return (
    <div className="relative">
      <div className="from-ztmy-magenta to-ztmy-purple absolute inset-x-0 top-0 h-0.5 bg-linear-to-r" />
      <div
        className="grid"
        style={{
          gridTemplateColumns: [
            ...cells.slice(1).map(() => "minmax(100px, auto)"),
            "minmax(100px, 1fr)",
          ].join(" "),
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cn(cellClass, index > 0 && cn(DASHED, "border-l"))}
          >
            <p className="text-sm text-white/50">{cell.label}</p>
            <p
              className="mt-0.5 truncate text-sm font-medium text-white"
              title={cell.title}
            >
              {cell.value}
            </p>
            {cell.sub && (
              <p className="truncate text-sm text-white/55">{cell.sub}</p>
            )}
          </div>
        ))}
      </div>
      <div className={cn(DASHED, "border-t")} />
    </div>
  );
}

import { cn } from "@/lib/utils";

/** metadata.unrelease가 켜진 곡에 붙는 "미공개 곡" 칩 — 곡 목록과 상세 패널 공용. */
export function UnreleasedBadge() {
  return (
    <span
      className={cn(
        "border-ztmy-pink/40 bg-ztmy-pink/15 shrink-0 rounded border px-1.5 py-0.5 text-xs leading-none font-semibold whitespace-nowrap text-white",
        "tablet:text-sm",
      )}
    >
      미공개 곡
    </span>
  );
}

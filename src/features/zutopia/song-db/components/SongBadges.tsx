import { cn } from "@/lib/utils";

const BADGE_CLASS = cn(
  "shrink-0 rounded border px-1.5 py-0.5 text-xs leading-none font-semibold whitespace-nowrap text-white",
  "tablet:text-sm",
);

/** metadata.unrelease가 켜진 곡에 붙는 "미공개 곡" 칩 — 곡 목록과 상세 패널 공용. */
export function UnreleasedBadge() {
  return (
    <span className={cn(BADGE_CLASS, "border-ztmy-pink/40 bg-ztmy-pink/15")}>
      미공개 곡
    </span>
  );
}

/** metadata.collab이 있는 곡(피처링·트리뷰트·타이업 등)에 붙는 "협업" 칩 — 곡 목록과 상세 패널 공용. */
export function CollabBadge() {
  return (
    <span
      className={cn(BADGE_CLASS, "border-ztmy-purple/40 bg-ztmy-purple/15")}
    >
      협업
    </span>
  );
}

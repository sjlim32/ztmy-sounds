import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { QUIZ_LEVELS } from "@/features/zutopia/quiz/data";

/**
 * 연습하기 난이도 고르기 — 카드 한 장에 단계마다 한 줄(구분선) — 단계마다 카드를 따로 두지
 * 않는다(카드 최소화). 줄 앞 막대 네 칸 중 채운 칸 수로 단계를 보여 준다. 문제가 생기기
 * 전까지는 누를 수 없다("준비 중"은 구역 제목 줄 오른쪽에 한 번).
 */
export function PracticeLevels() {
  return (
    <ul className={cn(ZUTOPIA_SURFACE_CLASS, "divide-y divide-white/10")}>
      {QUIZ_LEVELS.map((level, index) => (
        <li key={level.id}>
          <button
            type="button"
            disabled
            className={cn(
              "flex w-full cursor-not-allowed items-center gap-3 px-4 py-3.5 text-left",
              "tablet:px-5",
            )}
          >
            <LevelBars level={index + 1} total={QUIZ_LEVELS.length} />
            <span
              className={cn(
                "flex-1 text-base font-bold text-white/75",
                "tablet:text-lg",
              )}
            >
              {level.label}
            </span>
            <span className="sr-only">
              {`난이도 ${index + 1}/${QUIZ_LEVELS.length}`}
            </span>
            <ChevronLeftIcon className="size-4 rotate-180 text-white/25" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 난이도 막대 — 오른쪽으로 갈수록 높아지는 네 칸, 단계만큼 분홍으로 채운다. */
function LevelBars({ level, total }: { level: number; total: number }) {
  return (
    <span aria-hidden className="flex h-4 shrink-0 items-end gap-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "rounded-tag w-1.5",
            index < level ? "bg-ztmy-pink/70" : "bg-white/15",
          )}
          style={{ height: `${((index + 1) / total) * 100}%` }}
        />
      ))}
    </span>
  );
}

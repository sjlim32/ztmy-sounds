import { cn } from "@/lib/utils";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { QUIZ_LEVELS } from "@/features/zutopia/quiz/data";
import { QuizSoonChip } from "@/features/zutopia/quiz/components/QuizSoonChip";

/**
 * 연습하기 난이도 고르기 — 4단계를 한 줄에(모바일 2×2). 단계는 왼쪽 위 막대 네 칸
 * 중 채운 칸 수로 보여 준다. 문제가 생기기 전까지는 누를 수 없다.
 */
export function PracticeLevels() {
  return (
    <ul className={cn("grid grid-cols-2 gap-3", "tablet:gap-4 pc:grid-cols-4")}>
      {QUIZ_LEVELS.map((level, index) => (
        <li key={level.id}>
          <button
            type="button"
            disabled
            className={cn(
              ZUTOPIA_SURFACE_CLASS,
              "flex w-full cursor-not-allowed flex-col items-start gap-4 p-4 text-left",
              "tablet:p-5",
            )}
          >
            <span className="flex w-full items-center justify-between">
              <LevelBars level={index + 1} total={QUIZ_LEVELS.length} />
              <QuizSoonChip />
            </span>
            <span className="tablet:text-xl text-lg font-bold text-white/75">
              {level.label}
            </span>
            <span className="sr-only">
              {`난이도 ${index + 1}/${QUIZ_LEVELS.length}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 난이도 막대 — 오른쪽으로 갈수록 높아지는 네 칸, 단계만큼 분홍으로 채운다. */
function LevelBars({ level, total }: { level: number; total: number }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
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

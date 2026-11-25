import { cn } from "@/lib/utils";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { QuizSoonChip } from "@/features/zutopia/quiz/components/QuizSoonChip";

/** 실전 테스트 시작 버튼 — 문제가 생기기 전까지는 누를 수 없다. */
export function RealTestCard() {
  return (
    <button
      type="button"
      disabled
      className={cn(
        ZUTOPIA_SURFACE_CLASS,
        "flex w-full cursor-not-allowed items-center justify-between gap-3 px-4 py-4 text-left",
        "tablet:px-5 tablet:py-5",
      )}
    >
      <span className="tablet:text-xl text-lg font-bold text-white/75">
        테스트 시작
      </span>
      <QuizSoonChip />
    </button>
  );
}

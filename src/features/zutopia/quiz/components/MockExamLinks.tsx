import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { FOCUS_RING } from "@/components/button-styles";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { MOCK_EXAMS } from "@/features/zutopia/quiz/data";

/**
 * 모의고사 회차별 구글폼 링크 — 카드 한 장에 회차마다 한 줄(구분선, 1회부터 위에서 아래로),
 * 새 창으로 연다. 회차마다 카드를 따로 두지 않는다(카드 최소화).
 */
export function MockExamLinks() {
  return (
    <ul className={cn(ZUTOPIA_SURFACE_CLASS, "divide-y divide-white/10")}>
      {MOCK_EXAMS.map((exam) => (
        <li key={exam.round}>
          <a
            href={exam.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.06]",
              "tablet:px-5",
              FOCUS_RING,
              "focus-visible:ring-inset",
            )}
          >
            <span
              className={cn(
                "group-hover:text-ztmy-pink text-base font-bold text-white transition-colors",
                "tablet:text-lg",
              )}
            >
              제{exam.round}회
            </span>
            <span className="flex-1 font-mono text-sm text-white/55 tabular-nums">
              {exam.date}
            </span>
            <ExternalLinkIcon className="group-hover:text-ztmy-pink size-4 shrink-0 text-white/45 transition-colors" />
            <span className="sr-only">(구글폼, 새 창에서 열림)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

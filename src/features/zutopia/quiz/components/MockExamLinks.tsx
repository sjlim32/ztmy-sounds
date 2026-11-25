import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { MOCK_EXAMS } from "@/features/zutopia/quiz/data";

/** 모의고사 회차별 구글폼 링크 — 1회부터 왼쪽에서 오른쪽으로, 새 창으로 연다. */
export function MockExamLinks() {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3",
        "tablet:grid-cols-3 tablet:gap-4",
        "pc:grid-cols-5",
      )}
    >
      {MOCK_EXAMS.map((exam) => (
        <li key={exam.round}>
          <a
            href={exam.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              ZUTOPIA_SURFACE_CLASS,
              "group flex items-start justify-between gap-3 p-4",
              "hover:border-ztmy-magenta/60 transition-colors",
              "tablet:p-5",
            )}
          >
            <span className="flex flex-col gap-1">
              <span className="tablet:text-xl group-hover:text-ztmy-pink text-lg font-bold text-white transition-colors">
                제{exam.round}회
              </span>
              <span className="text-sm text-white/55 tabular-nums">
                {exam.date}
              </span>
            </span>
            <ExternalLinkIcon className="group-hover:text-ztmy-pink mt-1 h-4 w-4 shrink-0 text-white/45 transition-colors" />
            <span className="sr-only">(구글폼, 새 창에서 열림)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

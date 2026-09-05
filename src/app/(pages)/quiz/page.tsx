import Link from "next/link";
import { cn } from "@/lib/utils";
import { TargetIcon } from "@/components/icons/TargetIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { ARTIST } from "@/data/artist";
import { DIFFICULTY_LABELS } from "@/features/quiz/lib/types";
import type { Difficulty } from "@/features/quiz/lib/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme"];

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: "이제 막 입덕",
  medium: "웬만한 건 아는 편",
  hard: "덕질 좀 해본 사람",
  extreme: "모르는 게 없는 수준",
};

const DIFFICULTY_ACCENT: Record<
  Difficulty,
  { bar: string; hoverBorder: string }
> = {
  easy: { bar: "bg-ztmy-pink", hoverBorder: "hover:border-ztmy-pink" },
  medium: { bar: "bg-ztmy-magenta", hoverBorder: "hover:border-ztmy-magenta" },
  hard: { bar: "bg-ztmy-purple", hoverBorder: "hover:border-ztmy-purple" },
  extreme: { bar: "bg-ztmy-dark", hoverBorder: "hover:border-ztmy-dark" },
};

export default function QuizHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-12">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="from-ztmy-magenta to-ztmy-purple h-1 w-6 shrink-0 rounded-full bg-linear-to-r shadow-[0_0_10px_rgba(225,71,191,0.6)]" />
          <span className="font-mono text-[10px] font-medium tracking-[0.3em] text-white/50 uppercase">
            Quiz
          </span>
        </div>
        <h1
          className={cn(
            "font-mkpop leading-tight font-extrabold tracking-tight text-white",
            "tablet:text-2xl text-4xl",
          )}
        >
          {ARTIST.name.jp}에 대해 얼마나 아는지 확인해볼까요 ?
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] font-medium tracking-[0.3em] text-white/40 uppercase">
            연습 문제
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DIFFICULTIES.map((difficulty) => (
              <Link
                key={difficulty}
                href={`/quiz/practice?difficulty=${difficulty}`}
                className={cn(
                  "relative border border-white/20 bg-black/30 p-5 transition-colors",
                  DIFFICULTY_ACCENT[difficulty].hoverBorder,
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-0.5",
                    DIFFICULTY_ACCENT[difficulty].bar,
                  )}
                />
                <p className="text-lg font-bold text-white">
                  {DIFFICULTY_LABELS[difficulty]}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {DIFFICULTY_DESCRIPTIONS[difficulty]}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        <Link
          href="/quiz/test"
          className={cn(
            "group relative border border-white/20 bg-black/30 p-6",
            "shadow-[0_0_24px_rgba(141,60,212,0.25)]",
            "hover:border-ztmy-magenta",
          )}
        >
          <div className="flex items-center justify-between">
            <TargetIcon className="text-ztmy-magenta h-7 w-7" />
            <span className="bg-ztmy-magenta/20 text-ztmy-pink rounded-full px-2.5 py-1 font-mono text-[9px] font-medium tracking-[0.2em] uppercase">
              기기당 1회
            </span>
          </div>

          <p className="mt-5 text-xl font-bold text-white">실제 테스트</p>

          <span className="relative mt-2 block h-px w-full overflow-hidden bg-white/15">
            <span className="from-ztmy-magenta to-ztmy-purple absolute inset-y-0 left-0 w-0 bg-linear-to-r transition-all duration-500 ease-out group-hover:w-full" />
          </span>

          <p className="mt-3 text-sm leading-relaxed text-white/60">
            다 풀고 한 번에 제출. 점수로 증명하는 단 한 번의 기회.
          </p>
        </Link>
      </div>

      <Link
        href="/"
        className="group mx-auto my-2 flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:font-semibold hover:text-white"
      >
        <HomeIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        메인으로
      </Link>
    </main>
  );
}

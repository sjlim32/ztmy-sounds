"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QuizPractice } from "@/features/quiz/components/QuizPractice";
import { DIFFICULTY_LABELS } from "@/features/quiz/lib/types";
import type { Difficulty } from "@/features/quiz/lib/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme"];

function isDifficulty(value: string | null): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

function DifficultyPicker() {
  return (
    <div className="flex flex-col gap-3">
      {DIFFICULTIES.map((difficulty) => (
        <Link
          key={difficulty}
          href={`/quiz/practice?difficulty=${difficulty}`}
          className="hover:border-ztmy-purple rounded-sm border border-white/20 px-4 py-3 text-white"
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Link>
      ))}
    </div>
  );
}

function QuizPracticeContent() {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get("difficulty");

  if (!isDifficulty(difficultyParam)) {
    return <DifficultyPicker />;
  }

  return <QuizPractice key={difficultyParam} difficulty={difficultyParam} />;
}

export default function QuizPracticePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">퀴즈 연습</h1>
      <Suspense fallback={<p className="text-white/60">불러오는 중...</p>}>
        <QuizPracticeContent />
      </Suspense>
    </main>
  );
}

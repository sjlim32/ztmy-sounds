"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getRandomPracticeQuestion,
  revealPracticeAnswer,
} from "@/features/quiz/lib/api";
import type {
  PracticeQuestion,
  RevealAnswerResult,
} from "@/features/quiz/lib/types";

type Phase = "loading" | "answering" | "revealed" | "error";

export function QuizPractice() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealAnswerResult | null>(null);

  const loadQuestion = useCallback(() => {
    setPhase("loading");
    setSelected(null);
    setReveal(null);
    getRandomPracticeQuestion()
      .then((q) => {
        setQuestion(q);
        setPhase("answering");
      })
      .catch(() => setPhase("error"));
  }, []);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  if (phase === "loading") {
    return <p className="text-white/60">문제를 불러오는 중...</p>;
  }

  if (phase === "error") {
    return <p className="text-ztmy-pink">문제를 불러오지 못했습니다.</p>;
  }

  if (!question) return null;

  const options =
    question.type === "ox" ? ["O", "X"] : (question.choices ?? []);

  const handleSelect = (optionValue: string) => {
    if (phase !== "answering") return;
    setSelected(optionValue);
    revealPracticeAnswer(question.id)
      .then((result) => {
        setReveal(result);
        setPhase("revealed");
      })
      .catch(() => setPhase("error"));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-bold text-white">{question.question_text}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const optionValue = question.type === "mc" ? String(index) : option;
          const isSelected = selected === optionValue;
          const isCorrect = reveal?.correct_answer === optionValue;

          return (
            <button
              key={option}
              type="button"
              disabled={phase === "revealed"}
              onClick={() => handleSelect(optionValue)}
              className={cn(
                "rounded-sm border border-white/20 px-4 py-2 text-sm text-white transition-colors",
                "hover:border-ztmy-purple",
                phase === "revealed" &&
                  isCorrect &&
                  "border-ztmy-purple bg-ztmy-purple/30",
                phase === "revealed" &&
                  isSelected &&
                  !isCorrect &&
                  "border-ztmy-pink bg-ztmy-pink/20",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {phase === "revealed" && reveal && (
        <div className="rounded-sm border border-white/10 bg-black/40 p-3 text-sm text-white/80">
          <p>
            정답:{" "}
            <span className="text-ztmy-purple font-bold">
              {reveal.correct_answer}
            </span>
          </p>
          {reveal.explanation && (
            <p className="mt-1 text-white/60">{reveal.explanation}</p>
          )}
        </div>
      )}

      {phase === "revealed" && (
        <button
          type="button"
          onClick={loadQuestion}
          className="bg-ztmy-purple w-fit rounded-sm px-4 py-2 text-sm font-bold text-white"
        >
          다음 문제
        </button>
      )}
    </div>
  );
}

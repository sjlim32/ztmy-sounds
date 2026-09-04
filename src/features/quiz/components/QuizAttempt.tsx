"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/features/quiz/lib/device-id";
import { getFingerprint } from "@/features/quiz/lib/fingerprint";
import { startQuizAttempt, submitQuizAttempt } from "@/features/quiz/lib/api";
import type { PracticeQuestion } from "@/features/quiz/lib/types";

type Phase = "loading" | "answering" | "submitting" | "result" | "error";

export function QuizAttempt() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    const deviceId = getDeviceId();

    getFingerprint()
      .catch(() => null)
      .then((fingerprint) => startQuizAttempt(deviceId, fingerprint ?? null))
      .then((res) => {
        if (res.already_submitted) {
          setResult({ score: res.score ?? 0, total: res.total ?? 0 });
          setPhase("result");
          return;
        }
        setAttemptId(res.attempt_id);
        setQuestions(res.questions ?? []);
        setPhase("answering");
      })
      .catch(() => setPhase("error"));
  }, []);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    setPhase("submitting");
    submitQuizAttempt(attemptId, getDeviceId(), answers)
      .then((res) => {
        setResult(res);
        setPhase("result");
      })
      .catch(() => setPhase("error"));
  };

  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  if (phase === "loading") {
    return <p className="text-white/60">응시 정보를 확인하는 중...</p>;
  }

  if (phase === "error") {
    return <p className="text-ztmy-pink">문제를 불러오지 못했습니다.</p>;
  }

  if (phase === "result" && result) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-sm border border-white/10 bg-black/40 p-6">
        <p className="text-sm text-white/60">결과</p>
        <p className="text-ztmy-purple text-3xl font-bold">
          {result.score} / {result.total}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, qIndex) => {
        const options =
          question.type === "ox" ? ["O", "X"] : (question.choices ?? []);

        return (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="font-bold text-white">
              {qIndex + 1}. {question.question_text}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((option, index) => {
                const optionValue =
                  question.type === "mc" ? String(index) : option;
                const isSelected = answers[question.id] === optionValue;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswer(question.id, optionValue)}
                    className={cn(
                      "rounded-sm border px-4 py-2 text-sm text-white",
                      isSelected
                        ? "border-ztmy-purple bg-ztmy-purple/30"
                        : "hover:border-ztmy-purple border-white/20",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        disabled={!allAnswered || phase === "submitting"}
        onClick={handleSubmit}
        className="bg-ztmy-purple w-fit rounded-sm px-6 py-2 font-bold text-white disabled:opacity-40"
      >
        {phase === "submitting" ? "제출 중..." : "제출하기"}
      </button>
    </div>
  );
}

import { QuizPractice } from "@/features/quiz/components/QuizPractice";

export default function QuizPracticePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">퀴즈 연습</h1>
      <QuizPractice />
    </main>
  );
}

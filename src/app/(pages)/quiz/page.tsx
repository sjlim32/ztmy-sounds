import Link from "next/link";

export default function QuizHomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">퀴즈</h1>
      <div className="flex flex-col gap-3">
        <Link
          href="/quiz/practice"
          className="hover:border-ztmy-purple rounded-sm border border-white/20 px-4 py-3 text-white"
        >
          연습 문제 풀기
        </Link>
        <Link
          href="/quiz/test"
          className="hover:border-ztmy-purple rounded-sm border border-white/20 px-4 py-3 text-white"
        >
          실제 테스트 응시 (기기당 1회)
        </Link>
      </div>
    </main>
  );
}

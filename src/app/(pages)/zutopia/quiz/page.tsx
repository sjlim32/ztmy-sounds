import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { QuizSoonChip } from "@/features/zutopia/quiz/components/QuizSoonChip";
import { MockExamLinks } from "@/features/zutopia/quiz/components/MockExamLinks";
import { PracticeLevels } from "@/features/zutopia/quiz/components/PracticeLevels";
import { RealTestCard } from "@/features/zutopia/quiz/components/RealTestCard";
import { MOCK_EXAM_CREDIT_ID } from "@/features/zutopia/quiz/data";

export const metadata: Metadata = {
  title: "퀴즈",
  description:
    "즛토마요 퀴즈 — 난이도별 연습, 실전 테스트, 즛토마요 마이너 갤러리 모의고사 모음.",
};

/**
 * 퀴즈 허브 — 위에서부터 연습하기(난이도 4단계) / 실전 테스트 / 모의고사(갤러리
 * 구글폼 링크). 구역마다 제목 줄(SectionHeader) + 카드 한 장(안은 구분선 줄). 연습·실전은
 * 아직 문제가 없어 누를 수 없는 "준비 중" 상태 — 표시는 제목 줄 오른쪽에 한 번.
 */
export default function ZutopiaQuizPage() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">즛토마요 퀴즈</h1>

      <section aria-labelledby="quiz-practice" className="flex flex-col gap-3">
        <SectionHeader
          title={<h2 id="quiz-practice">연습하기</h2>}
          action={<QuizSoonChip />}
        />
        <PracticeLevels />
      </section>

      <section aria-labelledby="quiz-test" className="flex flex-col gap-3">
        <SectionHeader
          title={<h2 id="quiz-test">실전 테스트</h2>}
          action={<QuizSoonChip />}
        />
        <RealTestCard />
      </section>

      <section aria-labelledby="quiz-mock" className="flex flex-col gap-3">
        <SectionHeader
          title={<h2 id="quiz-mock">모의고사</h2>}
          meta="구글폼 · 새 창"
        />
        <MockExamLinks />
        {/* 출제자·공개 글은 출처 페이지의 모의고사 항목에 */}
        <Link
          href={`/credits#${MOCK_EXAM_CREDIT_ID}`}
          className="drop-shadow-legible self-start text-sm text-white/60 underline underline-offset-2 transition-colors hover:text-white"
        >
          출처
        </Link>
      </section>
    </div>
  );
}

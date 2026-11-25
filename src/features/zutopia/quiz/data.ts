/**
 * 퀴즈 페이지(/zutopia/quiz)의 고정 데이터 — 연습 난이도와 갤러리 모의고사 목록.
 * DB가 아니라 코드에 두는 건 자주 바뀌지 않는 짧은 목록이라서다.
 */

/** 연습하기 난이도 — 쉬운 것부터 순서대로(1~4단계). */
export const QUIZ_LEVELS = [
  { id: "baby", label: "즛응애" },
  { id: "newbie", label: "즛뉴비" },
  { id: "youth", label: "즛청년" },
  { id: "elder", label: "즛할배" },
] as const;

export interface MockExam {
  round: number;
  /** 공개일(YYYY.MM.DD) */
  date: string;
  /** 응시 구글폼 */
  formUrl: string;
  /** 공개 글(즛토마요 마이너 갤러리) — 출처 페이지에 링크 */
  postUrl: string;
}

/** 모의고사 출제자(즛토마요 마이너 갤러리) — 출처 페이지(/credits)에 표시. */
export const MOCK_EXAM_AUTHOR = "포재앙아웃";

/** 출처 페이지의 모의고사 항목 id — 퀴즈 페이지 "출처" 링크가 /credits#이 값으로 간다. */
export const MOCK_EXAM_CREDIT_ID = "mock-exam";

/**
 * 즛토마요 마이너 갤러리의 "즛토마요 모의고사" — 회차 순(화면에도 1회부터).
 * 새 회차가 나오면 끝에 더한다.
 */
export const MOCK_EXAMS: readonly MockExam[] = [
  {
    round: 1,
    date: "2024.11.23",
    formUrl: "https://forms.gle/64QL8F7H47RREJKp8",
    postUrl:
      "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=169827",
  },
  {
    round: 2,
    date: "2024.12.31",
    formUrl: "https://forms.gle/7jLfgbmNJXReSZLm7",
    postUrl:
      "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=174909",
  },
  {
    round: 3,
    date: "2025.11.24",
    formUrl: "https://forms.gle/LQECka4HQCavm3iq6",
    postUrl:
      "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=268132",
  },
  {
    round: 4,
    date: "2026.02.02",
    formUrl: "https://forms.gle/yuJTvRo22UaY4gmG6",
    postUrl:
      "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=316485",
  },
  {
    round: 5,
    date: "2026.06.26",
    formUrl: "https://forms.gle/hsELgzugK9gTse7A9",
    postUrl:
      "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=444329",
  },
];

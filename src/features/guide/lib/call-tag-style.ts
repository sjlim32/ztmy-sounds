import type { CallTag } from "@/features/guide/lib/types";

/**
 * 응원 종류별 대표색 — 가사 응원 설명·응원 단어 글자색, 응원 표시 안내가 같이 씁니다.
 * 스윙/클랩/떼창/댄스는 샤모지 아이콘(public/assets/guide/shamoji/) 색에서 뽑은
 * 값이라 아이콘과 같이 바꿔야 합니다. 슬램은 클랩 빨강과 겹치지 않게 노랑.
 */
export const CALL_TAG_COLOR: Record<CallTag, string> = {
  call: "#fe4399",
  swing: "#24d6fe",
  clap: "#f43737",
  dance: "#b628fa",
  slam: "#facc15",
};

/** 응원 종류 이름 — 아이콘 대체 텍스트와 배지·안내 문구에 씁니다. */
export const CALL_TAG_LABEL: Record<CallTag, string> = {
  swing: "샤모지 흔들기",
  clap: "샤모지 박수",
  call: "떼창",
  dance: "샤모지 댄스",
  slam: "슬램",
};

/**
 * 짧은 이름 — 가이드 화면(곡 목록 필터·가사 응원 설명·응원 표시 안내) 안에선
 * 전부 샤모지 응원이라 "샤모지"를 뺀다. 긴 이름(CALL_TAG_LABEL)은 아이콘
 * 대체 텍스트용.
 */
export const CALL_TAG_SHORT_LABEL: Record<CallTag, string> = {
  swing: "흔들기",
  clap: "박수",
  call: "떼창",
  dance: "댄스",
  slam: "슬램",
};

/** 대표색에 알파값(00~ff 16진수 두 자리)을 붙인 색. */
export function withAlpha(tag: CallTag, alphaHex: string): string {
  return `${CALL_TAG_COLOR[tag]}${alphaHex}`;
}

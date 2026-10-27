import type { CallTag } from "@/features/guide/lib/types";

/** 응원 종류별 대표색 — 가사 배지, 단어 형광펜, 응원 표시 안내가 같이 씁니다. */
export const CALL_TAG_COLOR: Record<CallTag, string> = {
  call: "#f97316",
  swing: "#82fa2a",
  clap: "#6dd6fc",
  slam: "#ef4444",
};

/** 응원 종류 이름 — 아이콘 대체 텍스트와 배지·안내 문구에 씁니다. */
export const CALL_TAG_LABEL: Record<CallTag, string> = {
  swing: "샤모지 흔들기",
  clap: "샤모지 박수",
  call: "떼창",
  slam: "슬램",
};

/** 응원 표시 안내에 쓰는 한 줄 설명 (처음 온 사람 기준). */
export const CALL_TAG_DESCRIPTION: Record<CallTag, string> = {
  swing: "샤모지를 흔들어요",
  clap: "샤모지로 박수",
  call: "다 같이 외쳐요",
  slam: "다 같이 슬램해요",
};

/** 대표색에 알파값(00~ff 16진수 두 자리)을 붙인 색. */
export function withAlpha(tag: CallTag, alphaHex: string): string {
  return `${CALL_TAG_COLOR[tag]}${alphaHex}`;
}

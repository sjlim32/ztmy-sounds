import type { Json } from "@/lib/supabase/database.types";

const ORDINAL_BY_WORD: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
};

// "한 번째"가 아니라 "첫 번째"처럼 서수 관형사가 불규칙이라 표로 둔다.
const KOREAN_ORDINAL = [
  "",
  "첫",
  "두",
  "세",
  "네",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];

/**
 * lives/tours.metadata.visited("first", "second", "third" …)가 있으면 내한
 * 공연이다 — 몇 번째 내한인지 숫자로 돌려주고, 아니면 null. 표에 없는
 * 값이라도 visited 키가 채워져 있으면 내한 공연이긴 하므로 0(차수 미상)을
 * 돌려준다.
 */
export function parseVisitOrdinal(metadata: Json | null): number | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const visited = (metadata as Record<string, unknown>).visited;
  if (typeof visited !== "string" || visited.length === 0) return null;
  return ORDINAL_BY_WORD[visited.toLowerCase()] ?? 0;
}

export function formatVisitLabel(ordinal: number): string {
  const korean = KOREAN_ORDINAL[ordinal];
  return korean ? `${korean} 번째 내한` : "내한 공연";
}

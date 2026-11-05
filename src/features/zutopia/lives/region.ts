// lives/data.ts(서버 전용)와 live-history/units.ts(순수 계산·테스트 대상)가
// 같이 쓰려고 따로 둔다.

// "大阪 (오사카)" → { city: "오사카", original: "大阪" }. 괄호가 없으면 원본을
// 그대로 city로 쓴다.
export function splitRegion(region: string): {
  city: string;
  original: string | null;
} {
  const match = region.match(/^(.*\S)\s*\(([^()]*)\)\s*$/);
  return match
    ? { city: match[2], original: match[1] }
    : { city: region, original: null };
}

/**
 * lives.region은 "大阪 (오사카)"처럼 "원어 (한글)" 형식이다 — 목록 카드엔
 * 한글 도시명만 보여준다. 괄호가 없는(패턴에 안 맞는) 값은 원본 그대로
 * 돌려준다.
 */
export function extractKoreanCity(region: string): string {
  return splitRegion(region).city;
}

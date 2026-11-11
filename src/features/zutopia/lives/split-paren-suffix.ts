// 공연 티켓(LiveTicket)과 통계(stats/compute.ts)가 같이 쓰는 순수 함수 — UI 파일에
// 두면 빌드 시점 계산·테스트가 아이콘·컴포넌트까지 끌어와서 따로 둔다.

/**
 * "본문 (부연설명)" 형태로 끝에 괄호가 붙어 있으면 분리한다 —
 * NextEventCard의 placeDesc(장소명 아래 회색 보조 텍스트)와 동일하게
 * 소괄호 없이 두 줄로 보여주기 위함. 끝 괄호 안에 괄호가 또 있어도
 * ("幕張メッセ (1~11ホール) (마쿠하리 멧세(1~11홀))") 짝을 맞춰 마지막 괄호만
 * 떼어 낸다. 괄호가 없으면 그대로 하나의 문자열로 취급한다.
 */
export function splitParenSuffix(text: string): {
  main: string;
  suffix: string | null;
} {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith(")")) return { main: text, suffix: null };

  let depth = 0;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i] === ")") depth++;
    else if (trimmed[i] === "(") depth--;
    if (depth === 0) {
      const main = trimmed.slice(0, i).trimEnd();
      // 앞에 공백 없이 붙은 괄호("国際展示場(1~8ホール)")는 이름의 일부라 그대로 둔다.
      if (!main || main.length === i) return { main: text, suffix: null };
      return { main, suffix: trimmed.slice(i + 1, -1) };
    }
  }
  return { main: text, suffix: null };
}

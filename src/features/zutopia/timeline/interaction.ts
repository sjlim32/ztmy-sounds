/**
 * 연혁 휠 입력 해석 — Ctrl/⌘(트랙패드 핀치)는 확대 단계. 세로 휠은 좌우 이동으로
 * 바꾸되, 세로로 넘친 내용이 있거나(아래 줄에 닿아야 한다) 좌우 끝에 닿았으면
 * (페이지가 세로로 움직일 수 있게) 브라우저 기본에 맡긴다. 가로 위주 휠도 기본.
 */
export function wheelIntent(
  event: { ctrlKey: boolean; metaKey: boolean; deltaX: number; deltaY: number },
  state: { canScrollY: boolean; atEdge: boolean },
): "zoom" | "horizontal" | "native" {
  if (event.ctrlKey || event.metaKey) return "zoom";
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return "native";
  return state.canScrollY || state.atEdge ? "native" : "horizontal";
}

/** 묶음 카드 높이 어림값 — 그림 줄, '외 N개' 줄. */
const CLUSTER_HEADER = 52;
const CLUSTER_MORE = 24;

/** 한·중·일 글자와 전각 문자(한 글자 = 글자 크기 폭) */
const WIDE_CHAR =
  /[\u1100-\u11ff\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;

/**
 * 글이 폭 안에서 몇 줄이 될지 어림한다(줄바꿈 표시용 높이 계산). 한·일 글자는
 * 글자 크기만큼, 영문·숫자·기호는 그 0.6배 폭으로 본다. 실제보다 살짝 넉넉하게
 * 잡아야 카드가 겹치지 않는다.
 */
export function textLines(
  text: string,
  widthPx: number,
  fontPx: number,
): number {
  if (!text) return 0;
  let em = 0;
  for (const char of text) em += WIDE_CHAR.test(char) ? 1 : 0.6;
  return Math.max(1, Math.ceil((em * fontPx) / widthPx));
}

/**
 * 월 묶음 카드에 이름을 몇 개까지 적을지 — 이름마다 높이(줄 수에 따라)를 받아,
 * 카드가 축 위·아래 자리를 넘으면 들어가는 만큼만 적고 '외 N개'(누르면 그 달로
 * 확대해서 전부 보임). 최소 1개.
 */
export function visibleNameCount(
  heights: readonly number[],
  availablePx: number,
): number {
  const total = heights.reduce((a, b) => a + b, 0);
  if (CLUSTER_HEADER + total <= availablePx) return heights.length;
  let room = availablePx - CLUSTER_HEADER - CLUSTER_MORE;
  let count = 0;
  for (const height of heights) {
    if (height > room) break;
    room -= height;
    count++;
  }
  return Math.max(1, count);
}

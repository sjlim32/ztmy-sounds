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

/** 묶음 카드 높이 어림값 — 그림 줄, '외 N개' 줄, 이름 하나(한국어 + 일본어 두 줄). */
const CLUSTER_HEADER = 52;
const CLUSTER_MORE = 24;
const CLUSTER_NAME = 44;

/**
 * 월 묶음 카드에 이름을 몇 개까지 적을지 — 카드가 축 위·아래 자리를 넘으면
 * 위가 잘려 닿을 수 없으니, 넘칠 땐 들어가는 만큼만 적고 '외 N개'(누르면 그 달로
 * 확대해서 전부 보임). 최소 1개.
 */
export function visibleNameCount(total: number, availablePx: number): number {
  if (CLUSTER_HEADER + total * CLUSTER_NAME <= availablePx) return total;
  return Math.max(
    1,
    Math.floor((availablePx - CLUSTER_HEADER - CLUSTER_MORE) / CLUSTER_NAME),
  );
}

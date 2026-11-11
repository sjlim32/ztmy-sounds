/**
 * 화면을 덮는 창(role="dialog" aria-modal="true")이 지금 열려 있는지. 닫힌 뒤에도
 * DOM에 남겨 두는 창(곡 상세 드로어 등 — 바깥 래퍼에 aria-hidden)은 열린 것으로
 * 치지 않는다. 단축키·Esc가 그 창 몫인지 가를 때 쓴다(Popover, 통합 검색).
 */
export function hasOpenModal(): boolean {
  return [
    ...document.querySelectorAll('[role="dialog"][aria-modal="true"]'),
  ].some((dialog) => !dialog.closest('[aria-hidden="true"]'));
}

export const TALLY_FORM_ID = "814rXx";

/**
 * 새 탭으로 여는 건의 폼 주소. params는 Tally 폼에서 같은 이름의 숨김
 * 필드(Hidden fields)에 미리 채워진다 — 폼에 그 필드가 없으면 그냥 무시된다.
 */
export function getFeedbackUrl(params?: Record<string, string>): string {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  return `https://tally.so/r/${TALLY_FORM_ID}${query}`;
}

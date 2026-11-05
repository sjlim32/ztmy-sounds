/**
 * 앱 안 브라우저(카카오톡·인스타그램 등) 감지 — 이런 브라우저의 localStorage는
 * Safari·Chrome과 따로라, 여기서 체크한 기록은 그 앱 안에만 남는다. 사용자에게
 * 알리고, 가능하면(카카오톡) 기본 브라우저로 여는 길을 준다.
 */
export function detectInAppBrowser(userAgent: string): string | null {
  if (/KAKAOTALK/i.test(userAgent)) return "카카오톡";
  if (/Instagram/i.test(userAgent)) return "인스타그램";
  if (/FBAN|FBAV/.test(userAgent)) return "페이스북";
  if (/\bLine\//.test(userAgent)) return "라인";
  if (/Twitter/i.test(userAgent)) return "X(트위터)";
  return null;
}

/** 기본 브라우저로 여는 주소(카카오톡만 지원). 없으면 null. */
export function openExternalUrl(app: string, url: string): string | null {
  return app === "카카오톡"
    ? `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
    : null;
}

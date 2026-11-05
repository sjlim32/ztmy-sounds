const R2_ORIGIN = "https://assets.ztmy-sounds.fans/";

/**
 * Supabase에 들어 있는 R2 이미지 절대 주소를 프로덕션 빌드에서만 메인 도메인의
 * /r2/ 경로로 바꾼다. /r2/*는 Pages Function(functions/r2/[[path]].ts)이 R2로
 * 넘겨 주는 프록시라, 브라우저 입장에선 같은 출처가 된다 — 메인 도메인의
 * HTTP/3 연결을 그대로 쓰고, 참전 기록 이미지 저장(canvas)이 CORS에 막히지 않는다.
 * next dev에서는 Pages Function이 돌지 않으므로 원래 주소를 그대로 둔다.
 */
export function toAssetUrl(url: string): string;
export function toAssetUrl(url: string | null): string | null;
export function toAssetUrl(url: string | null): string | null {
  if (url === null) return null;
  if (process.env.NODE_ENV !== "production") return url;
  if (!url.startsWith(R2_ORIGIN)) return url;
  return `/r2/${url.slice(R2_ORIGIN.length)}`;
}

const SINGLE_IMAGE_KEYS = [
  "cover_image_url",
  "poster_image_url",
  "icon_image_url",
] as const;
const LIST_IMAGE_KEYS = ["additional_image_urls", "book_image_urls"] as const;

/**
 * Supabase 행의 이미지 컬럼(cover/poster/icon_image_url, additional/book_image_urls)만
 * toAssetUrl로 바꾼 사본. 데이터 계층(song-db/data.ts, lives/data.ts)이 행을
 * 내려주기 직전에 거쳐서, 화면 컴포넌트는 주소 변환을 몰라도 된다.
 */
export function withAssetUrls<T extends object>(row: T): T {
  const next = { ...row } as Record<string, unknown>;
  for (const key of SINGLE_IMAGE_KEYS) {
    const value = next[key];
    if (typeof value === "string") next[key] = toAssetUrl(value);
  }
  for (const key of LIST_IMAGE_KEYS) {
    const list = next[key];
    if (Array.isArray(list)) {
      next[key] = list.map((url) =>
        typeof url === "string" ? toAssetUrl(url) : url,
      );
    }
  }
  return next as T;
}

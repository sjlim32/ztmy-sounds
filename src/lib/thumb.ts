const R2_ORIGIN = "https://assets.ztmy-sounds.fans/";

/**
 * 작은 자리(썸네일)에 쓰는 R2 이미지 주소 — Cloudflare 이미지 변환으로 화면 크기의
 * 2배 너비(고해상도 화면)·브라우저가 받는 포맷(avif/webp)으로 줄인다. 원본 커버·
 * 포스터는 수백 KB라 작은 칸에 그대로 쓰면 낭비가 크다. R2가 아닌 주소는 그대로.
 * 변환이 실패하면 원본으로 돌아가는 건 ThumbImage가 맡는다.
 */
export function thumbSrc(url: string, displayWidth: number): string {
  if (!url.startsWith(R2_ORIGIN) || url.includes("/cdn-cgi/image/")) return url;
  const path = url.slice(R2_ORIGIN.length);
  return `${R2_ORIGIN}cdn-cgi/image/width=${Math.round(displayWidth * 2)},format=auto/${path}`;
}

const R2_ORIGIN = "https://assets.ztmy-sounds.fans/";
// public/assets/ 이미지도 사이트 도메인(같은 Cloudflare 영역)에서 같은 변환을 쓸 수 있다.
const LOCAL_ASSETS_PREFIX = "/assets/";

/**
 * Cloudflare 이미지 변환 주소 — pixelWidth 픽셀 폭·브라우저가 받는 포맷(avif/webp).
 * 원본보다 크게 요청하면 키우지 않고 원본 크기로 준다. R2 이미지와 사이트 안
 * `/assets/` 이미지만 바꾸고, 다른 주소·이미 변환된 주소는 null.
 */
function resizedSrc(url: string, pixelWidth: number): string | null {
  if (url.includes("/cdn-cgi/image/")) return null;
  const options = `width=${Math.round(pixelWidth)},quality=90,format=auto`;
  if (url.startsWith(R2_ORIGIN)) {
    return `${R2_ORIGIN}cdn-cgi/image/${options}/${url.slice(R2_ORIGIN.length)}`;
  }
  if (url.startsWith(LOCAL_ASSETS_PREFIX)) {
    return `/cdn-cgi/image/${options}${url}`;
  }
  return null;
}

/**
 * 작은 자리(썸네일)에 쓰는 이미지 주소 — 화면 크기의 2배 너비(고해상도 화면)로
 * 줄인다. 원본 커버·포스터는 수백 KB라 작은 칸에 그대로 쓰면 낭비가 크다. 바꿀 수
 * 없는 주소는 그대로. 변환이 실패하면(개발 서버엔 `/cdn-cgi/`가 없음) 원본으로
 * 돌아가는 건 ThumbImage가 맡는다.
 */
export function thumbSrc(url: string, displayWidth: number): string {
  return resizedSrc(url, displayWidth * 2) ?? url;
}

// 휴대폰(화면 폭 100%로 보일 때)·태블릿·PC 고해상도 화면을 고루 덮는 후보 폭.
const SRCSET_WIDTHS = [400, 800, 1200, 1600, 2000];

// 휴대폰에서 화면 폭 가득 보일 때(약 400px × 화면 배율 3) 필요한 폭.
const FULL_WIDTH_PHONE_PX = 1200;

/**
 * 화면 폭에 따라 크기가 달라지는 이미지용 srcset — PC에서 displayWidth로 보이는
 * 이미지에, 그 2배(휴대폰에서 화면 폭 가득 보일 수 있어 최소 1200)까지의 후보 폭을
 * 준다(`sizes`와 함께 써서 브라우저가 고른다). 원본보다 큰 후보는 Cloudflare가 원본
 * 크기로 준다. 바꿀 수 없는 주소면 null.
 */
export function thumbSrcSet(url: string, displayWidth: number): string | null {
  const maxWidth = Math.max(Math.round(displayWidth * 2), FULL_WIDTH_PHONE_PX);
  const widths = [
    ...new Set([...SRCSET_WIDTHS.filter((w) => w < maxWidth), maxWidth]),
  ];
  const entries: string[] = [];
  for (const width of widths) {
    const resized = resizedSrc(url, width);
    if (!resized) return null;
    entries.push(`${resized} ${width}w`);
  }
  return entries.join(", ");
}

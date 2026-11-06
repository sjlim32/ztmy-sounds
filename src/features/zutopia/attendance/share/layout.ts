/**
 * 참전 기록 이미지(정사각형, PC·모바일 같음)의 배치 계산. 1080×1080 기준으로 하고,
 * 저장할 때 SHARE_PIXEL_RATIO배(2160×2160)로 그린다. ShareImage.tsx가 같은 상수로
 * 그려서 여기서 계산한 높이가 실제 이미지와 맞는다(layout.test.ts가 "몇 곡이든
 * 자리 안에 들어간다"를 확인).
 *
 * 구성(위→아래): 머리(작은 제목·숫자, 오른쪽 위 작은 로고) → TOP 5(앨범 표지
 * 카드, 늘 표지, 가운데 정렬) → 6위부터 목록(성불 COVER_UNTIL곡 미만이면 표지를 꼭 넣고, 곡이
 * 많으면 열을 늘린다) → 생성일 · 주소 · QR.
 */
export const SHARE_SIZE = 1080;
/** 저장 해상도 배율 — 1080 배치를 2160×2160 PNG로 */
export const SHARE_PIXEL_RATIO = 2;

/** 흰 테두리 안쪽 여백 */
export const SHARE_PADDING = 56;
export const SHARE_INNER_WIDTH = SHARE_SIZE - SHARE_PADDING * 2;
/** 머리: 작은 제목 + 숫자 줄(오른쪽 위 작은 로고) */
export const SHARE_HEADER_HEIGHT = 112;
/** 구역 사이 간격 */
export const SECTION_GAP = 28;
/** 구역 이름 줄("TOP 5", "6위부터") — 글자 + 아래 간격 */
export const SECTION_LABEL_HEIGHT = 34;
/** 생성일 · 주소 · QR 줄 */
export const SHARE_FOOTER_HEIGHT = 64;
/**
 * QR 크기(1080 기준) — 33칸(오류 보정 L, 여백 포함) × 1.5 = 49.5. 저장 이미지(2160)에서
 * 칸 하나가 정확히 3px(반 픽셀에 걸려 흐려지지 않게)이라, 저장된 이미지를 사진 앱·
 * 구글 렌즈로 읽을 수 있는 가장 작은 크기.
 */
export const SHARE_QR_SIZE = 49.5;
export const SHARE_COLUMN_GAP = 24;

/** 줄 높이 배율 — ShareImage의 line-height와 같다. */
export const LINE_HEIGHT = 1.25;

/** TOP 카드 수와 카드 사이 간격 */
export const TOP_COUNT = 5;
export const TOP_GAP = 16;
/**
 * TOP 카드 크기 배율 — 한 줄을 꽉 채우는 폭의 2/3. 남는 높이를 6위부터 목록에
 * 돌려 곡 간격·제목이 잘 보이게(42곡 기준 피드백).
 */
const TOP_SCALE = 2 / 3;
/** 곡이 적어 TOP 카드가 다섯 장보다 적을 때 카드 최대 폭 */
const TOP_MAX_WIDTH = 200;
/** TOP 카드 글자: 원어 제목 · 한국어 · 횟수 */
export const TOP_TEXT = { titlePx: 18, subPx: 14, countPx: 17 };
/** TOP 카드 표지 아래 글자 영역 높이(간격 포함) */
export const TOP_TEXT_HEIGHT =
  10 +
  TOP_TEXT.titlePx * LINE_HEIGHT +
  TOP_TEXT.subPx * LINE_HEIGHT +
  6 +
  TOP_TEXT.countPx * LINE_HEIGHT;

/** 성불 곡이 이 수보다 적으면 6위부터 목록에도 표지를 꼭 넣는다(아무리 작아도). */
export const COVER_UNTIL = 50;
/** 6위부터 목록에서 이 크기 이상이면 "읽기 좋다"로 본다. */
export const READABLE_REST_PX = 18;
/** 6위부터 제목 글자의 최소 크기 — 이보다 작아지는 단계는 다른 단계가 없을 때만. */
const MIN_REST_TITLE_PX = 16;

export interface RestLayout {
  /** 6위부터 곡 수 */
  count: number;
  columns: number;
  showCover: boolean;
  /** false면 곡마다 원어 + 한국어만(영어 줄을 뺀다) */
  showEnglish: boolean;
  coverPx: number;
  titlePx: number;
  subPx: number;
  rowGapPx: number;
}

export interface ShareLayout {
  /** TOP 카드 수(성불 곡이 5곡보다 적으면 그 수) */
  topCount: number;
  topCardWidth: number;
  /** 6위부터 목록. 5곡 이하면 null */
  rest: RestLayout | null;
}

/** TOP 카드 n장의 폭 — 다섯 장이면 한 줄을 꽉, 적으면 크게(최대 TOP_MAX_WIDTH). */
function topCardWidth(n: number): number {
  const fit = (SHARE_INNER_WIDTH - TOP_GAP * (TOP_COUNT - 1)) / TOP_COUNT;
  if (n >= TOP_COUNT) return Math.floor(fit * TOP_SCALE);
  return Math.floor(
    Math.min(TOP_MAX_WIDTH, (SHARE_INNER_WIDTH - TOP_GAP * (n - 1)) / n),
  );
}

/** 6위부터 목록이 쓸 수 있는 높이(TOP 카드 다섯 장 기준) */
export function restAreaHeight(): number {
  return (
    SHARE_SIZE -
    SHARE_PADDING * 2 -
    SHARE_HEADER_HEIGHT -
    SECTION_GAP -
    (SECTION_LABEL_HEIGHT + topCardWidth(TOP_COUNT) + TOP_TEXT_HEIGHT) -
    SECTION_GAP -
    SECTION_LABEL_HEIGHT -
    SHARE_FOOTER_HEIGHT
  );
}

/**
 * 곡이 적을 때의 크기. 표지는 글자 두 줄 높이보다 10% 작게(57) — 표지가 줄
 * 높이를 정하지 않아 같은 자리에 글자·간격이 더 크게 들어간다.
 */
const BASE = { coverPx: 45, titlePx: 24, subPx: 18, rowGapPx: 14 };

type Stage = Pick<RestLayout, "columns" | "showCover" | "showEnglish">;
/** 표지를 꼭 넣는 경우(성불 COVER_UNTIL곡 미만): 열을 늘리고, 3열부터 영어를 뺀다. */
const COVER_STAGES: Stage[] = [
  { columns: 2, showCover: true, showEnglish: true },
  { columns: 3, showCover: true, showEnglish: false },
  { columns: 4, showCover: true, showEnglish: false },
  { columns: 5, showCover: true, showEnglish: false },
];
/** 곡이 많을 때: 표지를 빼고 원어 + 한국어만, 열을 늘린다. */
const TEXT_STAGES: Stage[] = [
  { columns: 3, showCover: false, showEnglish: false },
  { columns: 4, showCover: false, showEnglish: false },
  { columns: 5, showCover: false, showEnglish: false },
];

/** 6위부터 한 칸 높이 — (표지가 있으면) 표지와 글자 줄 중 큰 쪽 + 줄 간격 */
export function restRowHeight(layout: Omit<RestLayout, "count">): number {
  const subLines = layout.showEnglish ? 2 : 1;
  const text =
    layout.titlePx * LINE_HEIGHT + subLines * layout.subPx * LINE_HEIGHT;
  return (
    (layout.showCover ? Math.max(layout.coverPx, text) : text) + layout.rowGapPx
  );
}

function fitStage(count: number, stage: Stage): RestLayout {
  const rows = Math.max(1, Math.ceil(count / stage.columns));
  const base = restRowHeight({ ...BASE, ...stage });
  const scale = Math.min(1, restAreaHeight() / (rows * base));
  // 소수 픽셀은 내림 — 반올림하면 계산보다 커져 마지막 줄이 넘칠 수 있다.
  return {
    count,
    ...stage,
    coverPx: Math.max(
      stage.showCover ? 1 : 0,
      Math.floor(BASE.coverPx * scale),
    ),
    titlePx: Math.floor(BASE.titlePx * scale),
    subPx: Math.floor(BASE.subPx * scale),
    rowGapPx: Math.floor(BASE.rowGapPx * scale),
  };
}

/**
 * 한 칸에서 원어 제목이 대략 몇 글자 보이는지 — 칸 폭에서 순위·표지·탤리·간격을
 * 빼고 제목 글자 크기로 나눈다(ShareImage의 RestList와 같은 값). 글자가 커도 열이
 * 많아 칸이 좁으면 제목이 몇 글자 만에 잘리므로, 단계 고르기에 함께 쓴다.
 */
export function visibleTitleChars(layout: RestLayout): number {
  const columnWidth =
    (SHARE_INNER_WIDTH - SHARE_COLUMN_GAP * (layout.columns - 1)) /
    layout.columns;
  const gap = Math.max(4, Math.round(layout.subPx * 0.5));
  const rank = Math.round(layout.subPx * 1.4);
  const tally = Math.round(layout.subPx * 0.95) * 1.6;
  const cover = layout.showCover ? layout.coverPx + gap : 0;
  const text = columnWidth - rank - gap - cover - gap - tally;
  return Math.max(0, text / layout.titlePx);
}

/**
 * 성불 곡 수에 맞춰 배치를 고른다(들은 곡은 전부 한 장에). TOP 5는 늘 카드.
 * 6위부터는 제목이 MIN_REST_TITLE_PX 이상인 단계 중 제목이 가장 많이 보이는
 * 단계(같으면 글자가 큰 쪽)를 쓴다 — 열을 늘려 글자만 키우면 칸이 좁아져 제목이
 * 잘리기 때문. 어느 단계도 그 크기가 안 되면 글자가 가장 큰 단계.
 */
export function pickShareLayout(heardCount: number): ShareLayout {
  const topCount = Math.min(TOP_COUNT, heardCount);
  const restCount = heardCount - topCount;
  if (restCount <= 0)
    return { topCount, topCardWidth: topCardWidth(topCount), rest: null };
  const stages = heardCount < COVER_UNTIL ? COVER_STAGES : TEXT_STAGES;
  const candidates = stages.map((stage) => fitStage(restCount, stage));
  const readable = candidates.filter(
    (layout) => layout.titlePx >= MIN_REST_TITLE_PX,
  );
  const score = (layout: RestLayout) =>
    Math.floor(visibleTitleChars(layout)) * 100 + layout.titlePx;
  const rest = readable.length
    ? readable.reduce((best, layout) =>
        score(layout) > score(best) ? layout : best,
      )
    : candidates.reduce((best, layout) =>
        layout.titlePx > best.titlePx ? layout : best,
      );
  return { topCount, topCardWidth: topCardWidth(TOP_COUNT), rest };
}

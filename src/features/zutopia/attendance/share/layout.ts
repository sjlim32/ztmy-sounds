/**
 * 참전 기록 이미지(정사각형, PC·모바일 같음)의 크기 계산. 배치는 1080×1080
 * 기준으로 하고, 저장할 때 SHARE_PIXEL_RATIO배(2160×2160)로 그린다.
 * ShareImage.tsx가 같은 상수로 그려서, 여기서 계산한 목록 높이가 실제 이미지와
 * 맞는다(layout.test.ts가 "몇 곡이든 캔버스 안에 들어간다"를 확인).
 */
export const SHARE_SIZE = 1080;
/** 저장 해상도 배율 — 1080 배치를 2160×2160 PNG로 */
export const SHARE_PIXEL_RATIO = 2;

/** 흰 테두리 안쪽 여백 */
export const SHARE_PADDING = 64;
/** 로고 + 제목 + 숫자 영역(아래 간격 포함) */
export const SHARE_HEADER_HEIGHT = 272;
/** 생성일 · 주소 · QR 줄(위 간격 포함) */
export const SHARE_FOOTER_HEIGHT = 96;
/**
 * QR 크기(1080 기준) — 33칸(오류 보정 L, 여백 포함) × 1.5 = 49.5. 저장 이미지(2160)에서
 * 칸 하나가 정확히 3px(반 픽셀에 걸려 흐려지지 않게)이라, 저장된 이미지를 사진 앱·
 * 구글 렌즈로 읽을 수 있는 가장 작은 크기.
 */
export const SHARE_QR_SIZE = 49.5;
export const SHARE_COLUMN_GAP = 32;

/** 줄 높이 배율 — ShareImage의 line-height와 같다. */
export const LINE_HEIGHT = 1.25;

/**
 * 1080px 이미지를 폰 화면 폭으로 볼 때 읽을 수 있는 원어 제목 크기. 이보다
 * 작아질 상황이면 다음 단계(열 늘리기·커버 빼기)로 넘어간다.
 */
export const READABLE_TITLE_PX = 24;

export interface ShareLayout {
  columns: number;
  showCover: boolean;
  /** false면 곡마다 일본어 + 한국어만(영어 줄을 뺀다) */
  showEnglish: boolean;
  coverPx: number;
  titlePx: number;
  subPx: number;
  rowGapPx: number;
}

/** 곡이 적을 때의 크기 — 넉넉하게(시안이 너무 작고 빽빽하다는 피드백). */
const BASE = { coverPx: 112, titlePx: 36, subPx: 26, rowGapPx: 22 };

/**
 * 곡이 많아질수록 차례로 넘어가는 단계. 2열 + 커버 → 3열 + 커버 → 커버 빼고
 * 3열 → 4열. 커버가 있는 단계는 커버가 줄 높이를 정해서, 영어 줄을 빼도
 * 줄어들지 않으므로 영어를 남긴다. 커버를 뺀 단계부터는 영어도 빼고
 * 일본어 + 한국어만 남긴다(어느 단계에서도 이 둘은 남긴다).
 */
const STAGES: Pick<ShareLayout, "columns" | "showCover" | "showEnglish">[] = [
  { columns: 2, showCover: true, showEnglish: true },
  { columns: 3, showCover: true, showEnglish: true },
  { columns: 3, showCover: false, showEnglish: false },
  { columns: 4, showCover: false, showEnglish: false },
];

export function listAreaHeight(): number {
  return (
    SHARE_SIZE - SHARE_PADDING * 2 - SHARE_HEADER_HEIGHT - SHARE_FOOTER_HEIGHT
  );
}

/** 곡 한 칸 높이 — (커버를 그리면) 커버와 제목 줄들 중 큰 쪽 + 줄 간격 */
export function rowHeight(layout: ShareLayout): number {
  const subLines = layout.showEnglish ? 2 : 1;
  const text =
    layout.titlePx * LINE_HEIGHT + subLines * layout.subPx * LINE_HEIGHT;
  return (
    (layout.showCover ? Math.max(layout.coverPx, text) : text) + layout.rowGapPx
  );
}

function fitStage(
  songCount: number,
  stage: (typeof STAGES)[number],
): ShareLayout {
  const rows = Math.max(1, Math.ceil(songCount / stage.columns));
  const base = rowHeight({ ...BASE, ...stage });
  const scale = Math.min(1, listAreaHeight() / (rows * base));
  // 소수 픽셀은 내림 — 반올림하면 계산보다 커져 마지막 줄이 넘칠 수 있다.
  return {
    ...stage,
    coverPx: Math.floor(BASE.coverPx * scale),
    titlePx: Math.floor(BASE.titlePx * scale),
    subPx: Math.floor(BASE.subPx * scale),
    rowGapPx: Math.floor(BASE.rowGapPx * scale),
  };
}

/**
 * 곡 수에 맞춰 단계와 크기를 고른다(들은 곡은 전부 한 장에). 단계를 차례로
 * 보며 원어 제목이 READABLE_TITLE_PX 이상이 되는 첫 단계를 쓰고, 어느 단계도
 * 안 되면 가장 글자가 큰 단계를 쓴다. maxColumns는 비교용(테스트).
 */
export function pickShareLayout(
  songCount: number,
  { maxColumns = 4 }: { maxColumns?: number } = {},
): ShareLayout {
  const candidates = STAGES.filter((stage) => stage.columns <= maxColumns).map(
    (stage) => fitStage(songCount, stage),
  );
  return (
    candidates.find((layout) => layout.titlePx >= READABLE_TITLE_PX) ??
    candidates.reduce((best, layout) =>
      layout.titlePx > best.titlePx ? layout : best,
    )
  );
}

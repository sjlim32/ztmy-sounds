import type {
  TimelineEvent,
  TimelineKind,
} from "@/features/zutopia/timeline/events";
import { formatDotDate } from "@/lib/ymd";

export const KIND_ORDER: readonly TimelineKind[] = ["song", "album", "live"];

export const KIND_LABEL: Record<TimelineKind, string> = {
  song: "곡 발매",
  album: "앨범 발매",
  live: "공연",
};

/**
 * 축 위 표시 점 — 곡 하늘 동그라미, 앨범 해 네모, 공연 보라 네모. 모양도 달리 해
 * 색만으로 구분하지 않게. 배경색 테두리로 축 선 위에 또렷하게.
 */
export const KIND_DOT_CLASS: Record<TimelineKind, string> = {
  song: "bg-ztmy-sky rounded-full",
  album: "bg-ztmy-sun rounded-[3px]",
  live: "bg-ztmy-purple rounded-[3px]",
};

/**
 * 카드 면 — 테두리 없이 배경색에 종류 색을 섞은 불투명 면으로만 구분한다(곡은
 * 옅은 흰빛, 앨범은 해 색, 공연은 보라). 불투명이라 뒤의 연결선이 비치지 않는다.
 */
export const KIND_CARD_CLASS: Record<TimelineKind, string> = {
  song: "bg-[color-mix(in_oklab,white_9%,var(--color-background))]",
  album:
    "bg-[color-mix(in_oklab,var(--color-ztmy-sun)_16%,var(--color-background))]",
  live: "bg-[color-mix(in_oklab,var(--color-ztmy-purple)_30%,var(--color-background))]",
};

/** 내 참전(참전 기록에서 체크한 공연) 표시 — 마젠타 테두리 하나만(글자·색 변화 없음). */
export const ATTENDED_CLASS = "ring-2 ring-ztmy-magenta";

/** "2026.02.28 – 06.18"(같은 해면 끝날의 연도 생략). */
export function eventDateText(event: TimelineEvent): string {
  if (!event.endDate) return formatDotDate(event.date);
  const end = formatDotDate(event.endDate);
  return `${formatDotDate(event.date)} – ${
    event.endDate.slice(0, 4) === event.date.slice(0, 4) ? end.slice(5) : end
  }`;
}

/** 카드에 덧붙이는 정보 — 예정, 앨범 신곡 수, 여러 날 공연의 공연 횟수. */
export function eventExtras(event: TimelineEvent): string[] {
  const extras: string[] = [];
  if (event.upcoming) extras.push("예정");
  if (event.newSongCount > 0) extras.push(`신곡 ${event.newSongCount}곡`);
  if (event.kind === "live" && event.unitIds.length > 1)
    extras.push(`${event.unitIds.length}회`);
  return extras;
}

export function eventTitle(event: TimelineEvent) {
  return [
    event.tag,
    event.label,
    event.subLabel,
    eventDateText(event),
    ...eventExtras(event),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 예정 일정 카드 — 흐리게(아직 오지 않은 일). */
export const UPCOMING_CLASS = "opacity-75";

/** 카드 맨 위 분류 줄 색 — 곡("협업")은 흰색 60%, 앨범("정규 4집")은 해 색, 공연(단콘·페스티벌·이벤트)은 분홍. */
export const TAG_TEXT_CLASS: Record<TimelineKind, string> = {
  song: "text-white/60",
  album: "text-ztmy-sun",
  live: "text-ztmy-pink",
};

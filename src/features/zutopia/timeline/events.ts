import { dayNumber } from "@/lib/ymd";
import type { LiveUnit } from "@/features/zutopia/live-history/types";

export type TimelineKind = "song" | "album" | "live";

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  /** YYYY-MM-DD */
  date: string;
  /** 기간 일정(투어·여러 날 공연)의 마지막 날. 하루 일정은 null. */
  endDate: string | null;
  /** 주 표기 — 곡·앨범은 한국어 제목(없으면 원어), 공연은 한국어 공연명. */
  label: string;
  /** 병기 — 곡·앨범의 원어(일본어) 제목. 주 표기와 같으면 null. */
  subLabel: string | null;
  href: string | null;
  /** 공연이면 소속 공연일 ID(참전 기록 체크와 맞춰 보기). */
  unitIds: string[];
  /** 앨범이면 같은 날 함께 나온 수록곡 수(따로 곡 일정을 만들지 않고 합친 수). */
  newSongCount: number;
  /** 카드 그림 — 곡·앨범 커버, 공연(투어) 대표 그림. */
  imageUrl: string | null;
  /** 앨범 구분 표기("정규 4집"). 그 밖엔 null. */
  tag: string | null;
  /** 아직 오지 않은 일정(예정 공연·발매 예정). 흐리게 + "예정". */
  upcoming: boolean;
}

export interface TimelineSongInput {
  id: string;
  slug: string;
  title: string;
  titleKo: string | null;
  releaseDate: string;
  unreleased: boolean;
  /** 이 곡이 실린 앨범 ID. */
  albumIds: string[];
  coverSrc: string | null;
}

export interface TimelineAlbumInput {
  id: string;
  slug: string;
  title: string;
  titleKo: string | null;
  releaseDate: string;
  coverSrc: string | null;
  /** "정규 4집" */
  typeLabel: string;
}

/** 한국어 제목을 앞에, 원어를 병기로. 한국어가 없거나 같으면 원어만. */
function koreanFirst(title: string, titleKo: string | null) {
  return titleKo && titleKo !== title
    ? { label: titleKo, subLabel: title }
    : { label: title, subLabel: null };
}

/** 같은 날엔 앨범 → 곡 → 공연 순(앨범과 수록 싱글 동시 발매가 흔하다). */
const KIND_ORDER: Record<TimelineKind, number> = { album: 0, song: 1, live: 2 };

/**
 * 활동 연혁 일정 — 곡 발매(미공개곡 제외), 앨범 발매, 공연. 앨범과 같은 날
 * 나온 수록곡은 따로 두지 않고 앨범 일정 하나로 합친다(한 날에 열 줄씩 쌓이지
 * 않게 — 수록곡은 앨범 상세에서 본다). 공연은 투어당
 * 하나(첫 공연일~마지막 공연일 기간), 투어 아닌 공연은 공연당 하나(여러 날이면
 * 기간). 날짜순.
 */
export function buildTimelineEvents(input: {
  songs: TimelineSongInput[];
  albums: TimelineAlbumInput[];
  /** 지난 공연일(참전 체크 대상). */
  units: LiveUnit[];
  /** 예정 공연일 — 투어가 진행 중이면 지난 공연일과 한 일정으로 합친다. */
  upcomingUnits?: LiveUnit[];
  /** 이 날 뒤의 발매일은 "예정". 없으면 예정 표시 안 함. */
  today?: string;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const isFuture = (date: string) => !!input.today && date > input.today;
  const albumDates = new Map(
    input.albums.map((album) => [album.id, album.releaseDate.slice(0, 10)]),
  );
  const folded = new Map<string, number>();

  for (const song of input.songs) {
    if (song.unreleased) continue;
    const date = song.releaseDate.slice(0, 10);
    const album = song.albumIds.find((id) => albumDates.get(id) === date);
    if (album) {
      folded.set(album, (folded.get(album) ?? 0) + 1);
      continue;
    }
    events.push({
      id: `song:${song.id}`,
      kind: "song",
      date,
      endDate: null,
      ...koreanFirst(song.title, song.titleKo),
      href: `/zutopia/songs?song=${song.slug}`,
      unitIds: [],
      newSongCount: 0,
      imageUrl: song.coverSrc,
      tag: null,
      upcoming: isFuture(date),
    });
  }

  for (const album of input.albums) {
    events.push({
      id: `album:${album.id}`,
      kind: "album",
      date: album.releaseDate.slice(0, 10),
      endDate: null,
      ...koreanFirst(album.title, album.titleKo),
      href: `/zutopia/albums?album=${album.slug}`,
      unitIds: [],
      newSongCount: folded.get(album.id) ?? 0,
      imageUrl: album.coverSrc,
      tag: album.typeLabel,
      upcoming: isFuture(album.releaseDate.slice(0, 10)),
    });
  }

  const lives = new Map<string, { past: LiveUnit[]; all: LiveUnit[] }>();
  const addUnit = (unit: LiveUnit, past: boolean) => {
    const key = unit.tourId ?? unit.liveId;
    const entry = lives.get(key) ?? { past: [], all: [] };
    entry.all.push(unit);
    if (past) entry.past.push(unit);
    lives.set(key, entry);
  };
  for (const unit of input.units) addUnit(unit, true);
  for (const unit of input.upcomingUnits ?? []) addUnit(unit, false);
  for (const [key, { past, all }] of lives) {
    const dates = all.map((unit) => unit.date).sort();
    const first = dates[0];
    const last = dates[dates.length - 1];
    events.push({
      id: `live:${key}`,
      kind: "live",
      date: first,
      endDate: last === first ? null : last,
      label: all[0].titleKo ?? all[0].title,
      subLabel: null,
      href: all[0].href,
      unitIds: past.map((unit) => unit.id),
      newSongCount: 0,
      imageUrl: all[0].groupImageUrl,
      tag: null,
      upcoming: past.length === 0,
    });
  }

  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
  );
}

/**
 * 날짜 → 축 위 위치(px) = (날짜 − 시작일) × 배율. 위치는 전부 이 함수로만
 * 계산한다 — 나중에 확대/축소를 넣으면 pxPerDay만 바꾸면 된다.
 */
export function dateToOffset(
  date: string,
  start: string,
  pxPerDay: number,
): number {
  return (dayNumber(date) - dayNumber(start)) * pxPerDay;
}

/**
 * 겹치지 않게 줄 나누기 — 날짜순으로 보며 비어 있는 가장 위 줄에 넣는다. 한
 * 일정은 시작일부터 max(끝날, 시작일 + minGapDays)까지 그 줄을 차지한다
 * (minGapDays = 라벨이 차지하는 폭을 날짜로 환산한 값). id → 줄 번호(0부터).
 */
export function assignLanes(
  events: TimelineEvent[],
  minGapDays: number,
): Map<string, number> {
  const lanes = new Map<string, number>();
  const busyUntil: number[] = [];
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  for (const event of sorted) {
    const start = dayNumber(event.date);
    const end = Math.max(
      event.endDate ? dayNumber(event.endDate) : start,
      start + minGapDays,
    );
    let lane = busyUntil.findIndex((until) => until < start);
    if (lane === -1) lane = busyUntil.length;
    busyUntil[lane] = end;
    lanes.set(event.id, lane);
  }
  return lanes;
}

/**
 * 축 범위 — 첫 일정이 있는 해의 1월 1일부터 마지막 일정(기간이면 끝날)의 다음
 * 해 1월 1일까지, 그 사이 해 목록(연도 눈금용). 일정이 없으면 null.
 */
export function timelineRange(
  events: TimelineEvent[],
): { start: string; end: string; years: string[] } | null {
  if (events.length === 0) return null;
  let first = events[0].date;
  let last = events[0].endDate ?? events[0].date;
  for (const event of events) {
    if (event.date < first) first = event.date;
    const end = event.endDate ?? event.date;
    if (end > last) last = end;
  }
  const firstYear = Number(first.slice(0, 4));
  const lastYear = Number(last.slice(0, 4));
  const years: string[] = [];
  for (let year = firstYear; year <= lastYear; year++) years.push(String(year));
  return {
    start: `${firstYear}-01-01`,
    end: `${lastYear + 1}-01-01`,
    years,
  };
}

/** 해마다 종류별 일정 수(시작일의 해 기준) — 모바일 해 머리 표기용. */
export function countByYear(
  events: TimelineEvent[],
): Record<string, Record<TimelineKind, number>> {
  const result: Record<string, Record<TimelineKind, number>> = {};
  for (const event of events) {
    const year = event.date.slice(0, 4);
    result[year] ??= { song: 0, album: 0, live: 0 };
    result[year][event.kind] += 1;
  }
  return result;
}

/** 가장 늦은 일정 날짜(기간이면 끝날) — 연혁을 처음 열 때 이 날이 보이게. */
export function latestDate(events: TimelineEvent[]): string | null {
  let latest: string | null = null;
  for (const event of events) {
    const end = event.endDate ?? event.date;
    if (!latest || end > latest) latest = end;
  }
  return latest;
}

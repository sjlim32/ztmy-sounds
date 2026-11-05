import { extractKoreanCity } from "@/features/zutopia/lives/region";
import type {
  LiveUnit,
  RawLive,
  RawSetlistRow,
  RawTour,
  SongLiveStat,
} from "./types";

/** "YYYY-MM-DD"에 n일을 더한다 — UTC로 계산해 시간대 영향이 없다. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function daysInclusive(start: string, end: string): number {
  const toUtc = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000) + 1;
}

/**
 * lives 행을 공연 단위(하루하루의 공연)로 나눈다. 규칙은 설계 문서
 * (docs/superpowers/specs/2026-11-05-zutopia-live-checklist-timeline-design.md
 * "나누는 규칙")를 따른다.
 * - FESTIVAL: 행 하나 = 단위 하나, 날짜는 즛토마요 출연일(live_date, 없으면 start_date).
 * - CONCERT/EVENT: start_date~end_date 하루마다 단위 하나. DAY N의 곡 =
 *   (투어 공통 곡) + 이 행의 day_number 없는 곡 + day_number = N인 곡.
 *   day_number 없이 이틀짜리로 등록된 행은 양일 같은 세트리스트로 본다.
 * - 투어 소속: tour_id 일치 또는 slug가 투어 slug와 같은 행(lives/data.ts의
 *   tourDateFilter와 같은 기준). 제목·링크는 투어 것을 쓴다.
 * - 곡 id는 어레인지 버전이면 원곡 id로 바꾸고, 같은 날 같은 곡은 한 번만 센다.
 * - today보다 뒤의 단위는 뺀다.
 */
export function buildLiveUnits(
  input: {
    lives: RawLive[];
    tours: RawTour[];
    setlists: RawSetlistRow[];
    originalOf: Record<string, string>;
  },
  today: string,
): LiveUnit[] {
  const { lives, tours, setlists, originalOf } = input;
  const toursById = new Map(tours.map((tour) => [tour.id, tour]));
  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  const tourRows = new Map<string, RawSetlistRow[]>();
  const liveRows = new Map<string, RawSetlistRow[]>();
  for (const row of setlists) {
    if (row.live_id) push(liveRows, row.live_id, row);
    else if (row.tour_id) push(tourRows, row.tour_id, row);
  }

  const units: LiveUnit[] = [];
  for (const live of lives) {
    const tour =
      (live.tour_id ? toursById.get(live.tour_id) : undefined) ??
      (live.slug ? toursBySlug.get(live.slug) : undefined) ??
      null;
    const common = tour ? (tourRows.get(tour.id) ?? []) : [];
    const own = liveRows.get(live.id) ?? [];
    const slug = tour?.slug ?? live.slug;

    const base = {
      liveId: live.id,
      type: live.type,
      title: tour?.title ?? live.title,
      titleKo: tour?.title_ko ?? live.title_ko,
      city: extractKoreanCity(live.region),
      tourId: tour?.id ?? null,
      href: slug ? `/zutopia/lives/${slug}` : null,
    };
    const songsFor = (day: number | null) =>
      uniqueSongIds(
        [
          ...common,
          ...own.filter(
            (row) => row.day_number == null || row.day_number === day,
          ),
        ],
        originalOf,
      );

    if (live.type === "FESTIVAL") {
      const date = (live.live_date ?? live.start_date).slice(0, 10);
      units.push({
        ...base,
        id: `${live.id}:${date}`,
        date,
        dayNumber: null,
        songIds: songsFor(null),
      });
      continue;
    }

    const start = live.start_date.slice(0, 10);
    const end = (live.end_date ?? live.start_date).slice(0, 10);
    const days = Math.max(1, daysInclusive(start, end));
    for (let n = 1; n <= days; n++) {
      const date = addDays(start, n - 1);
      units.push({
        ...base,
        id: `${live.id}:${date}`,
        date,
        dayNumber: days > 1 ? n : null,
        songIds: songsFor(days > 1 ? n : null),
      });
    }
  }

  return units
    .filter((unit) => unit.date <= today)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (a.dayNumber ?? 0) - (b.dayNumber ?? 0),
    );
}

/** 곡별 라이브 횟수와 가장 최근 단위. units는 buildLiveUnits 결과(최신 먼저). */
export function buildSongLiveStats(
  units: LiveUnit[],
): Record<string, SongLiveStat> {
  const stats: Record<string, SongLiveStat> = {};
  for (const unit of units) {
    for (const songId of unit.songIds) {
      const stat = stats[songId];
      if (stat) stat.count += 1;
      else stats[songId] = { count: 1, lastUnitId: unit.id };
    }
  }
  return stats;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function uniqueSongIds(
  rows: RawSetlistRow[],
  originalOf: Record<string, string>,
): string[] {
  return [
    ...new Set(rows.map((row) => originalOf[row.song_id] ?? row.song_id)),
  ];
}

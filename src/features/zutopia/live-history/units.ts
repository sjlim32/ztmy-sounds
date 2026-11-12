import { addDays, diffDays } from "@/lib/ymd";
import {
  extractKoreanCity,
  isOnlineText,
} from "@/features/zutopia/lives/region";
import { showsForDay } from "@/features/zutopia/lives/shows";
import type {
  LiveUnit,
  RawLive,
  RawSetlistRow,
  RawTour,
  SongLiveStat,
  StatOnlyUnitField,
} from "./types";

export { addDays };

function daysInclusive(start: string, end: string): number {
  return diffDays(start, end) + 1;
}

function buildAllUnits(input: {
  lives: RawLive[];
  tours: RawTour[];
  setlists: RawSetlistRow[];
  originalOf: Record<string, string>;
}): LiveUnit[] {
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
      imageUrl:
        live.icon_image_url ??
        live.poster_image_url ??
        tour?.poster_image_url ??
        null,
      // 온라인 공연(region·live_venue가 "online") — 참전 기록·통계에선 뺀다(inPersonUnits).
      ...((isOnlineText(live.region) || isOnlineText(live.live_venue)) && {
        online: true,
      }),
      groupImageUrl: tour
        ? (tour.poster_image_url ??
          live.icon_image_url ??
          live.poster_image_url ??
          null)
        : (live.icon_image_url ?? live.poster_image_url ?? null),
    };
    // day = null(하루 공연)이면 DAY 번호가 붙은 자기 행도 전부 센다. 회차(show)도
    // 같은 규칙 — show_number가 빈 행은 그날 모든 회차에 부른 곡.
    const rowsFor = (day: number | null, show: number | null) => [
      ...common,
      ...own.filter(
        (row) =>
          (day === null || row.day_number == null || row.day_number === day) &&
          (show === null ||
            row.show_number == null ||
            row.show_number === show),
      ),
    ];
    const unitFields = (day: number | null, show: number | null) => {
      const rows = rowsFor(day, show);
      return {
        songIds: uniqueSongIds(rows, originalOf),
        ...setlistDetails(rows, originalOf),
        ...(live.live_venue !== undefined && { venue: live.live_venue }),
        ...(live.country !== undefined && { country: live.country }),
      };
    };

    // 하루 회차(metadata.shows · 그날 세트리스트의 show_number 중 큰 쪽, 2회 이상일
    // 때만) — 날마다 회차 수만큼 단위를 만든다. 첫 회차 id는 예전과 같은
    // "공연id:날짜"라 이미 저장된 체크가 그대로 첫 회차가 된다.
    const pushDay = (date: string, dayNumber: number | null) => {
      const shows = showsForDay(
        live.metadata,
        dayNumber ?? 1,
        own
          .filter(
            (row) =>
              dayNumber === null ||
              row.day_number == null ||
              row.day_number === dayNumber,
          )
          .map((row) => row.show_number),
      );
      if (shows.length === 0) {
        units.push({
          ...base,
          id: `${live.id}:${date}`,
          date,
          dayNumber,
          ...unitFields(dayNumber, null),
        });
        return;
      }
      shows.forEach(({ show, label }) => {
        units.push({
          ...base,
          id: show === 1 ? `${live.id}:${date}` : `${live.id}:${date}:${show}`,
          date,
          dayNumber,
          showNumber: show,
          showLabel: label,
          ...unitFields(dayNumber, show),
        });
      });
    };

    // 페스티벌, 그리고 live_date(즛토마요가 실제로 선 날)가 있는 공연은 그날 하루.
    if (live.type === "FESTIVAL" || live.live_date) {
      pushDay((live.live_date ?? live.start_date).slice(0, 10), null);
      continue;
    }

    const start = live.start_date.slice(0, 10);
    const end = (live.end_date ?? live.start_date).slice(0, 10);
    const days = Math.max(1, daysInclusive(start, end));
    for (let n = 1; n <= days; n++)
      pushDay(addDays(start, n - 1), days > 1 ? n : null);
  }

  return units;
}

type BuildInput = Parameters<typeof buildAllUnits>[0];

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
 * - today보다 뒤의 단위는 뺀다(예정 공연일은 buildUpcomingUnits).
 */
export function buildLiveUnits(input: BuildInput, today: string): LiveUnit[] {
  return buildAllUnits(input)
    .filter((unit) => unit.date <= today)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.dayNumber ?? 0) - (b.dayNumber ?? 0) ||
        (a.showNumber ?? 0) - (b.showNumber ?? 0),
    );
}

/**
 * 예정 공연일 — today보다 뒤의 단위만, 날짜 오름차순(가까운 것부터). 나누는
 * 규칙은 buildLiveUnits와 같다(활동 연혁의 "예정" 표시용, 집계엔 안 쓴다).
 */
export function buildUpcomingUnits(
  input: BuildInput,
  today: string,
): LiveUnit[] {
  return buildAllUnits(input)
    .filter((unit) => unit.date > today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.dayNumber ?? 0) - (b.dayNumber ?? 0) ||
        (a.showNumber ?? 0) - (b.showNumber ?? 0),
    );
}

/** 곡별 라이브 횟수와 가장 최근·가장 처음 단위. units는 buildLiveUnits 결과(최신 먼저). */
export function buildSongLiveStats(
  units: LiveUnit[],
): Record<string, SongLiveStat> {
  const stats: Record<string, SongLiveStat> = {};
  for (const unit of units) {
    for (const songId of unit.songIds) {
      const stat = stats[songId];
      // units가 최신 먼저라, 처음 만난 단위가 마지막 라이브이고 계속 덮어쓰면
      // 남는 단위가 첫 라이브다.
      if (stat) {
        stat.count += 1;
        stat.firstUnitId = unit.id;
      } else {
        stats[songId] = { count: 1, lastUnitId: unit.id, firstUnitId: unit.id };
      }
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

/**
 * 오프닝·앵콜 곡(통계용) — track_number·is_encore가 있는 행에서만. 첫 곡은 앵콜이
 * 아닌 곡 중 순서가 가장 앞선 곡(같으면 투어 공통 행이 먼저). 둘 다 없으면 빈 값.
 */
function setlistDetails(
  rows: RawSetlistRow[],
  originalOf: Record<string, string>,
): Pick<LiveUnit, "openingSongId" | "encoreSongIds"> {
  if (!rows.some((row) => row.track_number !== undefined)) return {};
  const original = (row: RawSetlistRow) =>
    originalOf[row.song_id] ?? row.song_id;
  let opening: RawSetlistRow | null = null;
  for (const row of rows) {
    if (row.is_encore || row.track_number === undefined) continue;
    if (!opening || row.track_number < opening.track_number!) opening = row;
  }
  return {
    openingSongId: opening ? original(opening) : null,
    encoreSongIds: [
      ...new Set(rows.filter((row) => row.is_encore).map(original)),
    ],
  };
}

/**
 * 클라이언트 컴포넌트(참전 기록 등)로 넘길 공연일 — 통계 전용 필드(장소·나라·첫 곡·
 * 앵콜)를 빼서 페이지 데이터를 줄인다.
 */
export function toClientUnit(
  unit: LiveUnit,
): Omit<LiveUnit, StatOnlyUnitField> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 빼려고 꺼낸다
  const { venue, country, openingSongId, encoreSongIds, ...rest } = unit;
  return rest;
}

/**
 * 현장 공연만 — 온라인 공연(unit.online)을 뺀다. 참전 기록(체크할 공연)과 통계가
 * 쓴다. 곡별 라이브 횟수·마지막 라이브·활동 연혁은 온라인 공연도 센다.
 */
export function inPersonUnits<T extends Pick<LiveUnit, "online">>(
  units: T[],
): T[] {
  return units.filter((unit) => !unit.online);
}

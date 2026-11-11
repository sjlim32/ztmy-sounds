import { diffDays, formatDotDate } from "@/lib/ymd";
import { splitParenSuffix } from "@/features/zutopia/lives/LiveTicket";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import type {
  StatAlbum,
  StatRecord,
  StatRow,
  StatSection,
  StatSong,
  StatTour,
} from "./types";

/**
 * 통계 페이지 기록 계산(순수 함수 — 빌드 때 한 번, 테스트 대상).
 *
 * 세는 기준:
 * - 공연일(LiveUnit) 하나 = 1회. 투어 각 회차·이틀 공연의 각 날을 따로 센다.
 * - 세트리스트가 아직 없는 공연일(songIds가 빈 날)은 곡·공연 기록(횟수·참가율·
 *   연속·첫 곡 등)에서 뺀다 — "안 불렀다"로 세면 기록이 틀어진다. 공연 횟수·
 *   장소·공백 같은 기록엔 넣는다.
 * - 참가율 = 발매일 이후(당일 포함) 세트리스트가 있는 공연일 중 그 곡을 부른 비율.
 *   발매 전에 먼저 부른 날은 횟수엔 넣고 참가율에선 뺀다(100%를 넘지 않게).
 * - 온라인 공연은 도시·공연장·해외 기록에서 뺀다.
 */
export function buildStatSections(input: {
  /** 지난 공연일(buildLiveUnits 결과, 순서 무관) */
  units: LiveUnit[];
  /** 예정 공연일 — 투어 공연 수에만 쓴다 */
  upcoming: LiveUnit[];
  songs: StatSong[];
  albums: StatAlbum[];
  tours: StatTour[];
}): StatSection[] {
  const all = [...input.units].sort(byDate);
  const known = all.filter((unit) => unit.songIds.length > 0);
  const songStats = buildSongStats(input.songs, known);

  return [
    {
      id: "songs",
      title: "곡",
      records: songRecords(songStats, known),
    },
    {
      id: "albums",
      title: "앨범",
      records: albumRecords(input.albums, songStats),
    },
    {
      id: "lives",
      title: "공연",
      records: liveRecords(all, known, songStats, input),
    },
    {
      id: "places",
      title: "장소",
      records: placeRecords(all),
    },
  ];
}

const byDate = (a: LiveUnit, b: LiveUnit) =>
  a.date.localeCompare(b.date) || (a.dayNumber ?? 0) - (b.dayNumber ?? 0);

// ─── 공통 ──────────────────────────────────────────────────────────────

/**
 * 점수로 정렬하고 순위를 매긴다 — 점수가 같으면 같은 순위(공동). tie는 점수가
 * 같을 때 줄 순서만 정한다(순위엔 영향 없음).
 */
function rank<T>(
  items: T[],
  score: (item: T) => number,
  order: "desc" | "asc",
  toRow: (item: T) => Omit<StatRow, "rank">,
  tie?: (a: T, b: T) => number,
): StatRow[] {
  const sign = order === "desc" ? -1 : 1;
  const sorted = [...items].sort(
    (a, b) => sign * (score(a) - score(b)) || (tie ? tie(a, b) : 0),
  );
  let previous: number | null = null;
  let current = 0;
  return sorted.map((item, index) => {
    const value = score(item);
    if (value !== previous) current = index + 1;
    previous = value;
    return { ...toRow(item), rank: current };
  });
}

const percent = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";

const times = (n: number) => `${n.toLocaleString("ko-KR")}회`;

/** 1,234일 · 365일 이상이면 "약 3.4년"을 덧붙일 설명. */
const days = (n: number) => `${n.toLocaleString("ko-KR")}일`;
const aboutYears = (n: number) =>
  n >= 365 ? `약 ${(n / 365).toFixed(1)}년` : null;

function unitName(unit: LiveUnit) {
  return unit.titleKo ?? unit.title;
}

function unitSub(unit: LiveUnit) {
  return [
    formatDotDate(unit.date),
    [unit.city, unit.dayNumber ? `DAY ${unit.dayNumber}` : null]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(" · ");
}

function unitRow(unit: LiveUnit, cells: string[], note?: string | null) {
  return {
    key: unit.id,
    name: unitName(unit),
    sub: unitSub(unit),
    image: unit.imageUrl ?? unit.groupImageUrl,
    href: unit.href,
    cells,
    note: note ?? null,
  };
}

function isOnline(unit: LiveUnit) {
  return (
    unit.city.toLowerCase() === "online" ||
    unit.venue?.toLowerCase() === "online"
  );
}

// ─── 곡 ────────────────────────────────────────────────────────────────

interface SongStat {
  song: StatSong;
  /** 부른 공연일(날짜 순) */
  played: LiveUnit[];
  /** 발매 후 세트리스트가 있는 공연일 수 */
  eligible: number;
  /** 발매 후 부른 횟수 */
  playedSinceRelease: number;
}

function buildSongStats(songs: StatSong[], known: LiveUnit[]): SongStat[] {
  const songSets = new Map(
    known.map((unit) => [unit.id, new Set(unit.songIds)]),
  );
  return songs.map((song) => {
    const played = known.filter((unit) => songSets.get(unit.id)!.has(song.id));
    return {
      song,
      played,
      eligible: known.filter((unit) => unit.date >= song.releaseDate).length,
      playedSinceRelease: played.filter((unit) => unit.date >= song.releaseDate)
        .length,
    };
  });
}

function songRow(song: StatSong, cells: string[], note?: string | null) {
  return {
    key: song.id,
    // 통계는 한글 제목 위주 — 원제는 아래 작은 줄에.
    name: song.titleKo || song.title,
    sub: song.titleKo && song.titleKo !== song.title ? song.title : null,
    image: song.cover,
    href: `/zutopia/songs?song=${song.slug}`,
    cells,
    note: note ?? null,
  };
}

const byRelease = (a: SongStat, b: SongStat) =>
  a.song.releaseDate.localeCompare(b.song.releaseDate);

function songRecords(stats: SongStat[], known: LiveUnit[]): StatRecord[] {
  const rate = (stat: SongStat) =>
    stat.eligible > 0 ? stat.playedSinceRelease / stat.eligible : 0;
  const playCells = (stat: SongStat) => [
    times(stat.played.length),
    percent(stat.playedSinceRelease, stat.eligible),
    stat.played[0] ? formatDotDate(stat.played[0].date) : "–",
    stat.played.at(-1) ? formatDotDate(stat.played.at(-1)!.date) : "–",
  ];
  const playNote = (stat: SongStat) =>
    `발매 후 공연 ${stat.eligible}회 중 ${stat.playedSinceRelease}회 · 참가율 ${percent(stat.playedSinceRelease, stat.eligible)}`;
  const playColumns = ["횟수", "참가율", "첫 라이브", "마지막 라이브"];

  const MIN_ELIGIBLE = 10;
  const played = stats.filter((stat) => stat.played.length > 0);

  // 오랜 공백 끝 부활 — 연이은 두 라이브 사이가 가장 길었던 때.
  const comebacks = played.flatMap((stat) => {
    let best: { from: LiveUnit; to: LiveUnit; gap: number } | null = null;
    for (let i = 1; i < stat.played.length; i++) {
      const gap = diffDays(stat.played[i - 1].date, stat.played[i].date);
      if (!best || gap > best.gap)
        best = { from: stat.played[i - 1], to: stat.played[i], gap };
    }
    return best ? [{ stat, ...best }] : [];
  });

  // 연속 공연일 — 세트리스트가 있는 공연일을 날짜 순으로 이어 볼 때 연달아 부른 최대 횟수.
  const streaks = played.map((stat) => {
    const set = new Set(stat.played.map((unit) => unit.id));
    let best = { length: 0, from: known[0], to: known[0] };
    let length = 0;
    let from = known[0];
    for (const unit of known) {
      if (set.has(unit.id)) {
        if (length === 0) from = unit;
        length += 1;
        if (length > best.length) best = { length, from, to: unit };
      } else length = 0;
    }
    return { stat, ...best };
  });

  // 라이브 데뷔 — 발매일부터 첫 라이브까지(음수면 발매 전 선공개).
  const debuts = played.map((stat) => ({
    stat,
    first: stat.played[0],
    gap: diffDays(stat.song.releaseDate, stat.played[0].date),
  }));
  const debutText = (gap: number) =>
    gap < 0
      ? `발매 ${days(-gap)} 전`
      : gap === 0
        ? "발매 당일"
        : `${days(gap)} 만`;
  const debutCells = (debut: (typeof debuts)[number]) => [
    debutText(debut.gap),
    formatDotDate(debut.stat.song.releaseDate),
    `${formatDotDate(debut.first.date)} ${unitName(debut.first)}`,
  ];

  const withOpening = known.filter((unit) => unit.openingSongId);
  const withEncore = known.filter((unit) => unit.encoreSongIds?.length);
  const openings = played
    .map((stat) => ({
      stat,
      count: withOpening.filter((unit) => unit.openingSongId === stat.song.id)
        .length,
    }))
    .filter((item) => item.count > 0);
  const encores = played
    .map((stat) => ({
      stat,
      count: withEncore.filter((unit) =>
        unit.encoreSongIds!.includes(stat.song.id),
      ).length,
    }))
    .filter((item) => item.count > 0);

  return [
    {
      id: "song-most-played",
      title: "라이브에서 가장 많이 불린 곡",
      description:
        "공연일 기준 횟수. 참가율은 발매 후 세트리스트가 있는 공연일 중 부른 비율",
      columns: playColumns,
      rows: rank(
        played,
        (stat) => stat.played.length,
        "desc",
        (stat) => songRow(stat.song, playCells(stat), playNote(stat)),
        (a, b) => rate(b) - rate(a),
      ),
    },
    {
      id: "song-highest-rate",
      title: "참가율이 가장 높은 곡",
      description: `발매 후 공연일 중 부른 비율(발매 후 공연 ${MIN_ELIGIBLE}회 이상인 곡만)`,
      columns: ["참가율", "횟수", "첫 라이브", "마지막 라이브"],
      rows: rank(
        stats.filter((stat) => stat.eligible >= MIN_ELIGIBLE),
        (stat) => Math.round(rate(stat) * 1000),
        "desc",
        (stat) => {
          const [count, pct, first, last] = playCells(stat);
          return songRow(stat.song, [pct, count, first, last], playNote(stat));
        },
        (a, b) => b.played.length - a.played.length,
      ),
    },
    {
      id: "song-least-played",
      title: "라이브에서 가장 적게 불린 곡",
      description:
        "발매 후 공연이 있었던 곡 중 횟수가 적은 순(같으면 기다린 공연이 많은 곡 먼저)",
      columns: ["횟수", "발매 후 공연", "참가율", "마지막 라이브"],
      rows: rank(
        stats.filter((stat) => stat.eligible > 0),
        (stat) => stat.played.length,
        "asc",
        (stat) =>
          songRow(
            stat.song,
            [
              times(stat.played.length),
              times(stat.eligible),
              percent(stat.playedSinceRelease, stat.eligible),
              stat.played.at(-1)
                ? formatDotDate(stat.played.at(-1)!.date)
                : "없음",
            ],
            stat.played.length === 0
              ? `발매 후 공연 ${stat.eligible}회 동안 한 번도 안 불림`
              : playNote(stat),
          ),
        (a, b) => b.eligible - a.eligible,
      ),
    },
    {
      id: "song-comeback",
      title: "가장 오랜 공백 끝에 돌아온 곡",
      description: "연이은 두 라이브 사이 간격이 가장 길었던 때",
      columns: ["공백", "이전 라이브", "돌아온 공연"],
      rows: rank(
        comebacks,
        (item) => item.gap,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              days(item.gap),
              formatDotDate(item.from.date),
              `${formatDotDate(item.to.date)} ${unitName(item.to)}`,
            ],
            [
              aboutYears(item.gap),
              `${formatDotDate(item.from.date)} → ${formatDotDate(item.to.date)}`,
            ]
              .filter(Boolean)
              .join(" · "),
          ),
      ),
    },
    {
      id: "song-streak",
      title: "가장 오래 연속으로 불린 곡",
      description:
        "세트리스트가 있는 공연일을 날짜 순으로 볼 때 빠짐없이 부른 최대 횟수",
      columns: ["연속", "시작", "끝"],
      rows: rank(
        streaks,
        (item) => item.length,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [
              `${item.length}회 연속`,
              formatDotDate(item.from.date),
              formatDotDate(item.to.date),
            ],
            `${formatDotDate(item.from.date)} – ${formatDotDate(item.to.date)}`,
          ),
        (a, b) => byRelease(a.stat, b.stat),
      ),
    },
    {
      id: "song-fastest-debut",
      title: "가장 빨리 라이브에 오른 곡",
      description: "발매일부터 첫 라이브까지 — 발매 전에 먼저 부른 곡이 앞",
      columns: ["첫 라이브까지", "발매일", "첫 라이브"],
      rows: rank(
        debuts,
        (item) => item.gap,
        "asc",
        (item) =>
          songRow(item.stat.song, debutCells(item), debutCells(item)[2]),
      ),
    },
    {
      id: "song-slowest-debut",
      title: "라이브까지 가장 오래 걸린 곡",
      description: "발매일부터 첫 라이브까지 가장 오래 걸린 순",
      columns: ["첫 라이브까지", "발매일", "첫 라이브"],
      rows: rank(
        debuts,
        (item) => item.gap,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            debutCells(item),
            [aboutYears(item.gap), debutCells(item)[2]]
              .filter(Boolean)
              .join(" · "),
          ),
      ),
    },
    {
      id: "song-opener",
      title: "오프닝 단골 곡",
      description: `공연 첫 곡으로 가장 많이 부른 곡(첫 곡을 아는 공연일 ${withOpening.length}회 기준)`,
      columns: ["첫 곡 횟수", "비율"],
      rows: rank(
        openings,
        (item) => item.count,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [times(item.count), percent(item.count, withOpening.length)],
            `첫 곡을 아는 공연 ${withOpening.length}회 중 ${percent(item.count, withOpening.length)}`,
          ),
      ),
    },
    {
      id: "song-encore",
      title: "앵콜 단골 곡",
      description: `앵콜로 가장 많이 부른 곡(앵콜이 있었던 공연일 ${withEncore.length}회 기준)`,
      columns: ["앵콜 횟수", "비율"],
      rows: rank(
        encores,
        (item) => item.count,
        "desc",
        (item) =>
          songRow(
            item.stat.song,
            [times(item.count), percent(item.count, withEncore.length)],
            `앵콜이 있었던 공연 ${withEncore.length}회 중 ${percent(item.count, withEncore.length)}`,
          ),
      ),
    },
  ];
}

// ─── 앨범 ──────────────────────────────────────────────────────────────

function albumRecords(albums: StatAlbum[], stats: SongStat[]): StatRecord[] {
  const bySong = new Map(stats.map((stat) => [stat.song.id, stat]));
  const items = albums
    .map((album) => {
      const songs = album.songIds.flatMap((id) => bySong.get(id) ?? []);
      return {
        album,
        total: songs.reduce((sum, stat) => sum + stat.played.length, 0),
        songCount: songs.length,
        playedCount: songs.filter((stat) => stat.played.length > 0).length,
      };
    })
    .filter((item) => item.songCount > 0);

  type Item = (typeof items)[number];
  const row = (item: Item, cells: string[], note: string) => ({
    key: item.album.id,
    name: item.album.title,
    sub: item.album.titleKo !== item.album.title ? item.album.titleKo : null,
    image: item.album.cover,
    href: `/zutopia/albums?album=${item.album.slug}`,
    cells,
    note,
  });
  const coverage = (item: Item) => `${item.playedCount}/${item.songCount}곡`;
  const note = (item: Item) =>
    `수록곡 ${item.songCount}곡 중 ${item.playedCount}곡 라이브 · 합계 ${times(item.total)}`;

  return [
    {
      id: "album-most-played",
      title: "라이브에서 가장 많이 불린 앨범",
      description: "수록곡 라이브 횟수 합계",
      columns: ["합계", "라이브된 수록곡", "비율"],
      rows: rank(
        items,
        (item) => item.total,
        "desc",
        (item) =>
          row(
            item,
            [
              times(item.total),
              coverage(item),
              percent(item.playedCount, item.songCount),
            ],
            note(item),
          ),
      ),
    },
    {
      id: "album-coverage",
      title: "수록곡이 가장 고르게 불린 앨범",
      description: "수록곡 중 한 번이라도 라이브에서 부른 곡의 비율",
      columns: ["비율", "라이브된 수록곡", "합계"],
      rows: rank(
        items,
        (item) => Math.round((item.playedCount / item.songCount) * 1000),
        "desc",
        (item) =>
          row(
            item,
            [
              percent(item.playedCount, item.songCount),
              coverage(item),
              times(item.total),
            ],
            note(item),
          ),
        (a, b) => b.total - a.total,
      ),
    },
    {
      id: "album-least-played",
      title: "라이브에서 가장 적게 불린 앨범",
      description: "수록곡 라이브 횟수 합계가 적은 순",
      columns: ["합계", "라이브된 수록곡", "비율"],
      rows: rank(
        items,
        (item) => item.total,
        "asc",
        (item) =>
          row(
            item,
            [
              times(item.total),
              coverage(item),
              percent(item.playedCount, item.songCount),
            ],
            note(item),
          ),
      ),
    },
  ];
}

// ─── 공연 ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  CONCERT: "콘서트",
  FESTIVAL: "페스티벌",
  EVENT: "이벤트",
};

/**
 * 해마다 이름에 붙는 연도 표기를 뗀 페스티벌 이름 — "FUJI ROCK FESTIVAL '19",
 * "COUNTDOWN JAPAN 19/20", "OSAKA GIGANTIC MUSIC FESTIVAL 2022"를 같은 페스티벌로 묶는다.
 */
export function festivalKey(title: string): string {
  return title
    .replace(/\s*(\d{2}\/\d{2}|'\d{2}|(?<!\d)\d{4}(?!\d))/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 이름에 붙은 회차 표기('19, 19/20, 2024) — 없으면 시작 연도. */
function festivalEdition(unit: LiveUnit): string {
  return (
    unit.title.match(/\d{2}\/\d{2}|'\d{2}|(?<!\d)\d{4}(?!\d)/)?.[0] ??
    unit.date.slice(0, 4)
  );
}

function liveRecords(
  all: LiveUnit[],
  known: LiveUnit[],
  stats: SongStat[],
  input: { upcoming: LiveUnit[]; tours: StatTour[]; songs: StatSong[] },
): StatRecord[] {
  // 그 공연일에 처음 라이브로 부른 곡
  const debutsByUnit = new Map<string, StatSong[]>();
  for (const stat of stats) {
    const first = stat.played[0];
    if (!first) continue;
    debutsByUnit.set(first.id, [
      ...(debutsByUnit.get(first.id) ?? []),
      stat.song,
    ]);
  }
  const debutUnits = known.filter((unit) => debutsByUnit.has(unit.id));

  // 투어 — 기간과 공연 횟수(예정 포함)
  const showsByTour = new Map<string, number>();
  for (const unit of [...all, ...input.upcoming])
    if (unit.tourId)
      showsByTour.set(unit.tourId, (showsByTour.get(unit.tourId) ?? 0) + 1);
  const tours = input.tours.map((tour) => ({
    tour,
    span: diffDays(tour.startDate, tour.endDate ?? tour.startDate) + 1,
    shows: showsByTour.get(tour.id) ?? 0,
  }));

  // 해마다 공연 횟수
  const years = new Map<string, LiveUnit[]>();
  for (const unit of all) {
    const year = unit.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), unit]);
  }
  const typeBreakdown = (units: LiveUnit[]) =>
    Object.entries(TYPE_LABEL)
      .map(([type, label]) => {
        const count = units.filter((unit) => unit.type === type).length;
        return count > 0 ? `${label} ${count}` : null;
      })
      .filter(Boolean)
      .join(" · ");

  // 공연 사이 공백 — 날짜가 다른 연이은 두 공연일 사이
  const dates = all.filter(
    (unit, index) => index === 0 || unit.date !== all[index - 1].date,
  );
  const gaps = dates.slice(1).map((unit, index) => ({
    from: dates[index],
    to: unit,
    gap: diffDays(dates[index].date, unit.date),
  }));

  // 같은 페스티벌 출연 횟수
  const festivals = new Map<string, LiveUnit[]>();
  for (const unit of all) {
    if (unit.type !== "FESTIVAL") continue;
    const key = festivalKey(unit.title);
    festivals.set(key, [...(festivals.get(key) ?? []), unit]);
  }

  return [
    {
      id: "live-most-songs",
      title: "가장 많은 곡을 부른 공연",
      description: "세트리스트의 곡 수(같은 곡은 한 번, 어레인지는 원곡으로)",
      columns: ["곡 수", "종류"],
      rows: rank(
        known,
        (unit) => unit.songIds.length,
        "desc",
        (unit) =>
          unitRow(unit, [
            `${unit.songIds.length}곡`,
            TYPE_LABEL[unit.type] ?? unit.type,
          ]),
        byDate,
      ),
    },
    {
      id: "live-most-debuts",
      title: "라이브 첫 공개가 가장 많았던 공연",
      description: "그날 처음으로 라이브에서 부른 곡 수",
      columns: ["첫 공개", "곡"],
      rows: rank(
        debutUnits,
        (unit) => debutsByUnit.get(unit.id)!.length,
        "desc",
        (unit) => {
          const songs = debutsByUnit.get(unit.id)!;
          const names = songs.map((song) => song.titleKo).join(", ");
          return unitRow(unit, [`${songs.length}곡`, names], names);
        },
        byDate,
      ),
    },
    {
      id: "live-longest-tour",
      title: "가장 긴 투어",
      description: "첫 공연부터 마지막 공연까지 기간(공연 횟수는 예정 포함)",
      columns: ["기간", "공연 횟수", "일정"],
      rows: rank(
        tours,
        (item) => item.span,
        "desc",
        (item) => {
          const period = `${formatDotDate(item.tour.startDate)} – ${formatDotDate(item.tour.endDate ?? item.tour.startDate)}`;
          return {
            key: item.tour.id,
            name: item.tour.titleKo,
            sub: period,
            image: item.tour.poster,
            href: `/zutopia/lives/${item.tour.slug}`,
            cells: [days(item.span), times(item.shows), period],
            note: `${period} · ${times(item.shows)} 공연`,
          };
        },
      ),
    },
    {
      id: "live-busiest-year",
      title: "공연이 가장 많았던 해",
      description: "그해 공연일 수",
      columns: ["공연", "종류별"],
      rows: rank(
        [...years],
        ([, units]) => units.length,
        "desc",
        ([year, units]) => ({
          key: year,
          name: `${year}년`,
          cells: [times(units.length), typeBreakdown(units)],
          note: typeBreakdown(units),
        }),
        ([a], [b]) => b.localeCompare(a),
      ),
    },
    {
      id: "live-longest-break",
      title: "가장 길었던 공연 공백",
      description: "연이은 두 공연일 사이 간격",
      columns: ["공백", "이전 공연", "다음 공연"],
      rows: rank(
        gaps,
        (item) => item.gap,
        "desc",
        (item) => ({
          key: `${item.from.id}>${item.to.id}`,
          name: `${formatDotDate(item.from.date)} → ${formatDotDate(item.to.date)}`,
          sub: `${unitName(item.from)} → ${unitName(item.to)}`,
          cells: [
            days(item.gap),
            `${formatDotDate(item.from.date)} ${unitName(item.from)}`,
            `${formatDotDate(item.to.date)} ${unitName(item.to)}`,
          ],
          note: aboutYears(item.gap),
        }),
      ),
    },
    {
      id: "live-festival",
      title: "가장 많이 출연한 페스티벌",
      description: "연도 표기를 뗀 이름이 같은 페스티벌을 하나로",
      columns: ["출연", "회차"],
      rows: rank(
        [...festivals],
        ([, units]) => units.length,
        "desc",
        ([name, units]) => ({
          key: name,
          name,
          image: units.at(-1)!.imageUrl,
          href: units.at(-1)!.href,
          cells: [times(units.length), units.map(festivalEdition).join(", ")],
          note: units.map(festivalEdition).join(" · "),
        }),
      ),
    },
  ];
}

// ─── 장소 ──────────────────────────────────────────────────────────────

/**
 * 공연장 이름 — "幕張メッセ国際展示場 (1~11ホール) (마쿠하리 멧세 국제전시장(1~11홀))"
 * 처럼 홀 번호가 붙어도 같은 곳으로 묶는다. key는 원어 이름에서 괄호를 모두 뗀 것,
 * label은 한글 이름(없으면 원어)에서 괄호를 뗀 것.
 */
export function venueName(venue: string): { key: string; label: string } {
  const { main, suffix } = splitParenSuffix(venue);
  const strip = (text: string) =>
    text
      .replace(/\s*\([^()]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const key = strip(main);
  // 끝 괄호가 한글이 아니면(영문 병기 등) 원어 이름을 그대로 쓴다.
  const label = suffix && /[가-힣]/.test(suffix) ? strip(suffix) || key : key;
  return { key, label };
}

function placeRecords(all: LiveUnit[]): StatRecord[] {
  const offline = all.filter((unit) => !isOnline(unit));
  const yearsOf = (units: LiveUnit[]) => {
    const first = units[0].date.slice(0, 4);
    const last = units.at(-1)!.date.slice(0, 4);
    return first === last ? first : `${first} – ${last}`;
  };

  const group = (keyOf: (unit: LiveUnit) => string | null) => {
    const map = new Map<string, LiveUnit[]>();
    for (const unit of offline) {
      const key = keyOf(unit);
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), unit]);
    }
    return [...map];
  };

  const cities = group((unit) => unit.city || null);
  const venues = group((unit) =>
    unit.venue ? venueName(unit.venue).key : null,
  );
  const countries = group((unit) =>
    unit.country && unit.country !== "일본" ? unit.country : null,
  );
  const overseasTotal = countries.reduce(
    (sum, [, units]) => sum + units.length,
    0,
  );
  const unique = (values: string[]) => [...new Set(values)].join(", ");

  return [
    {
      id: "place-city",
      title: "가장 자주 공연한 도시",
      description: "공연일 기준(온라인 공연 제외)",
      columns: ["공연", "기간"],
      rows: rank(
        cities,
        ([, units]) => units.length,
        "desc",
        ([city, units]) => ({
          key: city,
          name: city,
          sub: units[0].country ?? null,
          cells: [times(units.length), yearsOf(units)],
          note: yearsOf(units),
        }),
      ),
    },
    {
      id: "place-venue",
      title: "가장 자주 선 공연장",
      description: "홀 번호 등 괄호 안 표기가 달라도 같은 공연장은 하나로",
      columns: ["공연", "도시", "기간"],
      rows: rank(
        venues,
        ([, units]) => units.length,
        "desc",
        ([key, units]) => {
          const { label } = venueName(units[0].venue!);
          return {
            key,
            name: label,
            sub: label !== key ? key : null,
            cells: [
              times(units.length),
              unique(units.map((unit) => unit.city)),
              yearsOf(units),
            ],
            note: `${unique(units.map((unit) => unit.city))} · ${yearsOf(units)}`,
          };
        },
      ),
    },
    {
      id: "place-overseas",
      title: "해외 공연이 가장 많았던 나라",
      description: `일본 밖 공연일(해외 공연 총 ${overseasTotal}회)`,
      columns: ["공연", "도시", "기간"],
      rows: rank(
        countries,
        ([, units]) => units.length,
        "desc",
        ([country, units]) => ({
          key: country,
          name: country,
          cells: [
            times(units.length),
            unique(units.map((unit) => unit.city)),
            yearsOf(units),
          ],
          note: `${unique(units.map((unit) => unit.city))} · ${yearsOf(units)}`,
        }),
      ),
    },
  ];
}

import type { LiveHistory, LiveUnit } from "./types";

export interface LiveRef {
  /** 공연 이름(한국어 제목, 없으면 원어) */
  title: string;
  /** 도시 + (이틀 이상 공연이면) DAY N — 예: "서울 DAY 1". 도시가 없으면 null. */
  detail: string | null;
  /** "YYYY-MM-DD" */
  date: string;
  href: string | null;
}

/** 디스코그래피 곡 행·상세 패널에 보여줄 곡별 라이브 기록 요약. */
export interface SongLiveSummary {
  count: number;
  last: LiveRef;
  first: LiveRef;
}

function toUtc(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 두 "YYYY-MM-DD" 사이 일수(to − from). 시간대 영향 없이 날짜만 비교한다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

function unitDetail(unit: LiveUnit): string | null {
  const parts = [unit.city, unit.dayNumber ? `DAY ${unit.dayNumber}` : null];
  const detail = parts.filter(Boolean).join(" ");
  return detail || null;
}

/**
 * 화면에 나오는 곡 id마다 라이브 기록 요약. 어레인지 버전 곡은 원곡 기록을
 * 그대로 받는다(집계가 원곡 기준이라). 기록 없는 곡은 키가 없다.
 */
export function toSongLiveSummaries(
  songIds: string[],
  history: LiveHistory,
  originalOf: Record<string, string>,
): Record<string, SongLiveSummary> {
  const unitsById = new Map(history.units.map((unit) => [unit.id, unit]));
  const summaries: Record<string, SongLiveSummary> = {};
  const toRef = (unit: LiveUnit): LiveRef => ({
    title: unit.titleKo ?? unit.title,
    detail: unitDetail(unit),
    date: unit.date,
    href: unit.href,
  });
  for (const songId of songIds) {
    const stat = history.statsBySongId[originalOf[songId] ?? songId];
    const last = stat ? unitsById.get(stat.lastUnitId) : undefined;
    const first = stat ? unitsById.get(stat.firstUnitId) : undefined;
    if (!stat || !last || !first) continue;
    summaries[songId] = {
      count: stat.count,
      last: toRef(last),
      first: toRef(first),
    };
  }
  return summaries;
}

/** "2026-03-14" → "2026.03.14" */
export function formatLiveDate(date: string): string {
  return date.replaceAll("-", ".");
}

/** "236일 전", 오늘(이후)이면 "오늘". 두 값 모두 "YYYY-MM-DD". */
export function formatDaysAgo(date: string, today: string): string {
  const days = daysBetween(date, today);
  return days <= 0 ? "오늘" : `${days}일 전`;
}

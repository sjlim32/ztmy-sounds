import type { LiveUnit } from "@/features/zutopia/live-history/types";

/** 참전 기록·이미지에 쓰는 곡 정보 — 원곡·발매곡만(페이지에서 거른다, 협업곡 포함). */
export interface AttendanceSong {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  titleEn: string;
  /** "YYYY-MM-DD" */
  releaseDate: string;
  coverSrc: string | null;
  /**
   * 협업곡(songs.metadata.collab) — 라이브에서 들었으면 들은 곡에 넣고, 못 들었으면
   * "못 들은 곡"에 넣지 않는다(라이브에서 부를 것으로 기대하는 곡이 아니라서).
   */
  collab?: boolean;
}

export interface HeardSong extends AttendanceSong {
  count: number;
  /** 이 곡을 들은 공연일 ID — 최신 먼저(units 순서). */
  unitIds: string[];
}

export interface AttendanceSummary {
  /** 현재 데이터에 있는 체크 단위 수(사라진 공연 ID는 빼고 센다) */
  attendedCount: number;
  /** 들은 곡 — 횟수 많은 순, 같으면 발매일 순, 그다음 제목 */
  heard: HeardSong[];
  /** 못 들은 곡 — 발매일 순 */
  unheard: AttendanceSong[];
  /** 체크한 공연 날짜 범위, 체크가 없으면 null */
  period: { from: string; to: string } | null;
}

const byRelease = (a: AttendanceSong, b: AttendanceSong) =>
  a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title);

/**
 * 체크한 공연 단위로 들은 곡·횟수와 못 들은 곡을 센다. 저장된 체크 ID가 지금
 * 데이터에 없으면(공연 삭제·수정) 조용히 무시한다 — 저장값은 지우지 않는다.
 * units.songIds 중 songs에 없는 곡(미공개곡 등)도 세지 않는다.
 */
export function summarizeAttendance(
  units: LiveUnit[],
  attended: ReadonlySet<string>,
  songs: AttendanceSong[],
): AttendanceSummary {
  const checked = units.filter((unit) => attended.has(unit.id));
  const heardIn = new Map<string, string[]>();
  for (const unit of checked) {
    for (const songId of unit.songIds) {
      const list = heardIn.get(songId);
      if (list) list.push(unit.id);
      else heardIn.set(songId, [unit.id]);
    }
  }

  const heard: HeardSong[] = songs
    .filter((song) => heardIn.has(song.id))
    .map((song) => {
      const unitIds = heardIn.get(song.id)!;
      return { ...song, count: unitIds.length, unitIds };
    })
    .sort((a, b) => b.count - a.count || byRelease(a, b));
  const unheard = songs
    .filter((song) => !heardIn.has(song.id) && !song.collab)
    .sort(byRelease);

  const dates = checked.map((unit) => unit.date).sort();
  return {
    attendedCount: checked.length,
    heard,
    unheard,
    period: dates.length
      ? { from: dates[0], to: dates[dates.length - 1] }
      : null,
  };
}

import type { Json } from "@/lib/supabase/database.types";

/**
 * 같은 날 여러 번 하는 공연의 회차 — 공연일 계산(live-history/units.ts)과 상세
 * 화면(live-days.ts)이 같이 쓴다.
 *
 * 회차 수는 날마다 "lives.metadata.shows에 적힌 회차"와 "그날 세트리스트에 있는
 * show_number" 중 큰 쪽 — metadata를 안 적어도 세트리스트만으로 나뉜다. 2회 이상일
 * 때만 회차로 나누고(1회면 지금처럼 하루 1회), 이름이 없으면 "1회차"·"2회차".
 *
 * metadata.shows 형식(둘 다 된다):
 * - 이름만, 매일 같은 회차: ["昼の部", "夜の部"]
 * - 회차마다 정보(날마다 다를 수 있고 시간도): [
 *     { "day": 1, "show": 1, "label": "昼の部", "show_open": "12:00", "show_start": "13:00" },
 *     { "day": 1, "show": 2, "show_start": "18:00" }, …]
 *   day를 빼면 모든 날, show를 빼면 같은 날 항목 중 적힌 순서. 시간은 "HH:MM"(현지 시각).
 */
export interface ShowInfo {
  /** 그날 몇 번째 회차(1부터) */
  show: number;
  label: string;
  /** 개장 시각 "HH:MM" */
  open: string | null;
  /** 개연 시각 "HH:MM" */
  start: string | null;
}

interface ShowEntry {
  day: number | null;
  show: number;
  label: string | null;
  open: string | null;
  start: string | null;
}

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const asTime = (value: unknown) => {
  const text = asText(value);
  return text && /^\d{1,2}:\d{2}$/.test(text) ? text : null;
};
const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1
    ? value
    : null;

function parseShowEntries(metadata: Json | null | undefined): ShowEntry[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return [];
  const shows = (metadata as Record<string, unknown>).shows;
  if (!Array.isArray(shows)) return [];
  const entries: ShowEntry[] = [];
  // show를 빼면 같은 날(day) 항목 중 몇 번째인지로 — day가 없는 항목끼리도 따로 센다.
  const seen = new Map<string, number>();
  const nextShow = (day: number | null) => {
    const key = String(day ?? "all");
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    return n;
  };
  shows.forEach((item) => {
    if (typeof item === "string") {
      const label = asText(item);
      if (label)
        entries.push({
          day: null,
          show: nextShow(null),
          label,
          open: null,
          start: null,
        });
      return;
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const record = item as Record<string, unknown>;
    const day = asNumber(record.day);
    const order = nextShow(day);
    entries.push({
      day,
      show: asNumber(record.show) ?? order,
      label: asText(record.label),
      // 시각 키는 show_open·show_start(예전 이름 open·start도 읽는다)
      open: asTime(record.show_open) ?? asTime(record.open),
      start: asTime(record.show_start) ?? asTime(record.start),
    });
  });
  return entries;
}

/**
 * 그날(day — 하루 공연이면 1)의 회차 목록. setlistShowNumbers는 그날 세트리스트에
 * 있는 show_number들. 1회뿐이면 빈 배열(회차로 나누지 않음).
 */
export function showsForDay(
  metadata: Json | null | undefined,
  day: number,
  setlistShowNumbers: (number | null | undefined)[] = [],
): ShowInfo[] {
  const entries = parseShowEntries(metadata).filter(
    (entry) => entry.day === null || entry.day === day,
  );
  const count = Math.max(
    0,
    ...entries.map((entry) => entry.show),
    ...setlistShowNumbers.filter((n): n is number => typeof n === "number"),
  );
  if (count < 2) return [];
  return Array.from({ length: count }, (_, i) => {
    const show = i + 1;
    // 그날 전용 항목이 모든 날 항목보다 우선
    const entry =
      entries.find((e) => e.show === show && e.day === day) ??
      entries.find((e) => e.show === show);
    return {
      show,
      label: entry?.label ?? `${show}회차`,
      open: entry?.open ?? null,
      start: entry?.start ?? null,
    };
  });
}

/** 일차·회차 표기 — "DAY 1 昼の部", 하루 공연이면 "昼の部", 둘 다 없으면 null. */
export function formatDayShow(
  dayNumber: number | null | undefined,
  showLabel: string | null | undefined,
): string | null {
  const parts = [dayNumber ? `DAY ${dayNumber}` : null, showLabel || null];
  const text = parts.filter(Boolean).join(" ");
  return text || null;
}

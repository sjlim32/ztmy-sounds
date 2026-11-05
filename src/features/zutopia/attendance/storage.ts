/**
 * 참전 기록 체크 내역의 저장 형식. localStorage 한 키에 JSON으로 두고,
 * 백업 파일도 같은 JSON이다. attended에는 공연 단위 ID(`${liveId}:${YYYY-MM-DD}`,
 * live-history/types.ts의 LiveUnit.id)가 들어간다.
 */
export const ATTENDANCE_STORAGE_KEY = "ztmy-sounds:live-attendance";

export interface AttendanceData {
  version: 1;
  attended: string[];
  updatedAt: string;
}

const EMPTY: AttendanceData = { version: 1, attended: [], updatedAt: "" };

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * localStorage에서 읽은 값 — 너그럽게 읽는다. 없거나 깨졌거나 다른 버전이면
 * 빈 데이터, 문자열이 아닌 항목은 버리고 중복은 한 번만.
 */
export function parseAttendance(raw: string | null): AttendanceData {
  if (raw === null) return EMPTY;
  const value = parse(raw);
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.attended))
    return EMPTY;
  const attended = [
    ...new Set(
      value.attended.filter((id): id is string => typeof id === "string"),
    ),
  ];
  return {
    version: 1,
    attended,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

/**
 * 사용자가 고른 백업 파일 — 엄격하게 읽는다. 형식이 하나라도 다르면 null을
 * 돌려줘서, 엉뚱한 파일로 지금 체크 내역을 덮어쓰지 않게 한다.
 */
export function parseBackup(raw: string): AttendanceData | null {
  const value = parse(raw);
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.attended))
    return null;
  if (!value.attended.every((id) => typeof id === "string")) return null;
  return parseAttendance(raw);
}

export function serializeAttendance(
  attended: Iterable<string>,
  now: Date,
): string {
  const data: AttendanceData = {
    version: 1,
    attended: [...new Set(attended)].sort(),
    updatedAt: now.toISOString(),
  };
  return JSON.stringify(data);
}

/** "ztmy-attendance-YYYYMMDD.json" (보는 사람의 로컬 날짜) */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `ztmy-attendance-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
}

/**
 * localStorage는 사파리 사생활 보호 모드·용량 초과·설정 차단 등에서 예외를
 * 던진다 — 페이지가 죽지 않게 삼키고, 읽기는 null(빈 체크), 쓰기는 false.
 */
export function safeRead(
  storage: Pick<Storage, "getItem"> | undefined,
): string | null {
  try {
    return storage?.getItem(ATTENDANCE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function safeWrite(
  storage: Pick<Storage, "setItem"> | undefined,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ATTENDANCE_STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

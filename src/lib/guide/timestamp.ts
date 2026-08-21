import type { Timestamp } from "@/lib/guide/types";

const TIMESTAMP_PATTERN = /^(\d+):(\d{1,2}(?:\.\d+)?)$/;

/** "mm:ss" / "mm:ss.s" 형식의 타임스탬프를 초 단위 숫자로 변환합니다. */
export function parseTimestamp(timestamp: Timestamp): number {
  const match = TIMESTAMP_PATTERN.exec(timestamp);

  if (!match) {
    throw new Error(
      `잘못된 타임스탬프입니다 "${timestamp}" — "mm:ss" 또는 "mm:ss.s" 형식이어야 합니다.`,
    );
  }

  const [, minutes, seconds] = match;
  return Number(minutes) * 60 + Number(seconds);
}

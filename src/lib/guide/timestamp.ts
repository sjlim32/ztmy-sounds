import type { Timestamp } from "@/lib/guide/types";

const TIMESTAMP_PATTERN = /^(\d+):(\d{1,2}(?:\.\d+)?)$/;

/** Converts a "mm:ss" / "mm:ss.s" timestamp into seconds. */
export function parseTimestamp(timestamp: Timestamp): number {
  const match = TIMESTAMP_PATTERN.exec(timestamp);

  if (!match) {
    throw new Error(`Invalid timestamp "${timestamp}" — expected "mm:ss" or "mm:ss.s".`);
  }

  const [, minutes, seconds] = match;
  return Number(minutes) * 60 + Number(seconds);
}

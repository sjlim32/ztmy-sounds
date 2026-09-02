import type { LyricLine } from "@/features/guide/lib/types";
import { parseTimestamp } from "@/features/guide/lib/timestamp";

/**
 * Returns the index of the line that should be highlighted for the given
 * playback time — the last line whose `time` has already passed.
 * Returns -1 before the first line starts.
 */
export function getActiveLineIndex(
  lyrics: LyricLine[],
  currentTime: number,
): number {
  let activeIndex = -1;

  for (let i = 0; i < lyrics.length; i++) {
    if (parseTimestamp(lyrics[i].time) <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
}

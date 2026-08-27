import { CALL_TAGS, type CallTag, type Song } from "@/features/guide/lib/types";

/** 곡의 lyrics에서 실제 쓰인 응원(CallTag) 종류를 CALL_TAGS 순서로 뽑아냅니다. */
export function getSongCallTags(song: Song): CallTag[] {
  const used = new Set<CallTag>();

  for (const line of song.lyrics) {
    if (line.cheer && typeof line.cheer !== "string" && line.cheer.tag) {
      used.add(line.cheer.tag);
    }
  }

  return CALL_TAGS.filter((tag) => used.has(tag));
}

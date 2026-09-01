import { songList } from "@/features/guide/data/songs";
import { CALL_TAGS, type CallTag, type Song } from "@/features/guide/lib/types";

/**
 * 곡의 lyrics에서 실제 쓰인 응원(CallTag) 종류를 CALL_TAGS 순서로 뽑아냅니다.
 * slam은 cheer.tag가 아니라 별도 필드(line.slam)로 표시되므로 따로 확인합니다.
 */
export function getSongCallTags(song: Song): CallTag[] {
  const used = new Set<CallTag>();

  for (const line of song.lyrics) {
    if (line.cheer && typeof line.cheer !== "string" && line.cheer.tag) {
      used.add(line.cheer.tag);
    }
    if (line.slam !== undefined) {
      used.add("slam");
    }
  }

  return CALL_TAGS.filter((tag) => used.has(tag));
}

// songList는 정적 데이터라 한 번만 계산해두면 충분합니다 — SongList가
// 리렌더될 때마다(예: 곡 선택 전환) 14곡 전체의 lyrics를 매번 다시 스캔하는
// 걸 피하기 위해 모듈 로드 시 한 번만 계산해서 캐싱합니다.
const SONG_CALL_TAGS_BY_ID = new Map<string, CallTag[]>(
  songList.map((song) => [song.id, getSongCallTags(song)]),
);

/** getSongCallTags(song)의 결과를 song.id로 캐시에서 조회합니다. */
export function getCachedSongCallTags(song: Song): CallTag[] {
  return SONG_CALL_TAGS_BY_ID.get(song.id) ?? getSongCallTags(song);
}

/** 주어진 태그를 실제로 사용하는 곡만 골라냅니다 (예: 슬램 가이드 목록). */
export function getSongsWithTag(tag: CallTag, songs: Song[]): Song[] {
  return songs.filter((song) => getCachedSongCallTags(song).includes(tag));
}

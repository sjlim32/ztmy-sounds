import type { Song } from "@/features/guide/lib/types";

/** 곡 페이지 제목 — 응원·슬램 가이드 메타데이터와 RSS 항목이 같이 쓴다. 원제와
 * 한글 제목이 같으면("JK BOMBER") 한 번만. */
export function songPageTitle(song: Song): string {
  const { jp, kr } = song.title;
  return jp === kr ? jp : `${jp} (${kr})`;
}

/** 응원 가이드 곡 페이지 설명 — 곡 페이지 메타데이터와 RSS 항목이 같이 쓴다.
 * Song.description.summary는 상세 화면의 짧은 라벨("T I P" 등)이라 쓰지 않는다. */
export function cheerGuideDescription(song: Song): string {
  return `${koreanWithEnglish(song)} 샤모지 응원 가이드`;
}

export function slamGuideDescription(song: Song): string {
  return `${koreanWithEnglish(song)} 슬램 가이드`;
}

/** "하나이치몬메 (Hanaichi Monnme)" — 한글·영문 제목이 같으면("JK BOMBER") 한 번만. */
function koreanWithEnglish(song: Song): string {
  const { kr, en } = song.title;
  return kr === en ? kr : `${kr} (${en})`;
}

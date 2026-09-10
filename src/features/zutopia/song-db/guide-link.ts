import { songList } from "@/features/guide/data/songs";

// 가이드 콘텐츠의 Song.id(=/guide/[songId] 라우트 값)를 Supabase songs.slug와
// 동일한 값으로 통일해뒀다 — 예전엔 5곡에서 어긋나 있어(kan_saete_kuyashiiwa
// vs kan-saete-kuyashiiwa, obenkyou-shitoiteyo vs study-me 등) title로
// 매칭했는데, id를 Supabase 기준으로 고쳐 이제 slug로 직접 매칭한다.
const GUIDE_IDS = new Set(songList.map((song) => song.id));

// data.ts가 빌드 타임(서버)에서만 호출한다 — 클라이언트 컴포넌트
// (AlbumListView/SongListView)는 이 결과(문자열 href 하나)만 받고, 가사
// 전체가 든 무거운 guide songList 자체는 번들에 절대 포함되지 않는다.
export function getGuideHref(slug: string): string | null {
  return GUIDE_IDS.has(slug) ? `/guide/${slug}` : null;
}

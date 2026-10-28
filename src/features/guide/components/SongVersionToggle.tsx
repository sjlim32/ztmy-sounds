"use client";

import { cn } from "@/lib/utils";
import { usePlayer } from "@/features/guide/player-context";
import { hasOriginVersion } from "@/features/guide/lib/song-version";
import { AutoScrollStatusIcon } from "@/features/guide/components/AutoScrollStatusIcon";
import { FOCUS_RING } from "@/components/button-styles";

/**
 * 음원/라이브 전환 스위치 — `음원 (●━━) 라이브`. 누를 때마다 바뀌고, 손잡이가
 * 고른 쪽으로 미끄러지며(자동 스크롤 스위치와 같은 손잡이) 고른 쪽 글자가 분홍.
 * 영상(유튜브)과 가사 싱크를 같이 바꾸는 영상 쪽 기능이라 영상 가까이에 둔다:
 * 태블릿 이상은 영상 위 버튼 줄(GuideDetailToolbar), 모바일은 영상 바로 아래
 * 줄(GuidePlayerArea). origin 폴더에 같은 곡(같은 번호) 데이터가 있을 때만 그린다.
 */
export function SongVersionToggle({ className }: { className?: string }) {
  const { activeSongId, songVersion, setSongVersion } = usePlayer();

  if (!activeSongId || !hasOriginVersion(activeSongId)) return null;

  const isLive = songVersion === "live";
  const labelClass = (selected: boolean) =>
    cn(
      "transition-colors",
      selected ? "text-ztmy-pink font-semibold" : "text-white/55",
    );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLive}
      aria-label="라이브 버전"
      title={isLive ? "음원 버전으로 바꾸기" : "라이브 버전으로 바꾸기"}
      onClick={() => setSongVersion(isLive ? "studio" : "live")}
      className={cn(
        // 모바일은 영상 아래 한 줄에 응원 안내·오류 제보와 같이 들어가서 작게.
        "flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-1.5 text-xs whitespace-nowrap transition-colors hover:bg-white/10",
        "tablet:h-9 tablet:gap-2 tablet:px-2.5 tablet:text-sm",
        FOCUS_RING,
        className,
      )}
    >
      <span className={labelClass(!isLive)}>음원</span>
      <span
        aria-hidden
        className="bg-ztmy-pink/70 relative h-5 w-9 shrink-0 rounded-full"
      >
        <AutoScrollStatusIcon active={isLive} />
      </span>
      <span className={labelClass(isLive)}>라이브</span>
    </button>
  );
}

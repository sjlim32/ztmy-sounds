"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { getSongForVersion } from "@/features/guide/lib/song-version";

interface SwingGif {
  src: string;
  size?: number;
}

/**
 * 선택된 곡의 스윙 예시 GIF. 음원(origin) 버전엔 swingGif가 없을 수
 * 있어 항상 라이브(정식) 데이터에서 읽고, 스윙을 강조하지 않는 모드(슬램
 * 가이드)에서는 띄우지 않습니다.
 */
function useSwingGif(): SwingGif | null {
  const segment = useSelectedLayoutSegment();
  const { visibleTags } = useGuideMode();

  if (!segment || !visibleTags.includes("swing")) return null;
  const song = getSong(segment);
  if (!song?.swingGif) return null;
  return { src: song.swingGif, size: song.swingGifSize };
}

/** tablet 이상: GuidePlayerArea 안에서 영상·컨트롤 아래 줄에 항상 표시. */
export function SwingGuideGif() {
  const gif = useSwingGif();
  if (!gif) return null;

  return (
    <div
      className={cn(
        "hidden",
        "tablet:order-5 tablet:flex tablet:basis-full tablet:justify-center",
      )}
    >
      <SwingImage {...gif} />
    </div>
  );
}

/** 모바일: 현재 재생 중인 가사 줄에 swingGif 플래그가 있을 때만 화면 우측 중앙에 고정 표시. */
export function SwingGuideGifOverlay() {
  const gif = useSwingGif();
  const segment = useSelectedLayoutSegment();
  const { activeSongId, songVersion, currentTime } = usePlayer();

  const song = segment ? getSongForVersion(segment, songVersion) : null;
  const isSwing =
    !!song &&
    activeSongId === song.id &&
    !!song.lyrics[getActiveLineIndex(song.lyrics, currentTime)]?.swingGif;

  if (!gif) return null;

  return (
    <div
      aria-hidden={!isSwing}
      className={cn(
        // 가사 줄 탭(seek)을 가리지 않도록 pointer-events-none
        "pointer-events-none fixed top-1/2 right-2 z-40 -translate-y-1/2 transition-opacity duration-300",
        isSwing ? "opacity-100" : "opacity-0",
        "tablet:hidden",
      )}
    >
      <SwingImage {...gif} />
    </div>
  );
}

function SwingImage({ src, size }: SwingGif) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 곡마다 GIF 크기가 달라 이미지 자체 크기를 그대로 써야 해서 next/image의 필수 width/height 제약을 피함
    <img
      src={src}
      alt="스윙 동작 예시"
      // size가 있으면 그 정사각형을 덮도록 축소해 가운데만 보이게(object-cover)
      style={size ? { width: size, height: size } : undefined}
      // 큰 GIF가 좁은 모바일 화면 밖으로 넘치지 않게만 제한
      className="h-auto max-w-[calc(100vw-1rem)] rounded-lg object-cover"
    />
  );
}

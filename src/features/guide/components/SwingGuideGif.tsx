"use client";

import { useEffect, useRef, useState } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LyricLine } from "@/features/guide/lib/types";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { getSongForVersion } from "@/features/guide/lib/song-version";

interface SwingGif {
  src: string;
  size?: number;
  /** 지금 재생 중인 가사 줄에 swingGif 플래그가 있는지 */
  isSwing: boolean;
  /** 바뀔 때마다 GIF를 첫 프레임부터 다시 재생한다 */
  playId: number;
}

// swingGif 줄이 연달아 붙은 구간의 첫 줄 — 같은 구간 안에서 줄이 넘어갈 땐
// 다시 재생하지 않고, 다른 구간에 들어갈 때만 다시 재생하기 위한 기준.
function getSwingRunStart(lyrics: LyricLine[], index: number): number | null {
  if (!lyrics[index]?.swingGif) return null;
  let start = index;
  while (start > 0 && lyrics[start - 1].swingGif) start -= 1;
  return start;
}

/**
 * 선택된 곡의 스윙 예시 GIF. 음원(origin) 버전엔 swingGif가 없을 수
 * 있어 항상 라이브(정식) 데이터에서 읽고, 스윙을 강조하지 않는 모드(슬램
 * 가이드)에서는 띄우지 않습니다.
 *
 * GIF는 동작이 노래 박자와 맞아야 해서, swingGif 구간에 들어갈 때마다(그리고
 * 그 구간에서 재생을 멈췄다 다시 틀 때마다) playId를 올려 처음부터 재생한다.
 */
function useSwingGif(): SwingGif | null {
  const segment = useSelectedLayoutSegment();
  const { visibleTags } = useGuideMode();
  const { activeSongId, songVersion, currentTime, isPlaying } = usePlayer();

  const lyricsSong = segment ? getSongForVersion(segment, songVersion) : null;
  const runStart =
    lyricsSong && activeSongId === lyricsSong.id
      ? getSwingRunStart(
          lyricsSong.lyrics,
          getActiveLineIndex(lyricsSong.lyrics, currentTime),
        )
      : null;
  const runKey = runStart === null ? null : `${runStart}:${isPlaying}`;

  const [play, setPlay] = useState<{ runKey: string | null; id: number }>({
    runKey: null,
    id: 0,
  });
  if (runKey !== play.runKey) {
    setPlay({ runKey, id: runKey === null ? play.id : play.id + 1 });
  }

  if (!segment || !visibleTags.includes("swing")) return null;
  const song = getSong(segment);
  if (!song?.swingGif) return null;

  return {
    src: song.swingGif,
    size: song.swingGifSize,
    isSwing: runStart !== null,
    playId: play.id,
  };
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
  if (!gif) return null;

  return (
    <div
      aria-hidden={!gif.isSwing}
      className={cn(
        // 가사 줄 탭(seek)을 가리지 않도록 pointer-events-none
        "pointer-events-none fixed top-1/2 right-2 z-40 -translate-y-1/2 transition-opacity duration-300",
        gif.isSwing ? "opacity-100" : "opacity-0",
        "tablet:hidden",
      )}
    >
      <SwingImage {...gif} />
    </div>
  );
}

function SwingImage({
  src,
  size,
  playId,
}: Pick<SwingGif, "src" | "size" | "playId">) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<{ src: string; blob: Blob } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (blob && !cancelled) setLoaded({ src, blob });
      })
      // 못 받아오면 원래 src로 그냥 반복 재생된다(다시 재생만 안 됨).
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  // 애니메이션 이미지는 같은 주소로는 브라우저가 이어서 재생해 버려서(브라우저
  // 마다 동작도 다름), 받아둔 파일로 매번 새 주소(blob URL)를 만들어 갈아
  // 끼운다 — 새 주소의 이미지는 항상 첫 프레임부터 시작한다. 파일은 한 번만
  // 받으므로 다시 재생할 때 네트워크를 쓰지 않는다.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || loaded?.src !== src) return;
    const url = URL.createObjectURL(loaded.blob);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [loaded, src, playId]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 곡마다 GIF 크기가 달라 이미지 자체 크기를 그대로 써야 해서 next/image의 필수 width/height 제약을 피함
    <img
      ref={imgRef}
      src={src}
      alt="스윙 동작 예시"
      // size가 있으면 그 정사각형을 덮도록 축소해 가운데만 보이게(object-cover)
      style={size ? { width: size, height: size } : undefined}
      // 큰 GIF가 좁은 모바일 화면 밖으로 넘치지 않게만 제한
      className="h-auto max-w-[calc(100vw-1rem)] rounded-lg object-cover"
    />
  );
}

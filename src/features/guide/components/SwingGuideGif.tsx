"use client";

import { useEffect, useRef, useState } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CallTag, LyricLine, Song } from "@/features/guide/lib/types";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { getSongForVersion } from "@/features/guide/lib/song-version";

interface SwingGif {
  /** 한 장이면 반복, 여러 장이면 한 바퀴씩 번갈아 재생 */
  srcs: readonly string[];
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
// 응원 가이드(스윙을 보여주는 모드)이고 곡에 swingGif가 있을 때만 띄운다.
function showsSwingGif(
  song: Song | null,
  visibleTags: readonly CallTag[],
): boolean {
  return visibleTags.includes("swing") && !!song?.swingGif;
}

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

  const song = segment ? getSong(segment) : null;
  if (!song?.swingGif || !showsSwingGif(song, visibleTags)) return null;

  return {
    srcs: typeof song.swingGif === "string" ? [song.swingGif] : song.swingGif,
    size: song.swingGifSize,
    isSwing: runStart !== null,
    playId: play.id,
  };
}

/**
 * 현재 재생 중인 가사 줄에 swingGif 플래그가 있을 때만 나타나는 스윙 예시.
 * - screen(모바일): 화면 우측 중앙에 고정 — guide/layout.tsx에 둔다.
 * - lyrics(태블릿 이상): 가사 영역(LyricsView) 우측 — 세로 위치는 LyricsView가
 *   감싼 자리(재생 중인 줄의 윗줄 높이)를 따른다.
 */
export function SwingGuideGifOverlay({
  placement = "screen",
}: {
  placement?: "screen" | "lyrics";
}) {
  const gif = useSwingGif();
  if (!gif) return null;

  return (
    <div
      aria-hidden={!gif.isSwing}
      className={cn(
        // 가사 줄 탭(seek)을 가리지 않도록 pointer-events-none
        "pointer-events-none z-40 -translate-y-1/2 transition-opacity duration-300",
        gif.isSwing ? "opacity-100" : "opacity-0",
        placement === "screen"
          ? cn("fixed top-1/2 right-2", "tablet:hidden")
          : cn("hidden", "tablet:block"),
      )}
    >
      <SwingImage {...gif} />
    </div>
  );
}

// 애니메이션 WebP 한 바퀴 길이(ms) — 프레임(ANMF 청크)마다 적힌 재생 시간을
// 더한다. WebP가 아니거나 움직이지 않으면 0.
function getAnimatedWebpDuration(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  const fourcc = (offset: number) =>
    String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
  if (buffer.byteLength < 12 || fourcc(0) !== "RIFF" || fourcc(8) !== "WEBP") {
    return 0;
  }

  let total = 0;
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const size = view.getUint32(offset + 4, true);
    // ANMF 본문: X(3) Y(3) 폭-1(3) 높이-1(3) 재생 시간(3, ms) 플래그(1)
    if (fourcc(offset) === "ANMF" && offset + 8 + 15 <= buffer.byteLength) {
      const at = offset + 8 + 12;
      total +=
        view.getUint8(at) |
        (view.getUint8(at + 1) << 8) |
        (view.getUint8(at + 2) << 16);
    }
    offset += 8 + size + (size % 2); // 청크는 짝수 바이트로 채워진다
  }
  return total;
}

interface LoadedGif {
  blob: Blob;
  duration: number;
}

function SwingImage({
  srcs,
  size,
  playId,
}: Pick<SwingGif, "srcs" | "size" | "playId">) {
  const imgRef = useRef<HTMLImageElement>(null);
  const srcKey = srcs.join("|");
  const [loaded, setLoaded] = useState<{
    key: string;
    gifs: LoadedGif[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      srcKey.split("|").map(async (src) => {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`${src}: ${response.status}`);
        const blob = await response.blob();
        return {
          blob,
          duration: getAnimatedWebpDuration(await blob.arrayBuffer()),
        };
      }),
    )
      .then((gifs) => {
        if (!cancelled) setLoaded({ key: srcKey, gifs });
      })
      // 못 받아오면 첫 번째 src로 그냥 반복 재생된다(다시 재생·번갈아 재생만 안 됨).
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [srcKey]);

  // 다시 재생할 때(playId가 바뀌면)는 항상 첫 번째 GIF부터.
  const [turn, setTurn] = useState({ playId, index: 0 });
  if (turn.playId !== playId) setTurn({ playId, index: 0 });

  // 애니메이션 이미지는 같은 주소로는 브라우저가 이어서 재생해 버려서(브라우저
  // 마다 동작도 다름), 받아둔 파일로 매번 새 주소(blob URL)를 만들어 갈아
  // 끼운다 — 새 주소의 이미지는 항상 첫 프레임부터 시작한다. 파일은 한 번만
  // 받으므로 다시 재생할 때 네트워크를 쓰지 않는다. 여러 장이면 지금 장이 한
  // 바퀴 끝나는 시점에 다음 장으로 넘긴다.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || loaded?.key !== srcKey) return;
    const gif = loaded.gifs[turn.index % loaded.gifs.length];
    const url = URL.createObjectURL(gif.blob);
    img.src = url;
    const timer =
      loaded.gifs.length > 1 && gif.duration > 0
        ? setTimeout(
            () =>
              setTurn((current) => ({
                ...current,
                index: (current.index + 1) % loaded.gifs.length,
              })),
            gif.duration,
          )
        : undefined;
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [loaded, srcKey, playId, turn.index]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 곡마다 GIF 크기가 달라 이미지 자체 크기를 그대로 써야 해서 next/image의 필수 width/height 제약을 피함
    <img
      ref={imgRef}
      src={srcs[0]}
      alt="스윙 동작 예시"
      // size가 있으면 그 정사각형을 덮도록 축소해 가운데만 보이게(object-cover)
      style={size ? { width: size, height: size } : undefined}
      // 큰 GIF가 좁은 모바일 화면 밖으로 넘치지 않게만 제한
      className="h-auto max-w-[calc(100vw-1rem)] rounded-lg object-cover"
    />
  );
}

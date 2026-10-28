"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CallTag, LyricLine, Song } from "@/features/guide/lib/types";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getActiveLineIndex } from "@/features/guide/lib/lyric-sync";
import { getSongForVersion } from "@/features/guide/lib/song-version";
import { GIF_SQUARE_CLASS } from "@/features/guide/lib/player-layout";

interface SwingGif {
  /** 한 장이면 반복, 여러 장이면 한 바퀴씩 번갈아 재생 */
  srcs: readonly string[];
  /** 정사각형 한 변(가운데만 보이게 자름) */
  size?: number;
  /** 원본 비율 그대로 보일 때의 모바일 표시 폭 */
  width?: number;
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
    width: song.swingGifWidth,
    isSwing: runStart !== null,
    playId: play.id,
  };
}

// swingGif 구간이 끝난 뒤 GIF를 더 보여 주는 시간.
const LINGER_MS = 500;

/** active가 꺼진 뒤에도 ms 동안 true를 유지한다(다시 켜지면 그대로 true). */
function useLinger(active: boolean, ms: number): boolean {
  const [wasActive, setWasActive] = useState(active);
  // 꺼질 때마다 번호를 올려, 연달아 꺼져도 타이머가 매번 새로 돈다.
  const [offCount, setOffCount] = useState(0);
  const [lingering, setLingering] = useState(false);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) {
      setOffCount((count) => count + 1);
      setLingering(true);
    }
  }

  useEffect(() => {
    if (offCount === 0) return;
    const timer = setTimeout(() => setLingering(false), ms);
    return () => clearTimeout(timer);
  }, [offCount, ms]);

  return active || lingering;
}

// 나타날 땐 빨리, 사라질 땐 천천히 흐려진다.
function fadeClass(isShown: boolean): string {
  return isShown ? "opacity-100 duration-150" : "opacity-0 duration-300";
}

/**
 * 모바일: 현재 재생 중인 가사 줄에 swingGif 플래그가 있을 때만 화면 우측
 * 중앙에 고정으로 나타나는 스윙 예시(guide/layout.tsx에 둔다). 태블릿 이상은
 * 영상 아래 SwingGuideGifSlot. 구간이 끝나도 LINGER_MS만큼 더 남겼다가
 * 사라진다 — 점프 줄 하나만 표시된 곡(동창회 등)은 GIF가 한 바퀴(약 2초)
 * 돌자마자 꺼져 순식간에 사라져 보였다.
 */
export function SwingGuideGifOverlay() {
  const gif = useSwingGif();
  const isShown = useLinger(!!gif?.isSwing, LINGER_MS);
  if (!gif) return null;

  return (
    <div
      aria-hidden={!isShown}
      className={cn(
        // 가사 줄 탭(seek)을 가리지 않도록 pointer-events-none
        "pointer-events-none fixed top-1/2 right-2 z-40 -translate-y-1/2 transition-opacity",
        fadeClass(isShown),
        "tablet:hidden",
      )}
    >
      <SwingImage {...gif} />
    </div>
  );
}

/**
 * 태블릿 이상: 영상 아래 응원 표시 안내·곡 설명 오른쪽의 "동작 예시" 칸. 자리는
 * 늘 있고, GIF는 swingGif 구간(+ LINGER_MS)에서만 보인다. 곡에 GIF가 없으면
 * 점선 테두리에 "GIF 없음". 스윙을 보여주지 않는 모드(슬램 가이드)에선 칸 자체가
 * 없다.
 */
export function SwingGuideGifSlot({ className }: { className?: string }) {
  const { visibleTags } = useGuideMode();
  const gif = useSwingGif();
  const isShown = useLinger(!!gif?.isSwing, LINGER_MS);
  if (!visibleTags.includes("swing")) return null;

  return (
    <section
      aria-label="동작 예시 GIF"
      className={cn(
        "flex shrink-0 flex-col gap-2 rounded-lg border bg-black/40 p-3 backdrop-blur-sm",
        gif ? "border-white/10" : "border-dashed border-white/25",
        className,
      )}
    >
      <h3 className="text-sm font-bold tracking-wide text-white/70">
        동작 예시
      </h3>
      {/* 폭은 화면 폭·영상 아래 남는 높이에 맞춘다(스크롤이 생기지 않게).
          GIF가 원본 비율(swingGifWidth)이면 칸 높이가 그 비율을 따르고 —
          정사각형보다 낮아서 넘치지 않는다 — 아니면 정사각형. */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-md bg-white/5",
          GIF_SQUARE_CLASS,
          !gif?.width && "aspect-square",
        )}
      >
        {gif ? (
          <>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center px-2 text-center text-xs break-keep text-white/45 transition-opacity",
                isShown ? "opacity-0" : "opacity-100",
              )}
            >
              해당 구간에서 재생돼요
            </span>
            <div
              aria-hidden={!isShown}
              className={cn(
                // 원본 비율이면 이미지가 흐름 안에서 칸 높이를 정한다.
                gif.width ? "w-full" : "absolute inset-0",
                "transition-opacity",
                fadeClass(isShown),
              )}
            >
              <SwingImage {...gif} fill />
            </div>
          </>
        ) : (
          <span className="text-sm text-white/45">GIF 없음</span>
        )}
      </div>
    </section>
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
  width,
  playId,
  fill = false,
}: Pick<SwingGif, "srcs" | "size" | "width" | "playId"> & {
  /** 감싼 칸 폭을 꽉 채운다 — 태블릿 이상 SwingGuideGifSlot */
  fill?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  // 기준 폭 — 정사각형 한 변(size), 원본 비율 표시 폭(width), 둘 다 없으면 파일
  // 자체 폭(불러온 뒤에 안다).
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const baseWidth = size ?? width ?? naturalWidth;
  // 정사각형으로 자르는지 — 원본 비율(width)로 지정하면 자르지 않는다.
  const isSquare = !width;
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
      onLoad={(event) => setNaturalWidth(event.currentTarget.naturalWidth)}
      style={
        !fill && baseWidth
          ? ({ "--gif-width": `${baseWidth}px` } as CSSProperties)
          : undefined
      }
      className={cn(
        "rounded-lg object-cover",
        fill
          ? // 정사각형 칸이면 칸을 덮도록 가운데만, 원본 비율이면 폭만 맞추고 높이는 비율대로.
            cn("w-full", isSquare ? "h-full" : "h-auto")
          : cn(
              // 큰 GIF가 좁은 모바일 화면 밖으로 넘치지 않게만 제한
              "max-w-[calc(100vw-1rem)]",
              // size가 있으면 그 정사각형을 덮도록 줄여 가운데만 보이게
              size ? "aspect-square" : "h-auto",
              baseWidth && "w-(--gif-width)",
            ),
      )}
    />
  );
}

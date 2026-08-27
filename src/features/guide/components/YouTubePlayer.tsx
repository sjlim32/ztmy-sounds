"use client";

import { useEffect, useRef, useState } from "react";
import { getSong } from "@/features/guide/data/songs";
import { usePlayer } from "@/features/guide/player-context";

interface YTPlayer {
  getCurrentTime: () => number;
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTStateChangeEvent extends YTPlayerEvent {
  data: number;
}

interface YTPlayerOptions {
  videoId?: string;
  width?: string;
  height?: string;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTStateChangeEvent) => void;
  };
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: YTPlayerOptions,
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
const TIME_POLL_INTERVAL_MS = 250;

function loadIframeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      document.head.appendChild(script);
    }
  });
}

/**
 * Mounts a single, persistent YouTube player instance and wires it into
 * PlayerContext. Meant to live in `guide/layout.tsx` so it survives
 * client-side navigation between `/guide/[songId]` routes.
 */
export function YouTubePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  // YT.Player 객체는 생성 즉시 존재하지만, getCurrentTime/loadVideoById 같은
  // 실제 메서드는 onReady가 fire하기 전까지 붙지 않습니다. 아래 setInterval은
  // 오래 살아있는 클로저라, state가 아니라 ref를 써야 항상 최신 값을 읽습니다.
  const isReadyRef = useRef(false);
  const loadedSongIdRef = useRef<string | null>(null);
  const { activeSongId, setPlaying, setCurrentTime, registerApi } = usePlayer();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    // 유튜브 API가 이 엘리먼트를 직접 DOM 조작으로 <iframe>으로 바꿔치기합니다.
    // React가 이 노드를 직접 렌더링/추적하면 이 교체 때문에 React의 가상 DOM과
    // 실제 DOM이 어긋나서, 다음 리컨사일(예: 라우트 이동) 시 insertBefore
    // 에러로 죽습니다. JSX 바깥에서 만들어야 React의 diffing에 안 걸립니다.
    const mountEl = document.createElement("div");
    containerRef.current?.appendChild(mountEl);

    loadIframeApi().then(() => {
      if (cancelled) return;

      playerRef.current = new window.YT!.Player(mountEl, {
        width: "960",
        height: "540",
        events: {
          onReady: () => {
            isReadyRef.current = true;
            setIsReady(true);
            registerApi({
              seekTo: (seconds) => playerRef.current?.seekTo(seconds, true),
              play: () => playerRef.current?.playVideo(),
              pause: () => playerRef.current?.pauseVideo(),
            });
          },
          onStateChange: (event) => {
            setPlaying(event.data === window.YT?.PlayerState.PLAYING);
          },
        },
      });

      pollId = setInterval(() => {
        if (!isReadyRef.current) return;
        const time = playerRef.current?.getCurrentTime();
        if (typeof time === "number") {
          setCurrentTime(time);
        }
      }, TIME_POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(pollId);
      isReadyRef.current = false;
      registerApi(null);
      playerRef.current?.destroy();
      playerRef.current = null;
      mountEl.remove();
    };
    // Mounted once; the player instance itself is reused across song changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSongId || !isReady || !playerRef.current) return;
    if (loadedSongIdRef.current === activeSongId) return;

    const song = getSong(activeSongId);
    if (!song) return;

    playerRef.current.loadVideoById(song.youtubeId);
    loadedSongIdRef.current = activeSongId;
    // activeSongId가 플레이어 초기화 완료 전에 이미 세팅돼 있었더라도,
    // isReady가 true로 바뀌는 순간 다시 실행됩니다.
  }, [activeSongId, isReady]);

  useEffect(() => {
    // 뒤로가기 등으로 목록 화면으로 돌아가 activeSongId가 비면 재생을 멈춥니다.
    if (!isReady || activeSongId) return;
    playerRef.current?.pauseVideo();
  }, [activeSongId, isReady]);

  return (
    <div
      ref={containerRef}
      className="tablet:w-[min(90%,calc((100dvh-4rem)*16/9))] aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full"
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import { getSong } from "@/data/songs";
import { usePlayer } from "@/context/player-context";

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
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTStateChangeEvent) => void;
  };
}

interface YTNamespace {
  Player: new (element: HTMLElement | string, options: YTPlayerOptions) => YTPlayer;
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
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedSongIdRef = useRef<string | null>(null);
  const { activeSongId, setPlaying, setCurrentTime, registerApi } = usePlayer();

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    loadIframeApi().then(() => {
      if (cancelled || !mountRef.current) return;

      playerRef.current = new window.YT!.Player(mountRef.current, {
        events: {
          onReady: () => {
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
        const time = playerRef.current?.getCurrentTime();
        if (typeof time === "number") {
          setCurrentTime(time);
        }
      }, TIME_POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(pollId);
      registerApi(null);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Mounted once; the player instance itself is reused across song changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSongId || !playerRef.current) return;
    if (loadedSongIdRef.current === activeSongId) return;

    const song = getSong(activeSongId);
    if (!song) return;

    playerRef.current.loadVideoById(song.youtubeId);
    loadedSongIdRef.current = activeSongId;
  }, [activeSongId]);

  return <div ref={mountRef} />;
}

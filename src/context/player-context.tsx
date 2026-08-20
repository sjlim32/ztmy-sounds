"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PlayerApi {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

interface PlayerContextValue {
  activeSongId: string | null;
  isPlaying: boolean;
  currentTime: number;
  setActiveSongId: (songId: string | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (seconds: number) => void;
  /** Registered by YouTubePlayer once the underlying player is ready. */
  registerApi: (api: PlayerApi | null) => void;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const apiRef = useRef<PlayerApi | null>(null);

  const registerApi = useCallback((api: PlayerApi | null) => {
    apiRef.current = api;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    apiRef.current?.seekTo(seconds);
  }, []);

  const play = useCallback(() => {
    apiRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    apiRef.current?.pause();
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      activeSongId,
      isPlaying,
      currentTime,
      setActiveSongId,
      setPlaying,
      setCurrentTime,
      registerApi,
      seekTo,
      play,
      pause,
    }),
    [activeSongId, isPlaying, currentTime, registerApi, seekTo, play, pause]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }

  return context;
}

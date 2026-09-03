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
import type { SongVersion } from "@/features/guide/lib/song-version";

interface PlayerApi {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

interface PlayerContextValue {
  activeSongId: string | null;
  songVersion: SongVersion;
  isPlaying: boolean;
  currentTime: number;
  setActiveSongId: (songId: string | null) => void;
  setSongVersion: (version: SongVersion) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (seconds: number) => void;

  /** 유튜브 플레이어가 준비되면 YouTubePlayer가 이 함수로 API를 등록합니다. */
  registerApi: (api: PlayerApi | null) => void;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [activeSongId, setActiveSongIdState] = useState<string | null>(null);
  const [songVersion, setSongVersion] = useState<SongVersion>("live");
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const apiRef = useRef<PlayerApi | null>(null);

  // 곡이 바뀌면 이전 곡에서 골랐던 음원/라이브 선택이 새 곡에 그대로 이어지지
  // 않도록 항상 라이브(기본값)로 되돌립니다.
  const setActiveSongId = useCallback((songId: string | null) => {
    setActiveSongIdState(songId);
    setSongVersion("live");
  }, []);

  const registerApi = useCallback((api: PlayerApi | null) => {
    apiRef.current = api;
  }, []);

  // 가사 클릭으로 이동 후 (seekTo) 재생을 함께 시작합니다.
  const seekTo = useCallback((seconds: number) => {
    apiRef.current?.seekTo(seconds);
    apiRef.current?.play();
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
      songVersion,
      isPlaying,
      currentTime,
      setActiveSongId,
      setSongVersion,
      setPlaying,
      setCurrentTime,
      registerApi,
      seekTo,
      play,
      pause,
    }),
    [
      activeSongId,
      songVersion,
      isPlaying,
      currentTime,
      setActiveSongId,
      registerApi,
      seekTo,
      play,
      pause,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer()는 <PlayerProvider> 내부에서만 사용할 수 있습니다. " +
        "src/app/guide/layout.tsx에서 이 컴포넌트가 <PlayerProvider>로 감싸져 있는지 확인하세요.",
    );
  }

  return context;
}

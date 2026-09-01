"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { songList } from "@/features/guide/data/songs";
import type { CallTag, Song } from "@/features/guide/lib/types";
import { getSongsWithTag } from "@/features/guide/lib/song-call-tags";

export type GuideMode = "cheer" | "slam";

const MODE_CONFIG: Record<
  GuideMode,
  {
    basePath: string;
    visibleTags: readonly CallTag[];
    label: { eyebrow: string; title: string };
  }
> = {
  cheer: {
    basePath: "/guide",
    visibleTags: ["swing", "clap", "call"],
    label: { eyebrow: "Guide", title: "응원 가이드" },
  },
  slam: {
    basePath: "/slam",
    visibleTags: ["slam"],
    label: { eyebrow: "Slam", title: "슬램 가이드" },
  },
};

interface GuideModeContextValue {
  mode: GuideMode;
  basePath: string;
  visibleTags: readonly CallTag[];
  label: { eyebrow: string; title: string };
  songs: Song[];
}

const GuideModeContext = createContext<GuideModeContextValue | null>(null);

/**
 * 응원 가이드(/guide)와 슬램 가이드(/slam)는 영상 재생·가사 스크롤 UI를
 * 그대로 공유하되, "어떤 응원 태그를 강조할지"와 "어떤 곡 목록을 보여줄지"만
 * 다릅니다. 이 값들은 재생 중(currentTime 등)에는 절대 바뀌지 않는
 * 정적 설정이라, 빠르게 갱신되는 PlayerContext와 분리했습니다 — 같이 두면
 * LyricLine의 memo가 재생 중 매 tick마다 무력화됩니다.
 */
export function GuideModeProvider({
  mode,
  children,
}: {
  mode: GuideMode;
  children: ReactNode;
}) {
  const value = useMemo<GuideModeContextValue>(() => {
    const { basePath, visibleTags, label } = MODE_CONFIG[mode];
    const songs =
      mode === "cheer" ? songList : getSongsWithTag("slam", songList);
    return { mode, basePath, visibleTags, label, songs };
  }, [mode]);

  return (
    <GuideModeContext.Provider value={value}>
      {children}
    </GuideModeContext.Provider>
  );
}

export function useGuideMode(): GuideModeContextValue {
  const context = useContext(GuideModeContext);

  if (!context) {
    throw new Error(
      "useGuideMode()는 <GuideModeProvider> 내부에서만 사용할 수 있습니다.",
    );
  }

  return context;
}

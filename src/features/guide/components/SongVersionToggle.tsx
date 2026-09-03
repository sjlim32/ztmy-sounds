"use client";

import { cn } from "@/lib/utils";
import { usePlayer } from "@/features/guide/player-context";
import {
  hasOriginVersion,
  type SongVersion,
} from "@/features/guide/lib/song-version";

const VERSION_OPTIONS: { value: SongVersion; label: string }[] = [
  { value: "studio", label: "음원버전" },
  { value: "live", label: "라이브버전" },
];

/** origin 폴더에 같은 곡(같은 번호) 데이터가 있을 때만 렌더링되는 음원/라이브 전환 버튼. */
export function SongVersionToggle() {
  const { activeSongId, songVersion, setSongVersion } = usePlayer();

  if (!activeSongId || !hasOriginVersion(activeSongId)) return null;

  return (
    <div className="absolute right-0 bottom-11 flex items-center gap-0.5 rounded-full bg-black/40 p-1 backdrop-blur-sm">
      {VERSION_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setSongVersion(value)}
          aria-pressed={songVersion === value}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider transition-colors",
            songVersion === value
              ? "bg-ztmy-purple text-white"
              : "text-white/60 hover:text-white/80",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

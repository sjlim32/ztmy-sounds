"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlbumListView } from "./AlbumListView";
import { SongListView } from "./SongListView";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

type Tab = "songs" | "albums";

const tabClass =
  "hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white";
const activeTabClass = "border-ztmy-magenta/60 text-white";

export function SongDbTabs({
  songs,
  albums,
}: {
  songs: SongWithAlbums[];
  albums: AlbumWithSongs[];
}) {
  const [tab, setTab] = useState<Tab>("songs");

  return (
    <div>
      <div
        role="tablist"
        aria-label="노래 DB"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "songs"}
          onClick={() => setTab("songs")}
          className={cn(tabClass, tab === "songs" && activeTabClass)}
        >
          곡 ({songs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "albums"}
          onClick={() => setTab("albums")}
          className={cn(tabClass, tab === "albums" && activeTabClass)}
        >
          앨범 ({albums.length})
        </button>
      </div>

      <div className="mt-8">
        {tab === "songs" ? (
          <SongListView songs={songs} />
        ) : (
          <AlbumListView albums={albums} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "../components/tab-styles";
import { AlbumListView } from "./AlbumListView";
import { SongListView } from "./SongListView";
import type { AlbumWithSongs, SongWithAlbums } from "./types";

type Tab = "songs" | "albums";

export function SongDbTabs({
  songs,
  albums,
}: {
  songs: SongWithAlbums[];
  albums: AlbumWithSongs[];
}) {
  const [tab, setTab] = useState<Tab>(
    songs.length === 0 && albums.length > 0 ? "albums" : "songs",
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="노래 DB"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        <button
          id="song-db-tab-songs"
          type="button"
          role="tab"
          aria-selected={tab === "songs"}
          aria-controls="song-db-panel-songs"
          onClick={() => setTab("songs")}
          className={cn(TAB_CLASS, tab === "songs" && ACTIVE_TAB_CLASS)}
        >
          곡 ({songs.length})
        </button>
        <button
          id="song-db-tab-albums"
          type="button"
          role="tab"
          aria-selected={tab === "albums"}
          aria-controls="song-db-panel-albums"
          onClick={() => setTab("albums")}
          className={cn(TAB_CLASS, tab === "albums" && ACTIVE_TAB_CLASS)}
        >
          앨범 ({albums.length})
        </button>
      </div>

      <div className="mt-8">
        {tab === "songs" ? (
          <div
            id="song-db-panel-songs"
            role="tabpanel"
            aria-labelledby="song-db-tab-songs"
          >
            <SongListView songs={songs} />
          </div>
        ) : (
          <div
            id="song-db-panel-albums"
            role="tabpanel"
            aria-labelledby="song-db-tab-albums"
          >
            <AlbumListView albums={albums} />
          </div>
        )}
      </div>
    </div>
  );
}

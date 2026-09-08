"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "../components/tab-styles";
import { AlbumListView } from "./AlbumListView";
import { SongListView } from "./SongListView";
import type { AlbumGroupBy, AlbumWithSongs, SongWithAlbums } from "./types";

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
  const [groupBy, setGroupBy] = useState<AlbumGroupBy>("type");

  return (
    <div>
      <div
        role="group"
        aria-label="정렬 필터"
        className="flex flex-wrap items-center gap-2 pb-3"
      >
        <span className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
          정렬
        </span>
        <button
          type="button"
          aria-pressed={groupBy === "type"}
          onClick={() => setGroupBy("type")}
          className={cn(TAB_CLASS, groupBy === "type" && ACTIVE_TAB_CLASS)}
        >
          타입별로 보기
        </button>
        <button
          type="button"
          aria-pressed={groupBy === "year"}
          onClick={() => setGroupBy("year")}
          className={cn(TAB_CLASS, groupBy === "year" && ACTIVE_TAB_CLASS)}
        >
          출시일순 보기
        </button>
      </div>

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
            <AlbumListView albums={albums} groupBy={groupBy} />
          </div>
        )}
      </div>
    </div>
  );
}

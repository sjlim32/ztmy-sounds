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
  const [showBookCover, setShowBookCover] = useState(false);

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

      <div
        role="group"
        aria-label="정렬 필터"
        className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
      >
        <span className="text-xs font-semibold tracking-wide text-white/70 uppercase">
          정렬
        </span>
        <div className="flex gap-1 rounded-md bg-black/30 p-1">
          <button
            type="button"
            aria-pressed={groupBy === "type"}
            onClick={() => setGroupBy("type")}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              groupBy === "type"
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/80",
            )}
          >
            타입별로 보기
          </button>
          <button
            type="button"
            aria-pressed={groupBy === "year"}
            onClick={() => setGroupBy("year")}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              groupBy === "year"
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/80",
            )}
          >
            출시일순 보기
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-xs font-semibold tracking-wide text-white/70 uppercase">
          마도서 버전 보기
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showBookCover}
          onClick={() => setShowBookCover((value) => !value)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            showBookCover ? "bg-ztmy-magenta" : "bg-white/20",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              showBookCover && "translate-x-4",
            )}
          />
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
            <AlbumListView
              albums={albums}
              groupBy={groupBy}
              showBookCover={showBookCover}
            />
          </div>
        )}
      </div>
    </div>
  );
}

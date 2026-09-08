"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AlbumWithSongs } from "./types";

const ALBUM_TYPE_LABEL: Record<string, string> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

export function AlbumListView({ albums }: { albums: AlbumWithSongs[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (albums.length === 0) {
    return <p className="text-sm text-white/50">아직 등록된 앨범이 없습니다.</p>;
  }

  return (
    <ul
      className={cn(
        "grid gap-4",
        "tablet:grid-cols-2",
      )}
    >
      {albums.map((album) => {
        const isOpen = openId === album.id;
        return (
          <li
            key={album.id}
            className="overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : album.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              {album.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={album.cover_image_url}
                  alt={album.title}
                  loading="lazy"
                  className="size-16 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="size-16 shrink-0 rounded bg-white/5" aria-hidden />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">
                  {album.album_type ? `[${ALBUM_TYPE_LABEL[album.album_type]}] ` : ""}
                  {album.title}
                </p>
                {album.title_ko && (
                  <p className="truncate text-sm text-white/50">{album.title_ko}</p>
                )}
                <p className="mt-1 font-mono text-xs text-white/40">{album.release_date}</p>
              </div>
            </button>

            {isOpen && (
              <ul className="border-t border-white/10 px-4 py-3">
                {album.songs.length === 0 ? (
                  <li className="text-sm text-white/40">수록곡 정보가 없습니다.</li>
                ) : (
                  album.songs.map((song) => (
                    <li key={song.id} className="py-1 text-sm text-white/70">
                      {song.title}
                      {song.title_ko && (
                        <span className="ml-2 text-white/40">{song.title_ko}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

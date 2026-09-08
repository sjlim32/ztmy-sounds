"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AlbumWithSongs } from "./types";

const ALBUM_TYPE_ORDER = ["full", "mini", "ep"] as const;

const ALBUM_TYPE_SECTION_LABEL: Record<string, string> = {
  full: "정규 앨범",
  mini: "미니 앨범",
  ep: "EP",
};

const ALBUM_TYPE_SHORT_LABEL: Record<string, string> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

function groupAlbumsByType(albums: AlbumWithSongs[]) {
  const groups = new Map<string, AlbumWithSongs[]>();
  for (const album of albums) {
    const key = album.album_type ?? "기타";
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(album);
    } else {
      groups.set(key, [album]);
    }
  }
  return groups;
}

export function AlbumListView({ albums }: { albums: AlbumWithSongs[] }) {
  const [selected, setSelected] = useState<AlbumWithSongs | null>(null);

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  if (albums.length === 0) {
    return (
      <p className="text-sm text-white/50">아직 등록된 앨범이 없습니다.</p>
    );
  }

  const groups = groupAlbumsByType(albums);
  const orderedTypes = [
    ...ALBUM_TYPE_ORDER.filter((type) => groups.has(type)),
    ...[...groups.keys()].filter(
      (type) => !(ALBUM_TYPE_ORDER as readonly string[]).includes(type),
    ),
  ];

  return (
    <div className="flex flex-col gap-8">
      {orderedTypes.map((type) => (
        <section key={type}>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
            {ALBUM_TYPE_SECTION_LABEL[type] ?? type}
          </p>

          <div className="mt-3 flex overflow-x-auto pt-2 pb-4">
            {(groups.get(type) ?? []).map((album, index) => (
              <button
                key={album.id}
                type="button"
                onClick={() => setSelected(album)}
                aria-label={album.title}
                style={{
                  zIndex: index,
                  marginLeft: index === 0 ? 0 : "-2.5rem",
                }}
                className={cn(
                  "relative shrink-0 transition-transform duration-200",
                  "tablet:hover:z-50 tablet:hover:-translate-y-4 tablet:hover:scale-105 tablet:hover:shadow-2xl",
                )}
              >
                {album.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    loading="lazy"
                    className={cn(
                      "h-36 w-36 rounded object-cover shadow-lg ring-1 ring-white/10",
                      "tablet:h-44 tablet:w-44",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "h-36 w-36 rounded bg-white/5 ring-1 ring-white/10",
                      "tablet:h-44 tablet:w-44",
                    )}
                  />
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "bg-ztmy-dark relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg",
              "tablet:flex-row",
            )}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="닫기"
              className="absolute top-3 right-3 z-10 text-white/60 transition-colors hover:text-white"
            >
              ✕
            </button>

            {selected.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.cover_image_url}
                alt={selected.title}
                className={cn(
                  "h-56 w-full shrink-0 object-cover",
                  "tablet:h-auto tablet:w-64",
                )}
              />
            ) : (
              <div
                className={cn(
                  "h-56 w-full shrink-0 bg-white/5",
                  "tablet:h-auto tablet:w-64",
                )}
              />
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <p className="text-lg font-semibold text-white">
                {selected.album_type
                  ? `[${ALBUM_TYPE_SHORT_LABEL[selected.album_type] ?? selected.album_type}] `
                  : ""}
                {selected.title}
              </p>
              {selected.title_ko && (
                <p className="mt-1 text-sm text-white/50">
                  {selected.title_ko}
                </p>
              )}
              <p className="mt-1 font-mono text-xs text-white/40">
                {selected.release_date}
              </p>

              <ul className="mt-4 flex flex-col gap-1">
                {selected.songs.length === 0 ? (
                  <li className="text-sm text-white/40">
                    수록곡 정보가 없습니다.
                  </li>
                ) : (
                  selected.songs.map((song) => (
                    <li key={song.id} className="text-sm text-white/70">
                      {song.title}
                      {song.title_ko && (
                        <span className="ml-2 text-white/40">
                          {song.title_ko}
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

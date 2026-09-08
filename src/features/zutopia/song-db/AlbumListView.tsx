"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ALBUM_TYPE_ORDER,
  ALBUM_TYPE_SECTION_LABEL,
  ALBUM_TYPE_SHORT_LABEL,
} from "./labels";
import type { AlbumWithSongs } from "./types";

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

function isAlbumTypeKey(
  type: string,
): type is (typeof ALBUM_TYPE_ORDER)[number] {
  return (ALBUM_TYPE_ORDER as readonly string[]).includes(type);
}

// 카드마다 살짝 다른 기울기/높이를 줘서 "서랍장에 나란히 꽂힌" 느낌을 낸다 —
// index % 3 기준으로 3가지 패턴을 순환시켜 완전히 균일하게 반복되지 않게 한다.
const SHELF_TILT = ["-rotate-2", "rotate-1", "-rotate-1"];
const SHELF_LEAN = ["translate-y-0", "-translate-y-1.5", "translate-y-1"];

function formatAlbumHoverLabel(album: AlbumWithSongs): string {
  const typeLabel = album.album_type
    ? ALBUM_TYPE_SHORT_LABEL[album.album_type]
    : null;
  const numberLabel = album.album_number ? `${album.album_number}집` : null;
  const prefix = [typeLabel, numberLabel].filter(Boolean).join(" ");
  return prefix ? `${prefix} - ${album.title}` : album.title;
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
    ...[...groups.keys()].filter((type) => !isAlbumTypeKey(type)),
  ];
  const selectedType = selected ? (selected.album_type ?? "기타") : null;

  return (
    <div className="flex flex-col gap-8">
      {orderedTypes.map((type) => {
        const isSectionOpen = selectedType === type;

        return (
          <section key={type}>
            <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
              {isAlbumTypeKey(type) ? ALBUM_TYPE_SECTION_LABEL[type] : type}
            </p>

            <div className="mt-3 flex overflow-x-auto pt-12 pr-4 pb-14">
              {(groups.get(type) ?? []).map((album, index) => {
                const isSelected = selected?.id === album.id;
                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : album)}
                    aria-expanded={isSelected}
                    aria-label={formatAlbumHoverLabel(album)}
                    style={{
                      marginLeft: index === 0 ? 0 : "-2.5rem",
                    }}
                    className={cn(
                      "group relative shrink-0",
                      "transition-[transform,filter] duration-500 ease-in-out",
                      SHELF_TILT[index % SHELF_TILT.length],
                      SHELF_LEAN[index % SHELF_LEAN.length],
                      "tablet:hover:z-50 tablet:hover:rotate-0 tablet:hover:-translate-y-6 tablet:hover:scale-110 tablet:hover:brightness-110",
                      isSelected && "z-60 rotate-0",
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
                          "transition-shadow duration-500 ease-in-out",
                          "tablet:h-44 tablet:w-44",
                          "tablet:group-hover:shadow-2xl",
                          isSelected &&
                            "ring-ztmy-magenta/70 shadow-2xl ring-2",
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

                    <span
                      className={cn(
                        "pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 translate-y-1 opacity-0",
                        "rounded-full bg-black/85 px-3 py-1 text-xs whitespace-nowrap text-white",
                        "transition-[opacity,transform] duration-300 ease-out",
                        "tablet:group-hover:translate-y-0 tablet:group-hover:opacity-100",
                      )}
                    >
                      {formatAlbumHoverLabel(album)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isSectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                {selected && isSectionOpen && (
                  <div
                    className={cn(
                      "flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/30",
                      "tablet:flex-row",
                    )}
                  >
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

                    <div className="min-w-0 flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">
                            {selected.album_type
                              ? `[${ALBUM_TYPE_SHORT_LABEL[selected.album_type]}${selected.album_number ? ` ${selected.album_number}집` : ""}] `
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
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          aria-label="닫기"
                          className="shrink-0 text-white/60 transition-colors hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

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
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

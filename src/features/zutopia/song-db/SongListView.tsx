import { cn } from "@/lib/utils";
import type { SongWithAlbums } from "./types";

const ALBUM_TYPE_LABEL: Record<string, string> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

export function SongListView({ songs }: { songs: SongWithAlbums[] }) {
  if (songs.length === 0) {
    return <p className="text-sm text-white/50">아직 등록된 곡이 없습니다.</p>;
  }

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2", "wide:grid-cols-3")}>
      {songs.map((song) => (
        <li
          key={song.id}
          className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          {song.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.cover_image_url}
              alt={song.title}
              loading="lazy"
              className="size-16 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="size-16 shrink-0 rounded bg-white/5" aria-hidden />
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">
              {song.title}
            </p>
            {song.title_ko && (
              <p className="truncate text-sm text-white/50">{song.title_ko}</p>
            )}

            {song.albums.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {song.albums.map((album) => (
                  <li
                    key={album.id}
                    className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60"
                  >
                    {album.album_type
                      ? `${ALBUM_TYPE_LABEL[album.album_type]} · `
                      : ""}
                    {album.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

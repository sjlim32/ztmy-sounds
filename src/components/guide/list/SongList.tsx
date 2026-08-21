import Link from "next/link";
import clsx from "clsx";
import { songList } from "@/data/songs";

interface SongListProps {
  selectedSongId: string | null;
  /** true가 되는 순간 위에서 아래로 펼쳐지듯 나타납니다 (/guide 최초 진입 시). */
  visible: boolean;
}

export function SongList({ selectedSongId, visible }: SongListProps) {
  return (
    <>
      <h2 className="p-2 text-center text-2xl font-bold text-gray-200">
        떼창 가이드
      </h2>

      <ul
        data-role="song-panel-list"
        className={clsx(
          "flex flex-col divide-y divide-white/15 overflow-y-auto transition-[max-height,background-color] duration-1000",
          selectedSongId ? "bg-transparent" : "bg-black/60",
          visible ? "max-h-[66vh]" : "max-h-0",
        )}
      >
        {songList.map((item) => {
          const isSelected = selectedSongId === item.id;
          const isCollapsed = !!selectedSongId && !isSelected;

          return (
            <li
              key={item.id}
              className={clsx(
                "overflow-hidden transition-all duration-600",
                isCollapsed ? "max-h-0 opacity-0" : "max-h-16 opacity-100",
              )}
            >
              <Link
                href={isSelected ? "/guide" : `/guide/${item.id}`}
                className={clsx(
                  "block px-4 py-3",
                  isSelected
                    ? "text-lg font-bold"
                    : "transition-colors hover:bg-white/10",
                )}
              >
                <div className="flex items-end gap-2">
                  <span>{item.title.jp}</span>
                  <span className="text-xs text-gray-300">{item.title.kr}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!selectedSongId && (
        <Link href={"/"} className="my-2 flex justify-center duration-1000">
          <div className="hover:bg-ztmy-purple/80 w-fit px-4 py-1 text-sm text-gray-300 underline transition-colors hover:text-gray-50">
            메인으로
          </div>
        </Link>
      )}
    </>
  );
}

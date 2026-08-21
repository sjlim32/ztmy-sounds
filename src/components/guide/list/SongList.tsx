import Link from "next/link";
import clsx from "clsx";
import { songList } from "@/data/songs";

interface SongListProps {
  selectedSongId: string | null;
  visible: boolean; // true가 되는 순간 위에서 아래로 펼쳐지듯 나타납니다 (/guide 최초 진입 시)
}

export function SongList({ selectedSongId, visible }: SongListProps) {
  return (
    <>
      <h2
        className={clsx(
          "tablet:block hidden overflow-hidden p-2 text-center text-2xl font-bold text-gray-200 transition-all duration-300",
          selectedSongId ? "max-h-0 opacity-0" : "max-h-16 opacity-100",
        )}
      >
        응원 가이드
      </h2>

      <ul
        data-role="song-panel-list"
        className={clsx(
          "flex flex-col divide-y divide-white/15 overflow-y-auto transition-[max-height,background-color] duration-1000",
          selectedSongId ? "bg-transparent" : "tablet:bg-black/60",
          visible ? "tablet:max-h-[66vh] max-h-dvh" : "max-h-0",
          visible && !selectedSongId && "tablet:flex-none flex-1",
          "tablet:order-0 order-1",
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
                // divide-y가 만드는 border는 max-h-0으로도 안 없어져서(테두리는
                // 콘텐츠 높이와 무관하게 그려짐) 접혔을 때 직접 0으로 제거.
                isCollapsed
                  ? "max-h-0 border-t-0! border-b-0! opacity-0"
                  : "max-h-16 opacity-100",
              )}
            >
              <Link
                href={isSelected ? "/guide" : `/guide/${item.id}`}
                className={clsx(
                  "group hover:text-ztmy-pink tablet:py-3 block px-4 py-2 transition-colors",
                  isSelected && "hover:bg-ztmy-purple/10",
                )}
              >
                <div className="flex items-end gap-2">
                  <span className={clsx(isSelected && "font-bold")}>
                    {item.title.jp}
                  </span>
                  <span className="group-hover:text-ztmy-pink/60 mb-0.5 text-xs text-gray-400 transition-colors">
                    {item.title.kr}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!selectedSongId && (
        <Link
          href={"/"}
          className="tablet:flex mx-auto my-2 hidden justify-center duration-1000"
        >
          <div className="hover:bg-ztmy-purple px-2 py-1 text-xs text-gray-300 transition-colors hover:text-gray-50 hover:underline">
            메인으로
          </div>
        </Link>
      )}
    </>
  );
}

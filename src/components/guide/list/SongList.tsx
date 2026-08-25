import Link from "next/link";
import clsx from "clsx";
import { songList } from "@/data/songs";
import { HomeIcon } from "@/components/icons/HomeIcon";

interface SongListProps {
  selectedSongId: string | null;
  visible: boolean; // true가 되는 순간 위에서 아래로 펼쳐지듯 나타납니다 (/guide 최초 진입 시)
}

export function SongList({ selectedSongId, visible }: SongListProps) {
  return (
    <>
      <h2
        className={clsx(
          "hidden shrink-0 items-center justify-center gap-2 overflow-hidden p-2 transition-all duration-300",
          "tablet:flex",
          selectedSongId ? "max-h-0 opacity-0" : "max-h-16 opacity-100",
        )}
      >
        <span className="text-xl font-bold tracking-wide text-gray-100">
          응원 가이드
        </span>
      </h2>

      <ul
        data-role="song-panel-list"
        className={clsx(
          "order-1 flex max-h-dvh flex-col divide-y divide-white/15 overflow-y-auto transition-[opacity,background-color] duration-1000",
          // 곡 하나 높이(49px) * 8 — PC에서는 뷰포트 높이와 무관하게 항상
          // 최대 8곡까지만 보이고 나머지는 스크롤.
          "tablet:order-0 tablet:max-h-102",
          // 스크롤바는 기본적으로 투명하게 숨겨뒀다가, 리스트에 마우스를
          // 올렸을 때만 반투명하게 드러남(파이어폭스/웹킷 둘 다 대응).
          "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
          selectedSongId ? "bg-transparent" : "tablet:bg-black/60",
          !selectedSongId && "flex-1",
          // flex-none(flex:0 0 auto)이면 shrink도 0이 돼서, 화면이 짧아
          // h2+목록이 패널 높이(40vh)를 넘칠 때 아무도 줄어들지 않고 부모
          // 박스 밖으로(=Footer 위로) 넘쳐버립니다. shrink만 1로 켜서
          // 평소엔 콘텐츠 높이만큼(안 늘어남), 공간이 부족할 때만 줄어들게.
          !selectedSongId && "tablet:flex-[0_1_auto]",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {songList.map((item) => {
          const isSelected = selectedSongId === item.id;
          const isCollapsed = !!selectedSongId && !isSelected;

          return (
            <li
              key={item.id}
              className={clsx(
                "shrink-0 overflow-hidden transition-all duration-600",
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
                  "group relative block px-4 py-2 transition-colors",
                  "hover:text-ztmy-magenta/80 tablet:py-3",
                  isSelected && "hover:bg-ztmy-purple/10",
                )}
              >
                {/* 지금 보고 있는 곡을 표시하는 좌측 액센트 바. 선택 시 항상,
                    그 외에는 hover 시에만 나타남 (사이트 그라데이션 시그니처). */}
                <span
                  className={clsx(
                    "from-ztmy-pink to-ztmy-purple absolute inset-y-1 left-0 w-1 origin-top scale-y-0 bg-linear-to-b transition-transform duration-300",
                    isSelected ? "scale-y-100" : "group-hover:scale-y-100",
                  )}
                />

                <div className="flex items-end gap-2">
                  <span className={clsx(isSelected && "font-bold")}>
                    {item.title.jp}
                  </span>
                  <span className="mb-0.5 text-xs text-gray-400 transition-colors group-hover:font-bold group-hover:text-white">
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
          className={clsx(
            "group mx-auto my-2 hidden items-center gap-1.5 text-xs text-gray-400 transition-colors hover:font-semibold hover:text-white",
            "tablet:flex",
          )}
        >
          <HomeIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          메인으로
        </Link>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CallIcon } from "@/features/guide/components/CallIcon";
import { getCachedSongCallTags } from "@/features/guide/lib/song-call-tags";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { useScrollFadeMask } from "@/lib/use-scroll-fade-mask";
import {
  ACTIVE_LIST_ITEM_CLASS,
  LIST_ITEM_CLASS,
} from "@/components/button-styles";
import { SongFilterBar } from "@/features/guide/components/SongFilterBar";
import {
  EMPTY_SONG_FILTER,
  SONG_IMPORTANCE_LABEL,
  filterSongs,
  type SongFilter,
} from "@/features/guide/lib/song-filter";

interface SongListProps {
  selectedSongId: string | null;
  visible: boolean; // true가 되는 순간 위에서 아래로 펼쳐지듯 나타납니다 (/guide 최초 진입 시)
}

const wrapperStyles = cva(
  [
    "contents",
    "tablet:relative tablet:flex tablet:flex-col tablet:overflow-hidden",
    "tablet:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.5)_55%,rgba(0,0,0,0.18)_100%)] tablet:backdrop-blur-xs",
  ],
  {
    variants: {
      // 좌우 여백은 래퍼에 두지 않는다 — 곡 항목의 hover·선택 면이 패널
      // 좌우 끝까지 꽉 차도록(글자 여백은 Link의 px-4). 위아래는 곡이
      // 선택되면 제목 한 줄만 남으므로 여백 없이 배경이 딱 맞게 밀착되도록.
      // 목록 패널만 모서리를 둥글게 — 곡 상세의 제목 칸은 각지게.
      compact: {
        true: "mb-3",
        false: "tablet:flex-[0_1_auto] tablet:rounded-lg tablet:py-3",
      },
    },
  },
);

const titleStyles = cva(
  [
    "hidden shrink-0 flex-col items-center gap-1 overflow-hidden transition-all duration-300",
    "tablet:flex",
  ],
  {
    variants: {
      // max-height만으로는 padding이 안 줄어들어(border-box라도 padding은
      // 찌그러들지 않고 최소 높이를 차지함) 0으로 안 접히므로 padding도
      // 함께 0으로.
      collapsed: {
        true: "max-h-0 p-0 opacity-0",
        false: "max-h-16 p-2 opacity-100",
      },
    },
  },
);

// li 자체(display:list-item)는 자식이 완전히 0/none이어도 왜인지 1px 잔여
// 높이를 유지하는 경우가 있어서(자식 collapse만으로는 안 없어짐), li의
// display 자체도 transition-discrete로 함께 애니메이션시켜 접힘이 끝나면
// 진짜 display:none이 되도록.
//
// state: browsing(선택 없음 — 위아래 같은 여백으로 hover·선택 면이 위아래
// 구분선에서 똑같이 떨어지게) / active(내가 선택된
// 항목) / collapsed(선택되지 않아 접힌 항목). divide-y는
// --tw-divide-y-reverse 기본값(0)에서 border-top이 아니라 border-bottom에
// 적용됨 — 곡이 선택되면 선택된 항목 아래에 어울리지 않는 구분선이 계속
// 남아있으므로(접힌 항목은 display:none이라 안 보이지만 선택된 항목은 계속
// 보임) active/collapsed 둘 다 제거.
const itemWrapperStyles = cva(
  // 모바일은 접힘/펼침 애니메이션 없이 바로(GuidePlayerArea와 같은 이유).
  "max-tablet:transition-none min-h-0 shrink-0 overflow-hidden transition-[display] transition-discrete duration-600",
  {
    variants: {
      state: {
        browsing: "py-1",
        // 모바일 곡 상세에선 선택된 곡 줄도 숨긴다 — 곡 제목은 상단 바에
        // 있다(MobileSongTitle). 태블릿 이상은 가사 위 제목 칸으로 남긴다.
        active: "max-tablet:hidden border-b-0!",
        collapsed: "hidden border-b-0!",
      },
    },
  },
);

// grid-template-rows 0fr만으로는 접힌 상태에서도 display가 계속 grid로
// 남아있어서(내용은 0px여도) 항목이 많으면 서브픽셀 반올림 잔여치가 눈에
// 보일 만큼 쌓임 — display도 transition-discrete로 함께 애니메이션시켜, 다
// 접힌 뒤엔 실제로 display:none이 되어 완전히 0을 보장.
const itemInnerStyles = cva(
  [
    "transition-[grid-template-rows,opacity,display] transition-discrete duration-600 ease-out",
    "max-tablet:transition-none",
    "tablet:px-0 px-2",
  ],
  {
    variants: {
      collapsed: {
        true: "hidden grid-rows-[0fr] opacity-0",
        false:
          "grid grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0",
      },
    },
  },
);

const itemTitleStyles = cva(
  "font-mkpop tablet:text-2xl text-md leading-tight transition-colors",
  {
    variants: {
      selected: {
        true: "group-hover:text-ztmy-magenta/80 text-white",
        false: "text-gray-100",
      },
    },
  },
);

export function SongList({ selectedSongId, visible }: SongListProps) {
  // tablet 이상에서는 이 ul 자체가 스크롤 컨테이너(모바일은 GuideListScroll이
  // NoticeList와 함께 전담 — 아래 className 참고).
  const listRef = useScrollFadeMask<HTMLUListElement>();
  const { mode, songs, basePath, visibleTags, label } = useGuideMode();
  // 필터는 이 레이아웃이 살아 있는 동안 유지된다 — 곡을 보고 목록으로
  // 돌아와도 고른 필터가 그대로. 곡이 선택된 상태에선 선택된 곡이 항상
  // 목록에 있어야 접힘 애니메이션이 맞으므로 필터를 적용하지 않는다.
  const [filter, setFilter] = useState<SongFilter>(EMPTY_SONG_FILTER);
  const showFilter = mode === "cheer" && !selectedSongId;
  const listedSongs = showFilter ? filterSongs(songs, filter) : songs;

  return (
    <>
      {/* 제목 + 목록을 하나의 비네트 배경으로 묶음 — tablet 미만에서는
          contents로 사라져 mobile의 order-1 흐름에 영향을 주지 않음. */}
      <div className={wrapperStyles({ compact: !!selectedSongId })}>
        <h2 className={titleStyles({ collapsed: !!selectedSongId })}>
          <span className="font-mono text-xs font-medium tracking-[0.3em] text-white/50 uppercase">
            {label.eyebrow}
          </span>
          <span className="text-xl font-bold tracking-wide text-white">
            {label.title}
          </span>
        </h2>

        {showFilter && (
          <SongFilterBar
            filter={filter}
            callTags={visibleTags}
            onChange={setFilter}
            className="tablet:order-0 order-1 shrink-0"
          />
        )}

        <ul
          ref={listRef}
          data-role="song-panel-list"
          className={cn(
            // 모바일: 자체 스크롤 없이 그냥 콘텐츠 높이만큼 — 스크롤은
            // GuideListScroll이 NoticeList와 함께 하나로 전담.
            "order-1 flex flex-col divide-y divide-white/10 transition-opacity duration-1000",
            // tablet 이상에서는 부모(위 비네트 래퍼)가 준 높이를 그대로 채우고,
            // 넘치는 곡은 이 ul 자체가 스크롤.
            "tablet:order-0 tablet:max-h-full tablet:overflow-y-auto",
            // 스크롤바는 기본적으로 투명하게 숨겨뒀다가, 리스트에 마우스를
            // 올렸을 때만 반투명하게 드러남(파이어폭스/웹킷 둘 다 대응).
            "tablet:scrollbar-thin tablet:[scrollbar-color:transparent_transparent] tablet:hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
            "tablet:[&::-webkit-scrollbar]:w-1.5 tablet:[&::-webkit-scrollbar-thumb]:rounded-full tablet:[&::-webkit-scrollbar-thumb]:bg-transparent tablet:hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
            // 목록 화면: 오른쪽 스크롤바 자리만큼 왼쪽에도 같은 폭을 비워 좌우
            // 여백을 맞춘다. 곡 상세(제목 한 칸)엔 스크롤이 없어서 비우지 않는다 —
            // 비우면 제목 칸이 아래 가사 영역보다 좁아진다.
            !selectedSongId &&
              "tablet:flex-1 tablet:[scrollbar-gutter:stable_both-edges]",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {listedSongs.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-white/50">
              조건에 맞는 곡이 없어요
            </li>
          )}
          {listedSongs.map((item) => {
            const isSelected = selectedSongId === item.id;
            const isCollapsed = !!selectedSongId && !isSelected;
            const itemState = isCollapsed
              ? "collapsed"
              : isSelected
                ? "active"
                : "browsing";

            return (
              <li
                key={item.id}
                className={itemWrapperStyles({ state: itemState })}
              >
                <div className={itemInnerStyles({ collapsed: isCollapsed })}>
                  <div className="overflow-hidden">
                    <Link
                      href={isSelected ? basePath : `${basePath}/${item.id}`}
                      // 선택·hover는 한쪽 막대 대신 칸 전체의 옅은 면으로 표시(모서리 없이)
                      className={cn(
                        LIST_ITEM_CLASS,
                        "group relative block rounded-none px-4",
                        "tablet:py-2",
                        // 곡 상세의 제목 칸: 위아래를 살짝 더 띄운다.
                        isSelected &&
                          cn(ACTIVE_LIST_ITEM_CLASS, "py-2", "tablet:py-3"),
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={itemTitleStyles({
                              selected: isSelected,
                            })}
                          >
                            {item.title.jp}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm leading-tight text-gray-400 transition-colors group-hover:text-white">
                            {item.title.kr}
                            {item.importance && (
                              <span
                                className={cn(
                                  // 글꼴의 글자가 아래로 치우쳐 보여서, 높이를
                                  // 19px로 고정하고 아래만 1px 띄워 글자를
                                  // 배지 세로 가운데에 맞춘다(실측 차이 0.5px 이내).
                                  "inline-flex h-4.75 items-center rounded px-1.5 pb-px text-xs leading-none font-bold",
                                  item.importance === "essential"
                                    ? "bg-ztmy-magenta/30 text-ztmy-pink"
                                    : "bg-white/10 text-white/70",
                                )}
                              >
                                {SONG_IMPORTANCE_LABEL[item.importance]}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {getCachedSongCallTags(item)
                            .filter((tag) => visibleTags.includes(tag))
                            .map((tag) => (
                              <CallIcon key={tag} name={tag} size={20} />
                            ))}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

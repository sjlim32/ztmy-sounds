"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { songList } from "@/data/songs";
import { HomeIcon } from "@/components/icons/HomeIcon";

interface SongListProps {
  selectedSongId: string | null;
  visible: boolean; // true가 되는 순간 위에서 아래로 펼쳐지듯 나타납니다 (/guide 최초 진입 시)
}

const FADE_SIZE = "20px";

const wrapperStyles = cva(
  [
    "contents",
    "tablet:relative tablet:flex tablet:flex-col tablet:overflow-hidden tablet:rounded-lg pl-3",
    "tablet:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.5)_55%,rgba(0,0,0,0.18)_100%)] tablet:backdrop-blur-xs",
  ],
  {
    variants: {
      // 좌우 여백은 래퍼가 아니라 Link 자체의 padding(tablet:px-7)으로
      // 통일 — 래퍼에 padding을 주면 li/overflow-hidden 조상이 그 바깥
      // 영역에서 Link의 호버 배경을 잘라내서(레이아웃 크기는 맞아도
      // 실제로는 안 칠해짐) 곡 선택 시 패딩 영역이 안 채워지는 문제가
      // 있었음. 위아래는 곡이 선택되면 제목 한 줄만 남으므로 여백 없이
      // 배경이 딱 맞게 밀착되도록.
      compact: {
        true: "mb-3",
        false: "tablet:flex-[0_1_auto] tablet:py-3",
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
// state: browsing(선택 없음, gap 대신 margin으로 간격) / active(내가 선택된
// 항목) / collapsed(선택되지 않아 접힌 항목). divide-y는
// --tw-divide-y-reverse 기본값(0)에서 border-top이 아니라 border-bottom에
// 적용됨 — 곡이 선택되면 선택된 항목 아래에 어울리지 않는 구분선이 계속
// 남아있으므로(접힌 항목은 display:none이라 안 보이지만 선택된 항목은 계속
// 보임) active/collapsed 둘 다 제거.
const itemWrapperStyles = cva(
  "min-h-0 shrink-0 overflow-hidden transition-[display] transition-discrete duration-600",
  {
    variants: {
      state: {
        browsing: "mt-1",
        active: "border-b-0!",
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

// 지금 보고 있는 곡을 표시하는 좌측 액센트 바. 선택 시 항상, 그 외에는
// hover 시에만 나타남 (사이트 그라데이션 시그니처).
const accentBarStyles = cva(
  "from-ztmy-pink to-ztmy-purple absolute inset-y-1 left-0 w-1 origin-top scale-y-0 rounded-full bg-linear-to-b transition-transform duration-300",
  {
    variants: {
      selected: {
        true: "scale-y-100",
        false: "group-hover:scale-y-100",
      },
    },
  },
);

const itemTitleStyles = cva(
  "font-mkpop tablet:text-2xl text-xl leading-tight transition-colors",
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
  const listRef = useRef<HTMLUListElement>(null);

  // 스크롤이 위/아래 끝에 닿으면 그쪽 페이드를 꺼서(불투명 처리) "여기가
  // 끝"임을 보여주고, 끝이 아니면 투명하게 페이드시켜 "더 있음"을 암시.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateFade = () => {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      el.style.maskImage = `linear-gradient(to bottom, ${atTop ? "black" : "transparent"}, black ${FADE_SIZE}, black calc(100% - ${FADE_SIZE}), ${atBottom ? "black" : "transparent"})`;
    };

    updateFade();
    el.addEventListener("scroll", updateFade);
    const resizeObserver = new ResizeObserver(updateFade);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFade);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* 제목 + 목록을 하나의 비네트 배경으로 묶음 — tablet 미만에서는
          contents로 사라져 mobile의 order-1 흐름에 영향을 주지 않음. */}
      <div className={wrapperStyles({ compact: !!selectedSongId })}>
        <h2 className={titleStyles({ collapsed: !!selectedSongId })}>
          <span className="font-mono text-[10px] font-medium tracking-[0.3em] text-white/40 uppercase">
            Guide
          </span>
          <span className="text-xl font-bold tracking-wide text-white">
            응원 가이드
          </span>
        </h2>

        <ul
          ref={listRef}
          data-role="song-panel-list"
          className={cn(
            "order-1 flex max-h-dvh flex-col divide-y divide-white/10 overflow-y-auto transition-opacity duration-1000",
            // tablet 이상에서는 부모(위 비네트 래퍼)가 준 높이를 그대로 채우고,
            // 넘치는 곡은 스크롤.
            "tablet:order-0 tablet:max-h-full",
            // 스크롤바는 기본적으로 투명하게 숨겨뒀다가, 리스트에 마우스를
            // 올렸을 때만 반투명하게 드러남(파이어폭스/웹킷 둘 다 대응).
            "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
            !selectedSongId && "flex-1",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {songList.map((item) => {
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
                      href={isSelected ? "/guide" : `/guide/${item.id}`}
                      className="group relative block rounded-md px-4 py-2 transition-colors"
                    >
                      <span
                        className={accentBarStyles({ selected: isSelected })}
                      />

                      <div className="flex flex-col gap-0.5">
                        <span
                          className={itemTitleStyles({ selected: isSelected })}
                        >
                          {item.title.jp}
                        </span>
                        <span className="text-sm leading-tight text-gray-400 transition-colors group-hover:text-white">
                          {item.title.kr}
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {!selectedSongId && (
        <Link
          href={"/"}
          className={cn(
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

"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUS_RING } from "@/components/button-styles";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { cn } from "@/lib/utils";
import { LIVE_SURFACE_CLASS } from "@/features/zutopia/lives/surface";
import { SectionHeader } from "@/components/SectionHeader";
import { setlistSongCount } from "@/features/zutopia/lives/medley";
import { defaultComparePair } from "@/features/zutopia/lives/tour-compare";
import { defaultSelectedId } from "@/features/zutopia/lives/tour-nav";
import { TourCompare } from "@/features/zutopia/lives/TourCompare";
import { TourDateNav } from "@/features/zutopia/lives/TourDateNav";
import { TourDateTicket } from "@/features/zutopia/lives/TourDateTicket";
import {
  TourDatePanelBody,
  TourSetlistVersions,
} from "@/features/zutopia/lives/TourDateList";
import { useHashSelection } from "@/features/zutopia/lives/use-hash-selection";
import type { TourDetail } from "@/features/zutopia/lives/types";

const TEXT_BUTTON_CLASS = cn(
  "inline-flex items-center gap-1 rounded-control px-2 py-1 text-sm font-normal whitespace-nowrap text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white",
  FOCUS_RING,
);

/**
 * 투어 상세의 목록-상세 2단(DefaultTourContent) — 한 번에 고른 것 하나만 보여 읽기 쉽게.
 * - 왼쪽 "공연 일정"(TourDateNav): 맨 위 "투어 세트리스트" + 도시·날짜만 있는 고르는 목록.
 *   PC는 세로 목록(sticky), 그 미만은 위에 가로로 넘기는 밑줄 탭. "세트리스트 비교하기"
 *   (비교할 공연일이 둘 이상일 때만 → TourCompare 창)는 PC는 목록 아래, 그 미만은 제목 줄.
 * - 오른쪽: 투어 공통 세트리스트(밑줄 판 탭·도장) 또는 그날 세트리스트(제목 "공연 세트리스트"
 *   + 오른쪽 "← 공통 셋리", 카드 맨 위 보딩 티켓 띠 TourDateTicket에 날짜·도시·공연장·시각,
 *   아래 썸네일 + 목록).
 * - 고른 것은 주소 해시(use-hash-selection.ts) — 공유·뒤로 가기. 해시가 없으면 공통
 *   세트리스트, 공통이 없는 투어면 첫 공연일(tour-nav.ts defaultSelectedId). 판 탭은 여기서
 *   쥐어 날짜를 골랐다 돌아와도 그대로.
 */
export function TourOverview({ tour }: { tour: TourDetail }) {
  const { dates, setlists } = tour;
  const hasCommon = setlists.length > 0;
  const [hashId, select] = useHashSelection(dates);
  const selectedId = defaultSelectedId(hasCommon, dates, hashId);
  const [versionId, setVersionId] = useState(setlists[0]?.id ?? null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [pair, setPair] = useState<[string, string] | null>(null);
  const selected = dates.find((date) => date.id === selectedId) ?? null;

  // 목록을 내려서 고르면 오른쪽 위가 화면 밖일 수 있어, 바뀐 세트리스트의 맨 위로 맞춘다
  // (처음 그릴 땐 그대로 — 해시로 들어온 경우도 머리부터 보이게).
  const detailRef = useRef<HTMLDivElement>(null);
  const shownId = useRef(selectedId);
  useEffect(() => {
    if (shownId.current === selectedId) return;
    shownId.current = selectedId;
    const el = detailRef.current;
    if (el && el.getBoundingClientRect().top < 0)
      el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [selectedId]);

  const canCompare = defaultComparePair(dates, null) !== null;
  const compareButton = canCompare ? (
    <button
      type="button"
      onClick={() => {
        setPair(defaultComparePair(dates, selectedId));
        setCompareOpen(true);
      }}
      className={TEXT_BUTTON_CLASS}
    >
      세트리스트 비교하기
    </button>
  ) : null;

  const detail = selected ? (
    <section className="flex w-full flex-col gap-3">
      {/* 제목은 왼쪽 "투어 세트리스트"와 짝, 그날 정보(날짜·도시·공연장·시각)는 카드 맨 위
      보딩 티켓 띠(TourDateTicket)에 한 번만. */}
      <SectionHeader
        title="공연 세트리스트"
        meta={
          selected.setlist.length > 0
            ? `${setlistSongCount(selected.setlist)}곡`
            : null
        }
        action={
          hasCommon && (
            <button
              type="button"
              onClick={() => select(null)}
              className={TEXT_BUTTON_CLASS}
            >
              <ChevronLeftIcon className="size-3.5 shrink-0" />
              공통 셋리
            </button>
          )
        }
      />
      <div
        className={cn(
          LIVE_SURFACE_CLASS,
          "rounded-card flex flex-col gap-2 overflow-hidden",
        )}
      >
        <TourDateTicket date={selected} />
        <TourDatePanelBody date={selected} thumbnails heading={false} dense />
      </div>
    </section>
  ) : hasCommon ? (
    <TourSetlistVersions
      versions={setlists}
      dates={dates}
      selectedVersionId={versionId}
      onSelectVersion={setVersionId}
    />
  ) : null;

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col gap-6",
          "tablet:gap-8",
          "pc:grid pc:grid-cols-[15rem_minmax(0,1fr)] pc:items-start pc:gap-8",
        )}
      >
        {/* 일정을 길게 내려도 목록이 화면에 남게(스크롤 상자는 ZutopiaScrollArea). */}
        <section className="pc:sticky pc:top-4 flex w-full min-w-0 flex-col gap-3">
          <SectionHeader
            title="공연 일정"
            meta={`${dates.filter((date) => !date.canceled).length}회`}
            // PC 왼쪽 칸은 좁아(15rem) 비교 버튼을 목록 아래로, 그 미만은 제목 줄에.
            action={
              compareButton && (
                <span className="pc:hidden">{compareButton}</span>
              )
            }
          />
          {dates.length > 0 ? (
            <TourDateNav
              dates={dates}
              hasCommon={hasCommon}
              selectedId={selectedId}
              onSelect={select}
            />
          ) : (
            <p className="text-sm text-white/50">
              세부 공연 일정이 곧 업데이트됩니다.
            </p>
          )}
          {compareButton && (
            <div className="pc:block hidden">{compareButton}</div>
          )}
        </section>
        {detail && (
          // 고른 것이 바뀔 때마다 새로 그려 살짝 올라오며 나타난다 — 목록에서 고른 것이
          // 옆으로 "열렸다"는 느낌.
          <div
            key={selectedId ?? "common"}
            ref={detailRef}
            className="animate-content-in min-w-0 scroll-mt-4"
          >
            {detail}
          </div>
        )}
      </div>

      {pair && (
        <TourCompare
          open={compareOpen}
          dates={dates}
          pair={pair}
          onPairChange={setPair}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  );
}

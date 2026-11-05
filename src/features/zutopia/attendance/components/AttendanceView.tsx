"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SOFT_BUTTON_CLASS,
  SOFT_PRIMARY_BUTTON_CLASS,
  SOFT_PURPLE_BUTTON_CLASS,
} from "@/components/button-styles";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { Popover } from "@/components/Popover";
import { SidePanel } from "@/components/SidePanel";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { useAttendedUnits } from "@/features/zutopia/attendance/useAttendedUnits";
import {
  summarizeAttendance,
  type AttendanceSong,
} from "@/features/zutopia/attendance/summarize";
import {
  decodeAttendance,
  extractCode,
} from "@/features/zutopia/attendance/share-code";
import { ImageMaker } from "@/features/zutopia/attendance/share/ImageMaker";
import { AttendPicker } from "./AttendPicker";
import { AttendanceResult } from "./AttendanceResult";
import { SharePanel, type PendingImport } from "./SharePanel";

type Panel = "image" | "share" | null;

const TONE_CLASS = {
  plain: SOFT_BUTTON_CLASS,
  pink: SOFT_PRIMARY_BUTTON_CLASS,
  purple: SOFT_PURPLE_BUTTON_CLASS,
};
/** 열려 있는 버튼은 면을 한 단계 진하게. */
const ACTIVE_TONE_CLASS = {
  plain: "border-white/20 bg-white/15 text-white",
  pink: "border-ztmy-magenta/50 bg-ztmy-magenta/30",
  purple: "border-ztmy-purple/70 bg-ztmy-purple/40",
};

/** 현황 막대 오른쪽의 작은 버튼. chevron이면 누를 때 바로 밑에 작은 창이 열린다. */
function BarButton({
  active,
  tone = "plain",
  disabled,
  chevron = true,
  onClick,
  children,
}: {
  active: boolean;
  tone?: "plain" | "pink" | "purple";
  disabled?: boolean;
  chevron?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-popover-trigger
      aria-expanded={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        TONE_CLASS[tone],
        "tablet:flex-none tablet:gap-1.5 tablet:px-3 h-9 min-w-0 flex-auto gap-1 px-2 py-0",
        active && ACTIVE_TONE_CLASS[tone],
      )}
    >
      {children}
      {chevron && (
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform",
            active && "rotate-180",
          )}
        />
      )}
    </button>
  );
}

/**
 * 라이브 참전 기록 — 참전 기록(성불 / 성불 대기 곡 목록)이 페이지의 주인공이고,
 * 공연 체크는 "공연 체크" 버튼으로 여는 옆 창(모바일은 아래 시트)에서 한다.
 * 체크는 처음 한 번 하는 일이라 화면을 계속 차지하지 않게 꺼내 쓰는 쪽으로
 * 뒀다. 체크가 하나도 없으면(첫 방문) 체크 창이 열린 채로 시작한다.
 * 위쪽 현황 막대에 숫자와 이미지 만들기 · 공유 버튼(버튼 밑 작은 창).
 * 체크 내역은 브라우저에만 저장된다(useAttendedUnits).
 */
export function AttendanceView({
  units,
  songs,
}: {
  units: LiveUnit[];
  songs: AttendanceSong[];
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [incoming, setIncoming] = useState<PendingImport | null>(null);
  // null = 사용자가 아직 안 건드림 → 체크가 없으면 열린 채로 시작
  const [pickerChoice, setPickerChoice] = useState<boolean | null>(null);
  const { ready, attended, toggle, replaceAll } = useAttendedUnits();
  const summary = useMemo(
    () => summarizeAttendance(units, attended, songs),
    [units, attended, songs],
  );
  const pickerOpen = pickerChoice ?? (ready && attended.size === 0);
  const closePicker = useCallback(() => setPickerChoice(false), []);
  const closePanel = useCallback(() => {
    setPanel(null);
    setIncoming(null);
  }, []);
  const togglePanel = (next: Exclude<Panel, null>) =>
    setPanel((current) => (current === next ? null : next));

  // 공유 링크(#code=… 또는 ?code=…)로 들어온 경우 — 주소의 코드를 읽어 공유 창을 열고
  // 주소는 비운다. 받은 기록을 먼저 보여주려고 체크 창은 닫아 둔다.
  useEffect(() => {
    // #code=(공유 링크 기본)와 ?code=(직접 붙인 주소) 둘 다 읽는다.
    const code =
      extractCode(window.location.hash) ?? extractCode(window.location.search);
    if (!code) return;
    history.replaceState(null, "", window.location.pathname);
    const ids = decodeAttendance(code, units);
    if (!ids) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소(hash)는 브라우저에서만 읽을 수 있다(정적 HTML과 첫 렌더를 맞추려 effect에서 한 번).
    setIncoming({ ids, source: "공유 링크" });
    setPanel("share");
    setPickerChoice(false);
  }, [units]);

  const stats = [
    { label: "참전", value: summary.attendedCount, highlight: false },
    { label: "성불", value: summary.heard.length, highlight: true },
    { label: "성불 대기", value: summary.unheard.length, highlight: false },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 현황 + 버튼 — 태블릿 이상은 한 줄 막대(왼쪽 숫자, 오른쪽 버튼). 모바일은
          숫자를 따로 카드로 세우고 그 아래에 버튼을 배경 없이 한 줄로 나열한다.
          작은 창은 이 묶음 전체 폭 기준(모바일은 폭만큼 펼침). */}
      <div className="tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-5 tablet:rounded-lg tablet:border tablet:border-white/10 tablet:bg-white/5 tablet:px-4 tablet:py-2.5 relative flex flex-col gap-3">
        <dl className="tablet:flex tablet:gap-6 tablet:border-0 tablet:bg-transparent tablet:p-0 grid grid-cols-3 rounded-lg border border-white/10 bg-white/5 py-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="tablet:flex-row tablet:items-baseline tablet:gap-1.5 flex flex-col items-center gap-0.5"
            >
              <dd
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  stat.highlight ? "text-ztmy-magenta" : "text-white",
                )}
              >
                {ready ? stat.value : "–"}
              </dd>
              <dt className="text-sm text-white/60">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="tablet:ml-auto tablet:gap-2 flex gap-1.5">
          <BarButton
            tone="purple"
            active={pickerOpen}
            chevron={false}
            onClick={() => setPickerChoice(!pickerOpen)}
          >
            공연 체크
            {ready && (
              <span className="text-white/70 tabular-nums">
                {summary.attendedCount}/{units.length}
              </span>
            )}
          </BarButton>
          <BarButton
            tone="pink"
            active={panel === "image"}
            disabled={!ready || summary.heard.length === 0}
            onClick={() => togglePanel("image")}
          >
            이미지<span className="tablet:inline hidden"> 만들기</span>
          </BarButton>
          <BarButton
            active={panel === "share"}
            disabled={!ready}
            onClick={() => togglePanel("share")}
          >
            공유<span className="tablet:inline hidden"> · 불러오기</span>
          </BarButton>
        </div>

        <Popover
          open={panel === "image"}
          onClose={closePanel}
          label="참전 기록 이미지 만들기"
          className="tablet:left-auto tablet:w-96 left-0"
        >
          <ImageMaker summary={summary} />
        </Popover>
        <Popover
          open={panel === "share"}
          onClose={closePanel}
          label="공유 · 불러오기"
          className="tablet:left-auto tablet:w-[26rem] left-0"
        >
          <SharePanel
            units={units}
            attended={attended}
            ready={ready}
            onReplace={replaceAll}
            initialPending={incoming}
          />
        </Popover>
      </div>

      <AttendanceResult
        summary={summary}
        units={units}
        ready={ready}
        onOpenPicker={() => setPickerChoice(true)}
      />

      <SidePanel
        open={pickerOpen}
        title="공연 체크"
        subtitle={
          ready ? `${summary.attendedCount}/${units.length}개 체크` : undefined
        }
        onClose={closePicker}
      >
        <AttendPicker
          units={units}
          attended={attended}
          ready={ready}
          onToggle={toggle}
        />
      </SidePanel>
    </div>
  );
}

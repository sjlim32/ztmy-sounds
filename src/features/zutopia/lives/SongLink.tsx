import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import {
  LIVE_TAG_CLASS,
  LIVE_TAG_TONE,
} from "@/features/zutopia/lives/surface";
import { MicIcon } from "@/components/icons/MicIcon";
import { IconLinkButton } from "@/features/zutopia/components/IconLinkButton";

// 모든 줄이 같은 폭이라 제목 시작 위치도 맞는다. 모바일은 제목 자리를 넓히려고
// 두 자리 번호만 들어가는 폭으로 줄이고, "15-1"(투어 공통 세트리스트의 선택곡
// 자리)처럼 숫자 뒤에 붙는 게 있으면 "15" / "-1" 두 줄로 나눈다. PC는 "15-1"까지
// 한 줄에 들어가는 폭으로 고정.
const indexBadgeClass = cn(
  "w-5 shrink-0 font-mono text-xs whitespace-nowrap tabular-nums",
  "tablet:w-8",
);

const rowClass = cn(
  "flex w-full items-center gap-2 px-3 py-2.5",
  "text-sm",
  "tablet:gap-3 tablet:px-4 tablet:text-base",
);

function splitIndexLabel(label: string): [string, string] {
  const match = /^(\d+)(\D.*)$/.exec(label);
  return match ? [match[1], match[2]] : [label, ""];
}

/**
 * 세트리스트 트랙 한 줄 — 번호 + 제목 + (응원 가이드가 있으면) 우측 끝
 * 마이크 아이콘. song-db의 SongListView와 동일하게 행 자체는 텍스트이고,
 * 가이드 이동은 별도 아이콘 버튼으로 분리한다(Supabase setlists 스키마에
 * 곡별 영상 링크가 없어서, 가이드 링크가 유일한 후보다).
 * 앙코르 곡은 번호 흐름은 그대로 두고 ztmy-sun 톤 + ENCORE 태그로만 강조한다.
 * 선택곡(투어 공연일에만 있는 곡)은 앙코르와 겹쳐도 구분되도록 배경 대신
 * ztmy-sky 왼쪽 띠 + "선택곡" 태그로 강조한다.
 * 일차(dayNumber)가 지정된 곡은 "DAY 1"(분홍)·"DAY 2"(보라) 태그로 강조한다
 * (태그 모양은 surface.ts의 LIVE_TAG_CLASS — 가이드 중요도 배지와 같은 결).
 * 편곡 정보(arrange)·덧붙임 정보(info, "Short ver."·"Live debut")가 있으면 곡 제목
 * 아래에 흐린 글씨 한 줄로(여럿이면 " · "로 이어) 표시한다. 공연 속 코너
 * 이름(variation)도 같은 줄 맨 앞에 값 그대로 + " ver."(variationLabel). info가
 * "Live debut"면 그 줄 대신 제목 앞에 마젠타 "[첫 공개]", "cover"가 들어가면 하늘색
 * "[커버송]".
 */
/** 코너 이름 → 버전 표기 — 값 그대로에 " ver."를 붙인다("スパイシーズ (spices) ver."). */
export function variationLabel(variation: string): string {
  return `${variation.trim()} ver.`;
}

export function SongLink({
  href,
  index,
  dayNumber,
  showLabel,
  arrange,
  info,
  cover = false,
  variation,
  unreleased = false,
  subtitle,
  encore = false,
  selected = false,
  wrapTitle = false,
  indexLabel,
  children,
}: {
  href?: string | null;
  index: number;
  /** 번호 칸에 숫자 대신 보여줄 글자(투어 공통 세트리스트의 "15-1" 같은 자리). */
  indexLabel?: string;
  dayNumber?: number | null;
  /** 회차 이름 — 일차 태그에 이어 "DAY 1 昼の部" */
  showLabel?: string | null;
  arrange?: string | null;
  info?: string | null;
  /** 커버곡(남의 곡) — 제목 앞 [커버송](note.info에 "cover"가 있어도 같다) */
  cover?: boolean;
  /** 공연 속 코너 이름(note.variation) — 제목 아래 줄에 값 그대로 + " ver." */
  variation?: string | null;
  /** 미공개곡이면 "미공개" 태그 */
  unreleased?: boolean;
  /** 제목 아래 둘째 줄("한국어 · 영어", song-title.ts). 편곡 정보는 그 아래에 온다. */
  subtitle?: string | null;
  encore?: boolean;
  selected?: boolean;
  /** 제목을 한 줄로 자르지 않고 여러 줄로(투어 공통 세트리스트의 선택곡 후보 목록). */
  wrapTitle?: boolean;
  children: ReactNode;
}) {
  const number = indexLabel ?? String(index).padStart(2, "0");
  // "15-1" → ["15", "-1"]. 뒤에 붙는 게 없으면 suffix는 빈 문자열.
  const [numberHead, numberSuffix] = splitIndexLabel(number);
  const dayLabel = formatDayShow(dayNumber, showLabel);
  // note.info가 "Live debut"면 제목 앞 [첫 공개]로 보여 주고 아래 줄에선 뺀다.
  const isLiveDebut = !!info && /^live debut\.?$/i.test(info.trim());
  // note.info에 "cover"가 들어가면 커버곡 — 제목 앞 [커버송], 아래 줄에선 뺀다.
  const isCover = cover || (!!info && /cover/i.test(info));
  const extraInfo = isLiveDebut || (info && /cover/i.test(info)) ? null : info;

  return (
    <div
      className={cn(
        rowClass,
        encore || selected ? "text-white" : "text-white/90",
        encore && "bg-ztmy-sun/5",
        // 선택된 곡은 한쪽 막대 대신 행 전체를 옅게 칠한다
        selected && "bg-ztmy-sky/15",
      )}
    >
      <span
        className={cn(
          indexBadgeClass,
          encore && "text-ztmy-sun font-bold",
          selected && !encore && "text-ztmy-sky font-bold",
          !encore && !selected && "text-white/45",
        )}
      >
        {numberSuffix ? (
          <>
            {numberHead}
            {/* 모바일은 줄바꿈해서 번호 칸 폭을 그대로 둔다. */}
            <br className="tablet:hidden" />
            {numberSuffix}
          </>
        ) : (
          number
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* 모바일은 폭이 좁아 한 줄로 자르면 제목이 거의 안 보여서 두 줄까지 보여준다. */}
        <span
          className={
            wrapTitle
              ? "break-keep"
              : cn("line-clamp-2", "tablet:line-clamp-none tablet:truncate")
          }
        >
          {isCover && (
            <span className="text-ztmy-sky mr-1.5 text-sm font-bold whitespace-nowrap">
              [커버송]
            </span>
          )}
          {isLiveDebut && (
            <span className="text-ztmy-magenta mr-1.5 text-sm font-bold whitespace-nowrap">
              [첫 공개]
            </span>
          )}
          {children}
        </span>
        {subtitle && (
          <span className="truncate text-sm text-white/70">{subtitle}</span>
        )}
        {(variation || arrange || extraInfo) && (
          <span className="truncate text-sm text-white/55">
            {[variation && variationLabel(variation), arrange, extraInfo]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </div>
      {unreleased && (
        <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.unreleased)}>
          미공개
        </span>
      )}
      {dayLabel && (
        <span
          className={cn(
            LIVE_TAG_CLASS,
            LIVE_TAG_TONE.day[
              ((dayNumber ?? 1) - 1) % LIVE_TAG_TONE.day.length
            ],
          )}
        >
          {dayLabel}
        </span>
      )}
      {selected && (
        <span className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.selected)}>
          선택곡
        </span>
      )}
      {encore && (
        <span
          className={cn(LIVE_TAG_CLASS, LIVE_TAG_TONE.encore, "tracking-wide")}
        >
          ENCORE
        </span>
      )}
      {/* 응원 가이드가 없는 줄도 버튼 폭(28px)만큼 비워 둔다 — 그래야 선택곡·
      일차·ENCORE 배지가 줄마다 같은 자리에 선다. */}
      {href ? (
        <IconLinkButton
          href={href}
          icon={MicIcon}
          label="응원 가이드 이동"
          tone="guide"
        />
      ) : (
        <span aria-hidden className="h-7 w-7 shrink-0" />
      )}
    </div>
  );
}

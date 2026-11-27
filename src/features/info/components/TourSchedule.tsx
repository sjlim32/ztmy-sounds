import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";
import { SectionHeader } from "@/components/SectionHeader";
import {
  GHOST_BUTTON_CLASS,
  SOFT_BUTTON_CLASS,
} from "@/components/button-styles";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import {
  TOUR_MAP_URL,
  TOUR_FOOTNOTES,
} from "@/features/info/data/tour-schedule";
import { LiveTourScheduleTable } from "@/features/info/components/TourScheduleTable";

// 투어 규모 — 일정 번역본(홀별 정원수) 기준. 위 큰 숫자 셋, 아래 나머지는 구분선 목록.
const HEADLINE = [
  { label: "총 공연", value: "36", unit: "회" },
  { label: "도시", value: "23", unit: "곳" },
  { label: "총 수용 인원", value: "88,236", unit: "석", accent: true },
] as const;

const DETAILS = [
  {
    label: "정원 합계",
    value: "53,751석",
    note: "23개 홀 · 홀당 평균 2,337석",
  },
  {
    label: "최대 규모",
    value: "도쿄 가든 시어터",
    note: "6,992석 (최대 8,000명)",
    accent: true,
  },
  { label: "최소 규모", value: "나라 100년 회관", note: "1,476석 (대홀)" },
] as const;

/**
 * 공연 정보 "투어 일정" 탭 — 구역마다 카드 밖 제목 줄(SectionHeader) + 카드 하나.
 * 투어 규모는 큰 숫자 셋 + 구분선 목록 한 장, 전체 일정은 표 한 장(지도 버튼은 제목 줄
 * 오른쪽), 각주는 면 없이 흐린 글자.
 */
export function TourSchedule() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionHeader title={<h3>투어 규모</h3>} />
        <div className={cn("surface flex flex-col gap-3 p-4", "tablet:p-5")}>
          <dl className="grid grid-cols-3">
            {HEADLINE.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex min-w-0 flex-col gap-1",
                  index > 0 &&
                    cn("border-l border-white/10 pl-3", "tablet:pl-5"),
                )}
              >
                <dt className="text-sm text-white/55">{item.label}</dt>
                <dd
                  className={cn(
                    "font-mono text-2xl leading-none font-bold tabular-nums",
                    "tablet:text-3xl",
                    "accent" in item ? "text-ztmy-pink" : "text-white",
                  )}
                >
                  {item.value}
                  <span className="ml-0.5 text-sm font-medium">
                    {item.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <dl className="flex flex-col">
            {DETAILS.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-baseline justify-between gap-3 border-t border-white/10 py-2 text-sm",
                  "last:pb-0",
                )}
              >
                <dt className="shrink-0 text-white/55">{item.label}</dt>
                <dd className="flex min-w-0 flex-wrap items-baseline justify-end gap-x-2 text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      "accent" in item ? "text-ztmy-sky" : "text-white",
                    )}
                  >
                    {item.value}
                  </span>
                  <span className="font-mono text-white/50">{item.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title={<h3>전체 일정</h3>}
          action={
            <>
              <Link
                href="#tour-map"
                className={cn(GHOST_BUTTON_CLASS, "h-8 px-2")}
              >
                전체 지도
              </Link>
              <SiteLink
                href={TOUR_MAP_URL}
                className={cn(SOFT_BUTTON_CLASS, "px-2.5 py-1.5")}
              >
                <MapPinIcon className="size-4" />
                구글 지도
              </SiteLink>
            </>
          }
        />
        <div className="surface px-3 pb-1">
          <LiveTourScheduleTable showTime />
        </div>
        <div className="drop-shadow-legible-sm flex flex-col gap-1 text-xs text-white/55">
          {TOUR_FOOTNOTES.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

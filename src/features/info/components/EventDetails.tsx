import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";
import { TicketStrip } from "@/components/TicketStrip";
import { SOFT_BUTTON_CLASS } from "@/components/button-styles";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import { splitParenSuffix } from "@/lib/split-paren-suffix";
import { groupLinks } from "@/features/info/lib/group-links";
import type { InfoEvent, Url } from "@/features/info/lib/types";

// 지금 눌러야 하는 링크(티켓 신청·이동 방법) — 차분한 채움 버튼을 한 단계 작게.
// 접수 전인 링크(disabled)는 흐리게.
const BUTTON_CLASS = cn(
  SOFT_BUTTON_CLASS,
  "px-2.5 py-1.5",
  "aria-disabled:pointer-events-none aria-disabled:opacity-40",
);

// 참고용 링크(당락 확인·공식 링크) — 버튼 대신 밑줄 글자 링크로 간결하게. 모두 같은 모양
// (글자 + 끝의 새 창 표시 ↗ — SiteLink 기본), 앞에 아이콘은 두지 않는다.
const TEXT_LINK_CLASS = cn(
  "rounded-control text-sm text-white/85 underline decoration-white/30 underline-offset-4 transition-colors",
  "hover:text-white hover:decoration-white",
  "aria-disabled:pointer-events-none aria-disabled:opacity-40",
);

/**
 * 공연 정보 맨 위 포스터 아래의 공연 정보 카드 — 카드(surface) 하나에 맨 위 보딩 티켓 띠
 * (일시 · 장소 — 장소는 지도 링크, 괄호 안 "총 36공연"은 아래 줄), 아래 줄마다 라벨 + 링크
 * (줄 사이 구분선). 지금 눌러야 하는 티켓 신청·이동 방법은 버튼, 참고용인 당락 확인·공식
 * 링크는 밑줄 글자 링크. 같은 회차의 국내·해외처럼 이름이 겹치는 링크는 묶음 이름을 한 번만
 * ("1차 선행 국내 · 해외" — lib/group-links.ts). 모바일은 라벨 아래 링크, 태블릿 이상은 같은 줄.
 */
export function EventDetails({ event }: { event: InfoEvent }) {
  const { main: place, suffix: placeNote } = splitParenSuffix(event.place);
  const rows: { label: string; content: ReactNode; text?: boolean }[] = [
    event.url.ticket && {
      label: "티켓 신청",
      content: <Links items={event.url.ticket} className={BUTTON_CLASS} />,
    },
    event.url.result && {
      label: "당락 확인",
      text: true,
      content: <Links items={event.url.result} className={TEXT_LINK_CLASS} />,
    },
    event.url.sub && {
      label: "이동 방법",
      content: <Links items={event.url.sub} className={BUTTON_CLASS} />,
    },
    event.url.official && {
      label: "공식 링크",
      text: true,
      content: <Links items={event.url.official} className={TEXT_LINK_CLASS} />,
    },
  ].filter((row) => !!row);

  return (
    <div className="surface overflow-hidden">
      <TicketStrip
        cells={[
          { label: "일시", value: event.date },
          {
            label: "장소",
            value: (
              <SiteLink
                href={event.url.place}
                noIcon
                className="hover:text-ztmy-pink inline-flex items-center gap-1 transition-colors"
              >
                <MapPinIcon className="size-4 shrink-0" />
                {place}
              </SiteLink>
            ),
            title: event.place,
            sub: placeNote,
          },
        ]}
      />
      {rows.length > 0 && (
        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn(
                "flex flex-col gap-2 border-t border-white/10 px-3 py-3 first:border-t-0",
                "tablet:flex-row tablet:items-baseline tablet:gap-4 tablet:px-5",
              )}
            >
              <dt
                className={cn("shrink-0 text-sm text-white/55", "tablet:w-20")}
              >
                {row.label}
              </dt>
              <dd
                className={cn(
                  "flex flex-wrap",
                  row.text ? "gap-x-5 gap-y-1" : "gap-x-5 gap-y-2",
                )}
              >
                {row.content}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** 링크 묶음 — 묶음 이름(흐린 글자)을 한 번, 뒤에 링크들(괄호 안 글자). */
function Links({ items, className }: { items: Url[]; className: string }) {
  return groupLinks(items).map((group) => (
    <span
      key={group.links[0].href}
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
    >
      {group.title && <span className="text-white/60">{group.title}</span>}
      {group.links.map((link) => (
        <SiteLink
          key={link.href}
          href={link.href}
          className={className}
          disabled={link.disabled}
        >
          {link.label}
        </SiteLink>
      ))}
    </span>
  ));
}

export function ImageLabel({ id, label }: { id: string; label: string }) {
  return (
    <h2 id={id} className="mt-6 mb-3 text-xl font-bold">
      {label}
    </h2>
  );
}

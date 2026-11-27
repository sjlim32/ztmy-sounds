import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";
import { TicketStrip } from "@/components/TicketStrip";
import { SOFT_BUTTON_CLASS } from "@/components/button-styles";
import { MapPinIcon } from "@/components/icons/MapPinIcon";
import { SOCIAL_PLATFORM_ICON } from "@/lib/social-platform";
import { splitParenSuffix } from "@/lib/split-paren-suffix";
import type { InfoEvent, Url } from "@/features/info/lib/types";

// 링크 버튼 — 차분한 채움 버튼을 한 단계 작게. 접수 전인 링크(disabled)는 흐리게.
const LINK_CLASS = cn(
  SOFT_BUTTON_CLASS,
  "px-2.5 py-1.5",
  "aria-disabled:pointer-events-none aria-disabled:opacity-40",
);

/**
 * 공연 정보 맨 위 포스터 아래의 공연 정보 카드 — 카드(surface) 하나에 맨 위 보딩 티켓 띠
 * (일시 · 장소 — 장소는 지도 링크, 괄호 안 "총 36공연"은 아래 줄), 아래 줄마다 라벨 + 링크
 * 버튼(티켓 신청 · 이동 방법 · 공식 링크, 줄 사이 구분선). 모바일은 라벨 아래 버튼, 태블릿
 * 이상은 같은 줄.
 */
export function EventDetails({ event }: { event: InfoEvent }) {
  const { main: place, suffix: placeNote } = splitParenSuffix(event.place);
  const rows: { label: string; content: ReactNode }[] = [
    event.url.ticket && {
      label: "티켓 신청",
      content: <LinkButtons items={event.url.ticket} />,
    },
    event.url.sub && {
      label: "이동 방법",
      content: <LinkButtons items={event.url.sub} />,
    },
    event.url.official && {
      label: "공식 링크",
      content: event.url.official.map((official) => {
        const Icon = SOCIAL_PLATFORM_ICON[official.platform];
        return (
          <SiteLink
            key={official.href}
            href={official.href}
            noIcon
            className={LINK_CLASS}
          >
            <Icon className="size-4" />
            {official.name}
          </SiteLink>
        );
      }),
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
              <dd className="flex flex-wrap gap-2">{row.content}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function LinkButtons({ items }: { items: Url[] }) {
  return items.map((item) => (
    <SiteLink
      key={item.href}
      href={item.href}
      className={LINK_CLASS}
      disabled={item.disabled}
    >
      {item.name}
    </SiteLink>
  ));
}

export function ImageLabel({ id, label }: { id: string; label: string }) {
  return (
    <h2 id={id} className="mt-6 mb-3 text-xl font-bold">
      {label}
    </h2>
  );
}

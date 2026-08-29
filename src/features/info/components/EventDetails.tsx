import { SiteLink } from "@/components/SiteLink";
import { SOCIAL_PLATFORM_ICON } from "@/lib/social-platform";
import type { InfoEvent, Url } from "@/features/info/lib/types";

interface EventDetailsProps {
  event: InfoEvent;
}

/**
 * 일시/장소/티켓/이동 방법/공식 사이트를 한 줄씩 보여주는 목록. 모바일에선
 * 라벨과 값을 위아래로 분리하고, 값이 여러 개(티켓·이동 방법)면 wrap되도록
 * 처리해 링크가 길어져도 라벨과 어색하게 붙지 않습니다.
 */
export function EventDetails({ event }: EventDetailsProps) {
  return (
    <ul className="mt-3 space-y-2.5 text-white">
      <Field label="일시">
        <span className="font-semibold">{event.date}</span>
      </Field>

      <Field label="장소">
        <SiteLink href={event.url.place} className="font-semibold">
          {event.place}
        </SiteLink>
      </Field>

      <Field label="티켓">
        <LinkList items={event.url.ticket} />
      </Field>

      {event.url.sub && (
        <Field label="이동 방법">
          <LinkList items={event.url.sub} />
        </Field>
      )}

      <Field label="공식 사이트">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {event.url.official.map((official) => {
            const Icon = SOCIAL_PLATFORM_ICON[official.platform];
            return (
              <SiteLink key={official.href} href={official.href} noIcon>
                <Icon className="h-4 w-4" />
              </SiteLink>
            );
          })}
        </span>
      </Field>
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 before:text-white/30 before:content-['-']">
      <div className="flex flex-col gap-1 tablet:flex-row tablet:items-baseline tablet:gap-2">
        <span className="shrink-0 tablet:w-20">{label}:</span>
        {children}
      </div>
    </li>
  );
}

function LinkList({ items }: { items: Url[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <SiteLink key={item.href} href={item.href} className="font-semibold">
          {item.name}
        </SiteLink>
      ))}
    </span>
  );
}

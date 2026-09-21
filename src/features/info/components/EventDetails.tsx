import { SiteLink } from "@/components/SiteLink";
import { SOCIAL_PLATFORM_ICON } from "@/lib/social-platform";
import { DetailField } from "@/features/info/components/DetailField";
import type { InfoEvent, Url } from "@/features/info/lib/types";

interface EventDetailsProps {
  event: InfoEvent;
}

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <ul className="space-y-2.5 text-white">
      <DetailField label="일시">
        <span className="font-semibold">{event.date}</span>
      </DetailField>

      <DetailField label="장소">
        <SiteLink href={event.url.place} className="font-semibold">
          {event.place}
        </SiteLink>
      </DetailField>

      {event.url.ticket && (
        <DetailField label="티켓">
          <LinkList items={event.url.ticket} />
        </DetailField>
      )}

      {event.url.sub && (
        <DetailField label="이동 방법">
          <LinkList items={event.url.sub} />
        </DetailField>
      )}

      {event.url.official && (
        <DetailField label="링크">
          <span className="tablet:self-center flex flex-wrap items-center gap-x-4 gap-y-1">
            {event.url.official.map((official) => {
              const Icon = SOCIAL_PLATFORM_ICON[official.platform];
              return (
                <SiteLink
                  key={official.href}
                  href={official.href}
                  noIcon
                  aria-label={official.name}
                  className="flex items-center gap-1"
                >
                  공식 홈페이지 <Icon className="h-4 w-4" />
                </SiteLink>
              );
            })}
          </span>
        </DetailField>
      )}
    </ul>
  );
}

function LinkList({ items }: { items: Url[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <SiteLink
          key={item.href}
          href={item.href}
          className="font-semibold"
          disabled={item.disabled}
        >
          {item.name}
        </SiteLink>
      ))}
    </span>
  );
}

export function ImageLabel({ id, label }: { id: string; label: string }) {
  return (
    <h2 id={id} className="mt-6 mb-3 text-xl font-bold">
      {label}
    </h2>
  );
}

import type { VisitEvent } from "@/data/event";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

export function NextVisit({ event }: { event: VisitEvent }) {
  return (
    <div
      data-role="next-visit"
      className="w-80 overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md"
    >
      <div className="space-y-4 p-5">
        <span className="border-ztmy-pink/40 bg-ztmy-purple/20 inline-block rounded-full border-2 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-white/80">
          NEXT VISIT
        </span>

        <a
          href={event.tourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <p
            data-role="title"
            className="hover:text-ztmy-pink text-center text-xl font-semibold text-white transition-colors"
          >
            {event.tourName}
            <ExternalLinkIcon className="ml-1 inline h-3.5 w-3.5 opacity-70" />
          </p>
        </a>

        <a
          href={event.tourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={event.tourImg}
            alt={event.tourName}
            loading="lazy"
            className="w-full rounded-xl transition-opacity hover:opacity-80"
          />
        </a>

        <div className="space-y-1 border-t border-white/10 pt-3">
          <p
            data-role="date"
            className="font-mono text-2xl font-bold text-white"
          >
            {event.date}
            <span className="ml-2 text-base font-normal text-white/50">
              {event.time}
            </span>
          </p>

          <a
            href={event.placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="venue"
            className="hover:text-ztmy-pink inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:underline"
          >
            {event.place}
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

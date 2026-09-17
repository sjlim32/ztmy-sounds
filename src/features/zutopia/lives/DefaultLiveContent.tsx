import { cn } from "@/lib/utils";
import { formatLiveDate } from "./data";
import { SongLink } from "./SongLink";
import type { LiveDetail } from "./types";

/**
 * CONTENT_BY_KEY에 이 공연 전용 콘텐츠가 없을 때 쓰는 기본 상세 뷰 —
 * 티켓/사진 같은 수동 콘텐츠는 없지만 최소한 공연 정보와 세트리스트는
 * 보여준다. 나중에 이 공연의 content.mdx를 만들면 CONTENT_BY_KEY에
 * 등록해 이 기본 뷰를 덮어쓰면 된다.
 */
export function DefaultLiveContent({ live }: { live: LiveDetail }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {live.poster_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={live.poster_image_url}
          alt={live.title}
          className="max-h-[60vh] w-auto rounded-lg object-contain"
        />
      ) : null}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">{live.title_ko}</h1>
        <p className="mt-1 text-sm text-white/60">{live.title}</p>
        <p className="mt-2 text-sm text-white/70">
          {formatLiveDate(live.live_date)} · {live.live_venue}
        </p>
      </div>

      {live.setlist.length > 0 && (
        <section className="w-full">
          <h2 className="mb-2 text-center text-sm font-semibold tracking-wide text-white/70 uppercase">
            세트리스트 ({live.setlist.length}곡)
          </h2>
          <ul
            className={cn(
              "mx-auto flex w-full max-w-md flex-col divide-y divide-white/5 overflow-hidden rounded-lg bg-black/20",
            )}
          >
            {live.setlist.map((entry, i) => (
              <li key={entry.songId}>
                <SongLink href={entry.guideHref} index={i + 1}>
                  {entry.title} ({entry.titleKo})
                </SongLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

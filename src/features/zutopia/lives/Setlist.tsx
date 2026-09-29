import { cn } from "@/lib/utils";
import { SongLink } from "@/features/zutopia/lives/SongLink";
import type { LiveSetlistEntry } from "@/features/zutopia/lives/types";

/** 공연 상세와 투어 공연일 펼침 영역이 함께 쓰는 세트리스트 목록. */
export function Setlist({ entries }: { entries: LiveSetlistEntry[] }) {
  return (
    <section className="w-full">
      <div
        className={cn(
          "flex items-baseline justify-between border-b border-white/10 pb-2",
          "tablet:pb-3",
        )}
      >
        <p
          className={cn("text-base font-semibold text-white", "tablet:text-lg")}
        >
          세트리스트
        </p>
        <p className={cn("font-mono text-xs text-white/40", "tablet:text-sm")}>
          {entries.length} songs
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-white/5">
        {entries.map((entry) => (
          <li
            key={`${entry.trackNumber}-${entry.dayNumber ?? "all"}-${entry.songId}`}
          >
            <SongLink
              href={entry.guideHref}
              index={entry.trackNumber}
              dayNumber={entry.dayNumber}
              arrange={entry.arrange}
              encore={entry.isEncore}
              selected={entry.isSelected}
            >
              {entry.title} ({entry.titleKo})
            </SongLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

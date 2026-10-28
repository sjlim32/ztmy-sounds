import { cn } from "@/lib/utils";
import type { Song } from "@/features/guide/lib/types";

function getPoints(song: Song): string[] {
  return song.description?.points?.filter((point) => point.trim()) ?? [];
}

/** 보여줄 곡 설명이 있는지 — 설명이 없거나 요약·항목이 다 비어 있으면 false. */
export function hasSongDescription(song: Song): boolean {
  return (
    !!song.description &&
    (!!song.description.summary.trim() || getPoints(song).length > 0)
  );
}

/**
 * 곡 설명 카드 — 태블릿 이상은 영상 아래, 모바일은 가사 목록 맨 위(LyricsView).
 * 곡에 설명(Song.description)이 없거나 비어 있으면 칸 자체를 그리지 않는다(빈
 * 박스에 글머리표만 남지 않게).
 */
export function SongDescriptionPanel({
  song,
  className,
}: {
  song: Song;
  className?: string;
}) {
  const description = song.description;
  const points = getPoints(song);
  if (!description || !hasSongDescription(song)) return null;

  return (
    <section
      aria-label="곡 설명"
      className={cn(
        "rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      {description.summary.trim() && (
        <p className="text-sm leading-relaxed text-white/85">
          {description.summary}
        </p>
      )}
      {points.length > 0 && (
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-white/70 first:mt-0">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

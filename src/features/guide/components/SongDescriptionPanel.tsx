import type { Song } from "@/features/guide/lib/types";

/**
 * tablet 이상: 영상 아래 곡 설명. 곡에 설명(Song.description)이 없거나 비어
 * 있으면 칸 자체를 그리지 않는다(빈 박스에 글머리표만 남지 않게).
 */
export function SongDescriptionPanel({ song }: { song: Song }) {
  const description = song.description;
  const points = description?.points?.filter((point) => point.trim()) ?? [];
  if (!description || (!description.summary.trim() && points.length === 0)) {
    return null;
  }

  return (
    <section
      aria-label="곡 설명"
      className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm"
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

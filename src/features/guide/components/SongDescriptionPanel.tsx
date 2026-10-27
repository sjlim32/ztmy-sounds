import type { Song } from "@/features/guide/lib/types";
import { getSongDescription } from "@/features/guide/lib/song-description";

/**
 * tablet 이상: 영상 아래 곡 설명(모든 곡). 곡에 description이 없으면
 * 임시 예시 문구(목데이터)를 "예시" 표시와 함께 보여준다.
 */
export function SongDescriptionPanel({ song }: { song: Song }) {
  const description = getSongDescription(song);

  return (
    <section
      aria-label="곡 설명"
      className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm"
    >
      <p className="text-sm leading-relaxed text-white/85">
        {description.summary}
      </p>
      {description.points && description.points.length > 0 && (
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-white/70">
          {description.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

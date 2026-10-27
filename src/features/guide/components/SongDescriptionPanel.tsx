import type { Song } from "@/features/guide/lib/types";
import { getSongDescription } from "@/features/guide/lib/song-description";

/**
 * tablet 이상: 영상 아래 곡 설명. 스윙 예시 GIF가 있는 곡은 그 자리를 GIF가
 * 쓰므로 GIF가 없을 때만 보인다(GuidePlayerArea). 곡에 description이 없으면
 * 임시 예시 문구(목데이터)를 "예시" 표시와 함께 보여준다.
 */
export function SongDescriptionPanel({ song }: { song: Song }) {
  const { description, isMock } = getSongDescription(song);

  return (
    <section
      aria-label="곡 설명"
      className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm"
    >
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-white/60">
        곡 설명
        {isMock && (
          <span className="rounded border border-white/20 px-1.5 py-px text-[10px] font-medium text-white/45">
            예시
          </span>
        )}
      </h3>
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

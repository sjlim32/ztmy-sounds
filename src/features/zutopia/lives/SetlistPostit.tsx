import { cn } from "@/lib/utils";
import type { SetlistChangeNote } from "@/features/zutopia/lives/setlist-diff";

/**
 * 판 사이에 달라진 곡의 포스트잇 — 그 곡의 트랙 번호 바로 위에 살짝 기울여 붙인다.
 * 어두운 목록에서 바로 보이게 종이처럼 밝은 면에 접힌 모서리. 판을 고를 때마다 key가
 * 바뀌어 새로 붙는 움직임이 나온다(animate-content-in, 동작 줄이기 설정이면 없음).
 */
export function SetlistPostit({ note }: { note: SetlistChangeNote }) {
  return (
    <div
      className={cn(
        "animate-content-in relative z-10 -mb-1 flex px-3 pt-2",
        "tablet:px-4",
      )}
    >
      <p className="relative max-w-full -rotate-1 drop-shadow-[1px_2px_3px_rgba(0,0,0,0.55)]">
        <span className="block bg-[#fff1a8] py-1 pr-3 pl-2 text-sm leading-snug break-keep text-black/75 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
          {note.timing && <span className="mr-1">{note.timing}</span>}
          <strong className="font-bold text-black">{note.label}</strong>
          {note.detail && <span className="ml-1.5">{note.detail}</span>}
        </span>
        <span
          aria-hidden
          className="absolute right-0 bottom-0 size-2 bg-[#d8c46a] [clip-path:polygon(0_0,100%_0,0_100%)]"
        />
      </p>
    </div>
  );
}

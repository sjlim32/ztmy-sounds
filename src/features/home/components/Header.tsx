import { artist } from "@/data/artist";
import { cn } from "@/lib/utils";

export function Header({ artist }: { artist: artist }) {
  return (
    <header
      className={cn(
        "hidden w-fit flex-col items-start",
        "tablet:absolute tablet:top-8 tablet:left-8 tablet:flex",
      )}
    >
      {/* 서브 텍스트 영역: Next Visit과 동일하게 가로 정렬(flex row) 및 포인트 대시 배치 */}
      <div className="mb-2 flex items-center gap-3 pl-1">
        {/* 포인트 대시: 사이트 시그니처인 pink → purple 그라데이션 (Next Visit / Countdown과 동일) */}
        <div className="from-ztmy-magenta to-ztmy-purple h-1 w-6 shrink-0 rounded-full bg-linear-to-r shadow-[0_0_10px_rgba(225,71,191,0.6)]" />

        {/* 텍스트 그룹: 한 태그로 읽히도록 폰트/트래킹 통일, 색만 대비 */}
        <div className="font-rocknroll flex items-baseline gap-2">
          <span className="text-ztmy-magenta text-base font-bold tracking-[0.3em] uppercase">
            {artist.name.en}
          </span>
          <span className="text-base font-bold tracking-widest text-white/50 uppercase">
            Fan Page
          </span>
        </div>
      </div>

      {/* 메인 텍스트: 기존과 동일한 깔끔한 화이트 솔리드 */}
      <span
        className={cn(
          "font-mkpop leading-tight font-extrabold tracking-tight text-white",
          "pc:text-6xl tablet:text-5xl",
          "drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
        )}
      >
        {artist.name.jp}
      </span>
    </header>
  );
}

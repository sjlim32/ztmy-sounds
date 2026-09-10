import { cn } from "@/lib/utils";

interface ZutopiaSectionHeaderProps {
  title: string;
  description?: string;
}

/**
 * zutopia 하위 페이지(허브/디스코그래피/카테고리) 공용 헤더 — 그라데이션
 * 액센트 바 + 큰 제목 + 선택적 부제 조합. 원래 허브 페이지 전용이던 룩
 * (ZutopiaHeader)을 각 페이지가 자기 제목/설명을 넘겨 재사용하는 형태로
 * 일반화했다. 위쪽 여백은 스스로 갖지 않는다 — zutopia/layout.tsx의
 * mt-8 래퍼가 이미 상단 간격을 맡고 있어서, 여기서 또 마진을 주면 이중으로
 * 벌어진다.
 */
export function ZutopiaSectionHeader({
  title,
  description,
}: ZutopiaSectionHeaderProps) {
  return (
    <div>
      <div className="from-ztmy-magenta to-ztmy-purple h-1 w-10 rounded-full bg-linear-to-r shadow-[0_0_10px_rgba(225,71,191,0.6)]" />
      <h1
        className={cn(
          "mt-3 text-3xl font-bold tracking-[0.3em] text-white uppercase",
          "tablet:text-4xl",
        )}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-white/60">{description}</p>
      )}
    </div>
  );
}

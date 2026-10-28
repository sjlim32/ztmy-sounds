"use client";

import { cn } from "@/lib/utils";
import { CallIcon } from "@/features/guide/components/CallIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { CALL_TAG_SHORT_LABEL } from "@/features/guide/lib/call-tag-style";

/**
 * tablet 이상: 영상 아래 "응원 표시 안내". 가사에 나오는 아이콘·배지가 무슨
 * 뜻인지 처음 온 사람도 바로 알 수 있게, 이 모드에서 보이는 응원 종류
 * (visibleTags — 응원 가이드는 스윙/클랩/콜, 슬램 가이드는 슬램)만 보여준다.
 * 누르는 기능이 없는 안내라서 항목마다 테두리·면을 두지 않는다(버튼처럼
 * 보이면 눌러 보게 된다) — 아이콘 + 이름만.
 */
export function CallLegend({
  variant = "panel",
  className,
}: {
  /** panel: 태블릿 이상 영상 아래 카드 / compact: 모바일 영상 아래 작은 한 줄 */
  variant?: "panel" | "compact";
  className?: string;
}) {
  const { visibleTags } = useGuideMode();

  if (variant === "compact") {
    return (
      <ul
        aria-label="응원 표시 안내"
        className={cn("flex min-w-0 flex-wrap gap-x-2.5 gap-y-1", className)}
      >
        {visibleTags.map((tag) => (
          <li
            key={tag}
            className="inline-flex items-center gap-0.5 text-xs whitespace-nowrap text-white/70"
          >
            <CallIcon name={tag} size={18} className="mr-0" />
            {CALL_TAG_SHORT_LABEL[tag]}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-label="응원 표시 안내"
      className={cn(
        "rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      <h3 className="mb-2 text-sm font-bold tracking-wide text-white/70">
        응원 표시 안내
      </h3>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {visibleTags.map((tag) => (
          <li key={tag} className="inline-flex items-center gap-1.5 text-sm">
            {/* 처음 온 사람도 뜻을 바로 알도록 한자·영문 라벨이 있는 큰 아이콘 */}
            <CallIcon name={tag} size={48} withLabel className="mr-0" />
            <span className="font-bold whitespace-nowrap text-white">
              {CALL_TAG_SHORT_LABEL[tag]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

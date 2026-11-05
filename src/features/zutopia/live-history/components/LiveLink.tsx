import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";
import type { LiveRef } from "@/features/zutopia/live-history/summary";

/**
 * 공연 이름 + 새 창 아이콘. 공연 상세를 새 창으로 열어, 곡 목록에서 보던
 * 자리(정렬·스크롤·열린 상세 패널)를 그대로 둔다. 상세 페이지가 없는
 * 공연(slug 없음)은 이름만 보여준다.
 * - wrap: 긴 이름을 줄바꿈한다(곡 상세의 라이브 기록 표). 기본은 한 줄로
 *   자른다(곡 목록 한 줄). 줄바꿈할 땐 아이콘이 마지막 글자 뒤에 붙어 다닌다.
 */
export function LiveLink({
  live,
  wrap = false,
  className,
}: {
  live: LiveRef;
  wrap?: boolean;
  className?: string;
}) {
  if (!live.href) {
    return (
      <span
        className={cn(
          "text-white/80",
          wrap ? "break-words" : "truncate",
          className,
        )}
      >
        {live.title}
      </span>
    );
  }

  const icon = (
    <ExternalLinkIcon
      className={cn(
        "size-3.5 shrink-0 opacity-70",
        wrap && "ml-1 inline-block align-[-0.125em]",
      )}
    />
  );
  return (
    <a
      href={live.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-white/80 transition-colors hover:text-white",
        wrap
          ? "break-words"
          : "inline-flex max-w-full min-w-0 items-center gap-1",
        className,
      )}
    >
      {wrap ? live.title : <span className="truncate">{live.title}</span>}
      {icon}
      <span className="sr-only">(새 창)</span>
    </a>
  );
}

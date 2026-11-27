import { cn } from "@/lib/utils";
import { ThumbImage } from "@/components/ThumbImage";

/**
 * 카드 그림(커버·포스터) — 줄인 이미지(ThumbImage). 그림이 없으면 같은 크기의
 * 빈 칸. displayWidth는 화면에 보이는 가장 큰 폭(px).
 */
export function EventThumb({
  src,
  className,
  displayWidth = 56,
}: {
  src: string | null;
  className: string;
  displayWidth?: number;
}) {
  return src ? (
    <ThumbImage
      src={src}
      displayWidth={displayWidth}
      draggable={false}
      className={cn(
        "rounded-card shrink-0 bg-black/40 object-cover",
        className,
      )}
    />
  ) : (
    <span
      aria-hidden
      className={cn("rounded-card block shrink-0 bg-white/5", className)}
    />
  );
}

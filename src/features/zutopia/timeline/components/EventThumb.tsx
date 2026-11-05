import { cn } from "@/lib/utils";

/** 카드 그림(커버·포스터). 그림이 없으면 같은 크기의 빈 칸. */
export function EventThumb({
  src,
  className,
}: {
  src: string | null;
  className: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      draggable={false}
      className={cn("shrink-0 rounded-md bg-black/40 object-cover", className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn("block shrink-0 rounded-md bg-white/5", className)}
    />
  );
}

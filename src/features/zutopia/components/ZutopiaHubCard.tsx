import Link from "next/link";
import { cn } from "@/lib/utils";

interface ZutopiaHubCardProps {
  /** null이면 아직 열리지 않은 카드 — 누를 수 없고 "준비 중" 칩을 단다. */
  href: string | null;
  title: string;
  /** 제목 아래 한 줄 정보 — 넘치면 말줄임. 모바일 카드 폭(약 150px)에 들어가게 짧게. */
  meta?: string;
  imageUrl?: string;
}

/**
 * 즛토피아 허브(/zutopia)의 대분류 카드(모바일 2열 · PC 한 줄 네 장). 이미지가 있으면 배경으로 꽉 채우고,
 * 없으면 ztmy 톤 그라데이션으로 대체한다. 이미지가 있을 때는 평소엔 어둡게
 * 눌러뒀다가 호버하면 밝아지면서 살짝 확대되도록(group-hover) 해서, 눌러보고
 * 싶게 만드는 대비를 준다. 준비 중인 카드는 호버 효과 없이 어둡게 둔다.
 */
export function ZutopiaHubCard({
  href,
  title,
  meta,
  imageUrl,
}: ZutopiaHubCardProps) {
  const isReady = href !== null;
  const content = (
    <>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {/* 평소엔 이미지를 살짝 어둡게 눌러뒀다가, 호버하면 걷혀서 밝아진다. */}
          <div className="absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out group-hover:opacity-0" />
        </>
      ) : (
        <div
          className={cn(
            "from-ztmy-purple to-ztmy-dark absolute inset-0 bg-linear-to-br via-black",
            !isReady && "opacity-50",
          )}
        />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

      {!isReady && (
        <span className="tablet:top-4 tablet:left-4 absolute top-3 left-3 rounded border border-white/20 bg-black/50 px-1.5 py-0.5 text-xs leading-none font-semibold text-white/70">
          준비 중
        </span>
      )}

      <div className="tablet:p-4 absolute inset-x-0 bottom-0 p-3">
        <p
          className={cn(
            "tablet:text-lg text-base leading-snug font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors",
            isReady ? "group-hover:text-ztmy-pink text-white" : "text-white/60",
          )}
        >
          {title}
        </p>
        {meta && (
          <p className="tablet:text-sm mt-1 truncate text-xs text-white/60 tabular-nums">
            {meta}
          </p>
        )}
      </div>
    </>
  );

  const baseClass = cn(
    "group relative block aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30",
    "shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
  );

  if (!isReady) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        baseClass,
        "transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "hover:border-ztmy-magenta/60 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(225,71,191,0.25)]",
      )}
    >
      {content}
    </Link>
  );
}

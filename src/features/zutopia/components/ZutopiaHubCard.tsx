import Link from "next/link";
import { cn } from "@/lib/utils";

interface ZutopiaHubCardProps {
  href: string;
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string;
}

/**
 * 즛토피아 허브(/zutopia)의 대분류 카드. 이미지가 있으면 배경으로 꽉 채우고,
 * 없으면 ztmy 톤 그라데이션으로 대체한다. 이미지가 있을 때는 평소엔 어둡게
 * 눌러뒀다가 호버하면 밝아지면서 살짝 확대되도록(group-hover) 해서, 눌러보고
 * 싶게 만드는 대비를 준다.
 */
export function ZutopiaHubCard({
  href,
  title,
  description,
  meta,
  imageUrl,
}: ZutopiaHubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30",
        "shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:border-ztmy-magenta/60 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(225,71,191,0.25)]",
      )}
    >
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          {/* 평소엔 이미지를 살짝 어둡게 눌러뒀다가, 호버하면 걷혀서 밝아진다. */}
          <div className="absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out group-hover:opacity-0" />
        </>
      ) : (
        <div className="from-ztmy-purple to-ztmy-dark absolute inset-0 bg-linear-to-br via-black" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="group-hover:text-ztmy-pink text-lg font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors">
          {title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-white/60">{description}</p>
        {meta && (
          <p className="mt-2 font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
            {meta}
          </p>
        )}
      </div>
    </Link>
  );
}

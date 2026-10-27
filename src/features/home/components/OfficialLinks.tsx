import Image from "next/image";
import { cn } from "@/lib/utils";
import { OFFICIAL_ICON_LINKS } from "@/data/social-links";
import { FOCUS_RING } from "@/components/button-styles";

/**
 * 태블릿 이상 홈 오른쪽 위의 아티스트 공식 링크 묶음. 모바일은 상단 바의
 * 공식 링크 버튼이 이름까지 붙은 시트(OfficialLinksSheet)로 연다.
 */
export function OfficialLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="아티스트 공식 링크"
      className={cn("flex flex-col items-end gap-1.5", className)}
    >
      <p className="font-mono text-xs tracking-[0.3em] text-white/60 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        Official
      </p>
      <ul className="flex items-center gap-2">
        {OFFICIAL_ICON_LINKS.map(({ name, url, icon }) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={name}
              className={cn(
                "block rounded-sm opacity-85 transition-opacity hover:opacity-100",
                FOCUS_RING,
              )}
            >
              <Image
                src={icon.src}
                alt={name}
                width={Math.round(icon.width / 2)}
                height={Math.round(icon.height / 2)}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

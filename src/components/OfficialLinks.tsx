import Image from "next/image";
import { cn } from "@/lib/utils";
import { OFFICIAL_ICON_LINKS } from "@/data/social-links";
import { FOCUS_RING } from "@/components/button-styles";

// 원본 아이콘은 높이 48px — 화면엔 이 높이로 줄여 그린다.
const ICON_HEIGHT = 20;

/**
 * 아티스트 공식 링크 아이콘 줄 — 푸터에서 저작권 표기 옆(PC)·위(모바일)에 둔다.
 * 아이콘만으론 메인·스태프 계정이 구분되지 않아서, 계정 이름을 대체 텍스트와
 * 마우스를 올렸을 때 뜨는 설명(title)으로 준다.
 */
export function OfficialLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="아티스트 공식 링크" className={className}>
      <ul className="flex items-center gap-2">
        {OFFICIAL_ICON_LINKS.map(({ name, url, icon }) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={name}
              className={cn(
                "block rounded-sm opacity-80 transition-opacity hover:opacity-100",
                FOCUS_RING,
              )}
            >
              <Image
                src={icon.src}
                alt={name}
                width={Math.round((icon.width * ICON_HEIGHT) / icon.height)}
                height={ICON_HEIGHT}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

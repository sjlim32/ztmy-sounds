"use client";

import { usePathname } from "next/navigation";
import { ARTIST } from "@/app/(pages)/page";

/**
 * 모바일 전용 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠
 * 맨 아래에 일반 흐름으로 붙습니다.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않습니다.
 */
export function MobileFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/guide/")) return null;

  return (
    <footer className="tablet:hidden border-t border-white/10 px-4 py-3 text-center text-[10px] text-white/40">
      © {ARTIST.name.jp} · Unofficial fan page
    </footer>
  );
}

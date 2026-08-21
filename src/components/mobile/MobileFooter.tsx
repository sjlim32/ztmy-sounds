import { ARTIST } from "@/app/(pages)/page";

/**
 * 모바일 전용 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠
 * 맨 아래에 일반 흐름으로 붙습니다.
 */
export function MobileFooter() {
  return (
    <footer className="tablet:hidden border-t border-white/10 px-4 py-3 text-center text-[10px] text-white/40">
      © {ARTIST.name.jp} · Unofficial fan page
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";

/**
 * tablet 이상 전용 상단 내비게이션(뒤로가기 + 홈으로). 모바일은 전역
 * MobileHeader가 이미 뒤로가기/홈 버튼을 제공하므로(/components/mobile/
 * MobileHeader.tsx) 여기서는 /info/page.tsx와 동일하게 tablet 이상에서만
 * 보여줘 중복을 피합니다.
 *
 * 뒤로가기는 브라우저 history(router.back())가 아니라 현재 경로에서 마지막
 * 세그먼트 하나를 뗀 상위 뎁스로 이동합니다 — /zutopia/concerts/sound-
 * planet-2026 → /zutopia/concerts → /zutopia처럼, 실제로 어떻게 들어왔는지와
 * 무관하게 항상 이 페이지의 계층 구조를 기준으로 동작해야 하기 때문입니다
 * (history back은 외부 링크로 바로 진입했거나 여러 단계를 건너뛴 경우
 * 엉뚱한 곳으로 이동함).
 */
export function ZutopiaTopNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  segments.pop();
  const parentHref = segments.length ? `/${segments.join("/")}` : "/";

  const navLinkClass =
    "group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/70 backdrop-blur-sm transition-colors hover:border-ztmy-magenta/60 hover:text-white";

  return (
    <div className="tablet:flex hidden items-center justify-between">
      <Link href={parentHref} className={navLinkClass}>
        <ChevronLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        뒤로가기
      </Link>

      <Link href="/" className={navLinkClass}>
        <HomeIcon className="h-4 w-4" />
        홈으로
      </Link>
    </div>
  );
}

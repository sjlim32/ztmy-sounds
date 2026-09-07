"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * tablet 이상 전용 상단 내비게이션(뒤로가기 + 홈으로). 모바일은 전역
 * MobileHeader가 이미 뒤로가기/홈 버튼을 제공하므로(/components/mobile/
 * MobileHeader.tsx) 여기서는 /info/page.tsx와 동일하게 tablet 이상에서만
 * 보여줘 중복을 피합니다. router.back()이 필요해 layout.tsx(서버 컴포넌트,
 * metadata export) 대신 별도 클라이언트 컴포넌트로 둡니다.
 */
export function ZutopiaTopNav() {
  const router = useRouter();

  return (
    <div className="tablet:flex hidden items-center justify-between">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-white/60 transition-colors hover:text-white"
      >
        ← 뒤로가기
      </button>

      <Link
        href="/"
        className="text-sm text-white/60 transition-colors hover:text-white"
      >
        홈으로 →
      </Link>
    </div>
  );
}

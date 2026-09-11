import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { HomeLink } from "@/components/HomeLink";
import { SiteLink } from "@/components/SiteLink";

export const metadata: Metadata = {
  title: "출처",
  description: "사이트에 사용된 리소스 저작자분들입니다.",
};

interface Credit {
  name: string;
  role: string;
  url?: string;
}

const CREDITS: Credit[] = [
  {
    name: "즛토마요 갤러리 - ♿ 내한 대비 샤모지 호응 가이드",
    role: "콜가이드",
    url: "https://gall.dcinside.com/mgallery/board/view/?id=zuttomayo&no=231225&page=1",
  },
  {
    name: "乱涂乱画ben",
    role: "마우스 커서 디자인",
    url: "https://x.com/ben404yg",
  },
];

export default function CreditsPage() {
  return (
    <main
      className={cn(
        // 앱 셸이 overflow-hidden 고정 레이아웃이라, 콘텐츠가 늘어날 걸
        // 대비해 자기 <main>에서 직접 스크롤을 열어둡니다 (/info/page.tsx와
        // 동일한 패턴).
        "min-h-0 w-full flex-1 overflow-y-auto scroll-smooth",
        "mx-auto px-3",
        "tablet:max-w-2xl tablet:px-6 tablet:py-16",
      )}
    >
      <HomeLink label="홈으로" className="tablet:inline-flex hidden" />

      <h1 className="tablet:mt-6 mt-3 text-2xl font-bold text-white">출처</h1>
      <p className="mt-2 text-sm text-white/60">
        사이트에 사용된 리소스 저작자분들입니다.
      </p>

      <ul className="tablet:mt-8 mt-3 space-y-3">
        {CREDITS.map((credit) => (
          <li key={credit.name} className="rounded-lg bg-black/30 p-4">
            <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
              {credit.role}
            </p>
            {credit.url ? (
              <SiteLink
                href={credit.url}
                className="mt-1 inline-block text-lg font-semibold"
              >
                {credit.name}
              </SiteLink>
            ) : (
              <p className="mt-1 text-lg font-semibold text-white">
                {credit.name}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

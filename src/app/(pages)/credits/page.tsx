import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        "mx-auto px-3 pt-6 pb-10",
        "tablet:max-w-2xl tablet:px-6 tablet:py-16",
      )}
    >
      <Link
        href="/"
        className="text-sm text-white/60 transition-colors hover:text-white"
      >
        ← 홈으로
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-white">도움주신 분들</h1>
      <p className="mt-2 text-sm text-white/60">
        사이트를 만드는 데 도움을 주신 분들입니다.
      </p>

      <ul className="mt-8 space-y-3">
        {CREDITS.map((credit) => (
          <li key={credit.name} className="rounded-lg bg-black/30 p-4">
            <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
              {credit.role}
            </p>
            {credit.url ? (
              <a
                href={credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ztmy-pink mt-1 inline-block text-lg font-semibold text-white transition-colors"
              >
                {credit.name}
              </a>
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

import type { Metadata } from "next";
import Link from "next/link";
import InfoContent from "@/features/info/info.mdx";
import { originEvent } from "@/data/event";
import { cn } from "@/lib/utils";
import { buildMusicEventJsonLd } from "@/lib/structured-data";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

// /info는 현재 안내 중인 공연(INFORMATION, info.tsx)의 상세 정보를 보여주는
// 페이지라, 메타데이터도 그 공연과 같은 이벤트를 가리켜야 합니다. INFORMATION은
// originEvent(NEXT STAGE)와 같은 공연을 다루므로 originEvent를 씁니다 — 이
// 페이지가 안내하는 공연이 바뀌면 event.ts에서 어느 이벤트가 "현재"인지도
// 함께 바뀌니 여기도 맞춰 갱신해야 합니다.
const description = `${originEvent.tourName} 공연 일정과 장소, 유의사항 안내.`;
const SCROLL_CONTAINER_ID = "info-scroll-container";

export const metadata: Metadata = {
  title: "공연 정보",
  description,
  openGraph: {
    title: originEvent.tourName,
    description,
    images: [{ url: originEvent.tourImg }],
  },
  twitter: {
    card: "summary_large_image",
    title: originEvent.tourName,
    description,
    images: [originEvent.tourImg],
  },
};

export default function InfoPage() {
  return (
    <main
      id={SCROLL_CONTAINER_ID}
      className={cn(
        "min-h-0 w-full flex-1 overflow-y-auto scroll-smooth",
        "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
      )}
    >
      <ScrollToTopButton containerId={SCROLL_CONTAINER_ID} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildMusicEventJsonLd(originEvent)),
        }}
      />

      <div
        className={cn(
          "mx-auto w-full px-3 pt-6 pb-10",
          "tablet:max-w-4xl tablet:px-6 tablet:py-16",
        )}
      >
        <Link
          href="/"
          className="tablet:block hidden text-sm text-white/60 hover:text-white"
        >
          ← 홈으로
        </Link>

        <div className="mt-6">
          <InfoContent />
        </div>
      </div>
    </main>
  );
}

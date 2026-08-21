import type { Metadata } from "next";
import Link from "next/link";
import InfoContent from "@/content/info.mdx";
import { visitEvent } from "@/data/event";

export const metadata: Metadata = {
  title: "공연 정보",
  description: `${visitEvent.tourName} 공연 일정과 장소, 유의사항 안내.`,
};

export default function InfoPage() {
  return (
    <main className="tablet:max-w-2xl mx-auto w-full px-6 py-16">
      <Link
        href="/"
        className="tablet:block hidden text-sm text-white/60 hover:text-white"
      >
        ← 홈으로
      </Link>

      <div className="mt-6 space-y-6">
        <InfoContent />
      </div>
    </main>
  );
}

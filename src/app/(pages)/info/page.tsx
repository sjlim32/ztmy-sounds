import type { Metadata } from "next";
import Link from "next/link";
import InfoContent from "@/features/info/info.mdx";
import { visitEvent } from "@/data/event";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "공연 정보",
  description: `${visitEvent.tourName} 공연 일정과 장소, 유의사항 안내.`,
};

export default function InfoPage() {
  return (
    <main
      className={cn(
        "tablet:max-w-4xl mx-auto min-h-0 w-full flex-1 overflow-y-auto px-6 py-16",
        "scrollbar-thin [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.3)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/30",
      )}
    >
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

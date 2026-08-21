import Link from "next/link";
import { visitEvent } from "@/data/event";
import { Header } from "@/components/home/Header";
import { NextVisit } from "@/components/home/NextVisit";
import { Countdown } from "@/components/home/Countdown";
import { MicIcon } from "@/components/icons/MicIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";

export interface artist {
  name: {
    jp: string;
    kr: string;
    en: string;
  };
}

export const ARTIST: artist = {
  name: {
    jp: "ずっと真夜中でいいのに。",
    kr: "계속 한밤중이면 좋을 텐데",
    en: "ZUTOMAYO",
  },
};

export default function Home() {
  return (
    <>
      <Header artist={ARTIST} />

      <main data-role="hero">
        <section
          id="main-left"
          data-role="visit-info"
          className="fixed top-1/2 left-10 flex -translate-y-1/2 flex-col gap-6"
        >
          <NextVisit event={visitEvent} />

          <Countdown event={visitEvent} />
        </section>

        <nav
          id="main-right"
          data-role="site-nav"
          className="fixed top-1/2 right-10 flex -translate-y-1/2 flex-col items-end gap-3"
        >
          <Link
            href="/guide"
            className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm transition-colors"
          >
            <MicIcon className="group-hover:text-ztmy-pink h-4 w-4 text-white/60 transition-colors" />
            <span className="group-hover:text-ztmy-pink font-medium text-white transition-colors">
              콜가이드
            </span>
          </Link>

          <Link
            href="/info"
            className="group hover:border-ztmy-pink/40 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-sm transition-colors"
          >
            <InfoIcon className="group-hover:text-ztmy-pink h-4 w-4 text-white/60 transition-colors" />
            <span className="group-hover:text-ztmy-pink font-medium text-white transition-colors">
              공연 정보
            </span>
          </Link>
        </nav>
      </main>
    </>
  );
}

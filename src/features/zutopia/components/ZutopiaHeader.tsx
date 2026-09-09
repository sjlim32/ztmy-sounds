"use client";

import { usePathname } from "next/navigation";
import { ARTIST } from "@/data/artist";

/**
 * "ZUTOPIA" 제목 + 설명. 최상위(/zutopia) 목록 페이지에서만 보여주고,
 * 카테고리 목록/항목 상세처럼 하위 뎁스로 들어가면 감춥니다 — 그 안에서는
 * [category]/layout.tsx의 탭 nav나 content.mdx 자체의 제목이 이미 맥락을
 * 보여줘서 이 상단 제목이 중복됩니다.
 */
export function ZutopiaHeader() {
  const pathname = usePathname();
  if (pathname !== "/zutopia") return null;

  return (
    <>
      <div className="from-ztmy-magenta to-ztmy-purple mt-6 h-1 w-10 rounded-full bg-linear-to-r shadow-[0_0_10px_rgba(225,71,191,0.6)]" />
      <h1 className="mt-3 text-3xl font-bold tracking-[0.3em] text-white uppercase">
        ZUTOPIA
      </h1>
      <p className="mt-2 text-sm text-white/60">{ARTIST.name.jp} 기록 저장소</p>
    </>
  );
}
